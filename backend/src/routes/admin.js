const express = require('express');
const { body, validationResult, param } = require('express-validator');
const DatabaseService = require('../services/DatabaseService');
const DockerService = require('../services/DockerService');
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');
const { createLogger } = require('winston');

const router = express.Router();
const logger = createLogger({ level: 'info' });

// Apply auth to all admin routes
router.use(auth);
router.use(adminAuth);

// GET /api/admin/dashboard - Admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get various statistics
    const [usersResult, challengesResult, instancesResult, activeInstancesResult] = await Promise.all([
      DatabaseService.query('SELECT COUNT(*) as count FROM users'),
      DatabaseService.query('SELECT COUNT(*) as count FROM challenges WHERE published = true'),
      DatabaseService.query('SELECT COUNT(*) as count FROM instances'),
      DatabaseService.query('SELECT COUNT(*) as count FROM instances WHERE status = \'running\'')
    ]);

    // Get recent activity
    const recentActivity = await DatabaseService.query(`
      SELECT 
        'instance_created' as type,
        i.started_at as timestamp,
        u.username,
        c.name as challenge_name
      FROM instances i
      JOIN users u ON i.owner_user_id = u.id
      JOIN challenges c ON i.challenge_id = c.id
      ORDER BY i.started_at DESC
      LIMIT 10
    `);

    // Get challenge completion stats
    const challengeStats = await DatabaseService.query(`
      SELECT 
        c.name,
        c.difficulty,
        COUNT(i.id) as total_attempts,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completions
      FROM challenges c
      LEFT JOIN instances i ON c.id = i.challenge_id
      WHERE c.published = true
      GROUP BY c.id, c.name, c.difficulty
      ORDER BY total_attempts DESC
    `);

    res.json({
      stats: {
        users: parseInt(usersResult.rows[0].count),
        challenges: parseInt(challengesResult.rows[0].count),
        total_instances: parseInt(instancesResult.rows[0].count),
        active_instances: parseInt(activeInstancesResult.rows[0].count)
      },
      recent_activity: recentActivity.rows,
      challenge_stats: challengeStats.rows
    });

  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/challenges - Get all challenges (including unpublished)
router.get('/challenges', async (req, res) => {
  try {
    const result = await DatabaseService.query(`
      SELECT 
        id, slug, name, description, difficulty, category, points, 
        image_tag, port, created_at, published, author
      FROM challenges 
      ORDER BY created_at DESC
    `);

    res.json({ challenges: result.rows });

  } catch (error) {
    logger.error('Admin get challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// POST /api/admin/challenges - Create new challenge
router.post('/challenges', [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('slug').isSlug().withMessage('Valid slug is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('difficulty').isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('image_tag').trim().notEmpty().withMessage('Docker image tag is required'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Valid port number is required'),
  body('flag_value').trim().notEmpty().withMessage('Flag value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, slug, description, difficulty, category, points, 
      image_tag, port, flag_value, hints, published = false
    } = req.body;

    // Check if slug already exists
    const existingChallenge = await DatabaseService.query(
      'SELECT id FROM challenges WHERE slug = $1',
      [slug]
    );

    if (existingChallenge.rows.length > 0) {
      return res.status(409).json({ error: 'Challenge slug already exists' });
    }

    // Create challenge
    const challengeResult = await DatabaseService.query(`
      INSERT INTO challenges (
        slug, name, description, difficulty, category, points,
        image_tag, port, created_at, published, author, hints
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11)
      RETURNING id
    `, [slug, name, description, difficulty, category, points, image_tag, port, published, req.user.username, hints]);

    const challengeId = challengeResult.rows[0].id;

    // Create flag
    await DatabaseService.query(`
      INSERT INTO flags (challenge_id, flag_value, created_at)
      VALUES ($1, $2, NOW())
    `, [challengeId, flag_value]);

    logger.info(`Challenge created by ${req.user.username}: ${name} (${slug})`);

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge: {
        id: challengeId,
        slug,
        name,
        published
      }
    });

  } catch (error) {
    logger.error('Create challenge error:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// PUT /api/admin/challenges/:id/publish - Publish/unpublish challenge
router.put('/challenges/:id/publish', [
  param('id').isInt().withMessage('Valid challenge ID is required'),
  body('published').isBoolean().withMessage('Published must be boolean')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    const result = await DatabaseService.query(`
      UPDATE challenges 
      SET published = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING slug, name, published
    `, [published, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = result.rows[0];
    
    logger.info(`Challenge ${published ? 'published' : 'unpublished'} by ${req.user.username}: ${challenge.name}`);

    res.json({
      message: `Challenge ${published ? 'published' : 'unpublished'} successfully`,
      challenge
    });

  } catch (error) {
    logger.error('Publish challenge error:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

// GET /api/admin/instances - Get all instances with detailed info
router.get('/instances', async (req, res) => {
  try {
    const { status, user } = req.query;
    
    let query = `
      SELECT 
        i.id, i.container_name, i.container_id, i.host_url, i.host_port,
        i.started_at, i.stopped_at, i.status, i.ttl_seconds, i.error_message,
        c.name as challenge_name, c.slug as challenge_slug, c.difficulty,
        u.username as owner_username
      FROM instances i
      JOIN challenges c ON i.challenge_id = c.id
      JOIN users u ON i.owner_user_id = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push(`i.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (user) {
      conditions.push(`u.username ILIKE $${params.length + 1}`);
      params.push(`%${user}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY i.started_at DESC';
    
    const result = await DatabaseService.query(query, params);

    // Add time remaining calculation
    const instances = result.rows.map(instance => {
      let timeRemaining = null;
      if (instance.ttl_seconds && instance.started_at && instance.status === 'running') {
        const elapsed = Math.floor((Date.now() - new Date(instance.started_at).getTime()) / 1000);
        timeRemaining = Math.max(0, instance.ttl_seconds - elapsed);
      }
      
      return {
        ...instance,
        time_remaining: timeRemaining
      };
    });

    res.json({ instances });

  } catch (error) {
    logger.error('Admin get instances error:', error);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
});

// POST /api/admin/instances/:id/force-stop - Force stop any instance
router.post('/instances/:id/force-stop', [
  param('id').isInt().withMessage('Valid instance ID is required')
], async (req, res) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(`
      SELECT container_name, container_id, status, owner_user_id
      FROM instances 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const instance = result.rows[0];

    // Stop container if running
    if (instance.container_id && instance.status === 'running') {
      try {
        await DockerService.stopContainer(instance.container_id);
      } catch (dockerError) {
        logger.warn(`Failed to stop container ${instance.container_name}: ${dockerError.message}`);
      }
    }
    
    // Update instance status
    await DatabaseService.query(`
      UPDATE instances 
      SET status = 'stopped', stopped_at = NOW()
      WHERE id = $1
    `, [id]);

    logger.info(`Instance force-stopped by admin ${req.user.username}: ${instance.container_name}`);

    res.json({ message: 'Instance stopped successfully' });

  } catch (error) {
    logger.error('Force stop instance error:', error);
    res.status(500).json({ error: 'Failed to stop instance' });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await DatabaseService.query(`
      SELECT 
        u.id, u.username, u.email, u.role, u.created_at,
        COUNT(i.id) as total_instances,
        COUNT(uc.challenge_id) as completed_challenges
      FROM users u
      LEFT JOIN instances i ON u.id = i.owner_user_id
      LEFT JOIN user_completions uc ON u.id = uc.user_id
      GROUP BY u.id, u.username, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json({ users: result.rows });

  } catch (error) {
    logger.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', [
  param('id').isInt().withMessage('Valid user ID is required'),
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const result = await DatabaseService.query(`
      UPDATE users 
      SET role = $1
      WHERE id = $2
      RETURNING username, role
    `, [role, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    logger.info(`User role updated by ${req.user.username}: ${user.username} -> ${role}`);

    res.json({
      message: 'User role updated successfully',
      user
    });

  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/logs - Get system logs
router.get('/logs', async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    
    // This would typically read from log files or a logging service
    // For now, return instance and authentication logs from database
    let query = `
      SELECT 
        'instance' as type,
        i.started_at as timestamp,
        CONCAT('Instance ', i.status, ': ', c.name, ' by ', u.username) as message,
        json_build_object(
          'instance_id', i.id,
          'challenge', c.slug,
          'user', u.username,
          'status', i.status
        ) as details
      FROM instances i
      JOIN challenges c ON i.challenge_id = c.id
      JOIN users u ON i.owner_user_id = u.id
      ORDER BY i.started_at DESC
      LIMIT $1
    `;
    
    const result = await DatabaseService.query(query, [parseInt(limit)]);

    res.json({ logs: result.rows });

  } catch (error) {
    logger.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;