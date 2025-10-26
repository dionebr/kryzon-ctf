const express = require('express');
const { body, validationResult, param } = require('express-validator');
const DatabaseService = require('../services/DatabaseService');
const DockerService = require('../services/DockerService');
const auth = require('../middleware/auth');
const { createLogger } = require('winston');

const router = express.Router();
const logger = createLogger({ level: 'info' });

// GET /api/instances - Get user's active instances
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await DatabaseService.query(`
      SELECT 
        i.id, i.container_name, i.host_url, i.started_at, i.status, i.ttl_seconds,
        c.name as challenge_name, c.slug as challenge_slug, c.difficulty
      FROM instances i
      JOIN challenges c ON i.challenge_id = c.id
      WHERE i.owner_user_id = $1 AND i.status IN ('running', 'starting')
      ORDER BY i.started_at DESC
    `, [userId]);

    const instances = result.rows.map(instance => ({
      ...instance,
      time_remaining: instance.ttl_seconds ? 
        Math.max(0, instance.ttl_seconds - Math.floor((Date.now() - new Date(instance.started_at).getTime()) / 1000)) : null
    }));

    res.json({ instances });

  } catch (error) {
    logger.error('Get instances error:', error);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
});

// POST /api/instances - Start new instance
router.post('/', [
  auth,
  body('challenge_slug').isSlug().withMessage('Valid challenge slug is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { challenge_slug } = req.body;
    const userId = req.user.userId;

    // Check if user has reached max instances
    const activeInstancesResult = await DatabaseService.query(`
      SELECT COUNT(*) as count 
      FROM instances 
      WHERE owner_user_id = $1 AND status IN ('running', 'starting')
    `, [userId]);

    const maxInstances = parseInt(process.env.MAX_INSTANCES_PER_USER) || 3;
    if (parseInt(activeInstancesResult.rows[0].count) >= maxInstances) {
      return res.status(429).json({ 
        error: `Maximum ${maxInstances} instances allowed per user` 
      });
    }

    // Get challenge details
    const challengeResult = await DatabaseService.query(`
      SELECT id, name, slug, image_tag, port, difficulty 
      FROM challenges 
      WHERE slug = $1 AND published = true
    `, [challenge_slug]);

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    // Generate unique container name
    const timestamp = Date.now();
    const containerName = `kryzon_${challenge.slug}_${userId}_${timestamp}`;
    
    // Get available port
    const hostPort = await DockerService.findAvailablePort();
    
    // Create instance record
    const ttlSeconds = (parseInt(process.env.DEFAULT_TTL_HOURS) || 2) * 3600;
    const instanceResult = await DatabaseService.query(`
      INSERT INTO instances (
        challenge_id, container_name, host_url, started_at, status, 
        ttl_seconds, owner_user_id, host_port
      )
      VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)
      RETURNING id, host_url
    `, [
      challenge.id, 
      containerName, 
      `http://vm-${timestamp}.${process.env.CTF_DOMAIN}`,
      'starting', 
      ttlSeconds, 
      userId,
      hostPort
    ]);

    const instance = instanceResult.rows[0];

    // Start container asynchronously
    DockerService.startInstance(containerName, challenge, hostPort, instance.id)
      .then(async (result) => {
        if (result.success) {
          await DatabaseService.query(`
            UPDATE instances 
            SET status = 'running', container_id = $2
            WHERE id = $1
          `, [instance.id, result.containerId]);
          
          logger.info(`Instance started successfully: ${containerName}`);
        } else {
          await DatabaseService.query(`
            UPDATE instances 
            SET status = 'failed', error_message = $2
            WHERE id = $1
          `, [instance.id, result.error]);
          
          logger.error(`Failed to start instance: ${containerName} - ${result.error}`);
        }
      })
      .catch(async (error) => {
        await DatabaseService.query(`
          UPDATE instances 
          SET status = 'failed', error_message = $2
          WHERE id = $1
        `, [instance.id, error.message]);
        
        logger.error(`Instance startup error: ${containerName}`, error);
      });

    res.status(202).json({
      message: 'Instance is being created',
      instance: {
        id: instance.id,
        challenge_name: challenge.name,
        challenge_slug: challenge.slug,
        host_url: instance.host_url,
        status: 'starting',
        ttl_seconds: ttlSeconds
      }
    });

  } catch (error) {
    logger.error('Create instance error:', error);
    res.status(500).json({ error: 'Failed to create instance' });
  }
});

// GET /api/instances/:id/status - Get instance status
router.get('/:id/status', [
  auth,
  param('id').isInt().withMessage('Valid instance ID is required')
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await DatabaseService.query(`
      SELECT 
        i.id, i.container_name, i.host_url, i.started_at, i.status, 
        i.ttl_seconds, i.error_message, i.container_id,
        c.name as challenge_name, c.slug as challenge_slug
      FROM instances i
      JOIN challenges c ON i.challenge_id = c.id
      WHERE i.id = $1 AND i.owner_user_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const instance = result.rows[0];

    // Calculate time remaining
    let timeRemaining = null;
    if (instance.ttl_seconds && instance.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(instance.started_at).getTime()) / 1000);
      timeRemaining = Math.max(0, instance.ttl_seconds - elapsed);
    }

    // Check container health if running
    let containerHealth = null;
    if (instance.status === 'running' && instance.container_id) {
      try {
        containerHealth = await DockerService.getContainerHealth(instance.container_id);
      } catch (error) {
        logger.warn(`Failed to get container health for ${instance.container_name}: ${error.message}`);
      }
    }

    res.json({
      ...instance,
      time_remaining: timeRemaining,
      container_health: containerHealth
    });

  } catch (error) {
    logger.error('Get instance status error:', error);
    res.status(500).json({ error: 'Failed to get instance status' });
  }
});

// POST /api/instances/:id/stop - Stop instance
router.post('/:id/stop', [
  auth,
  param('id').isInt().withMessage('Valid instance ID is required')
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await DatabaseService.query(`
      SELECT container_name, container_id, status
      FROM instances 
      WHERE id = $1 AND owner_user_id = $2 AND status IN ('running', 'starting')
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instance not found or already stopped' });
    }

    const instance = result.rows[0];

    // Stop container
    try {
      if (instance.container_id) {
        await DockerService.stopContainer(instance.container_id);
      }
      
      // Update instance status
      await DatabaseService.query(`
        UPDATE instances 
        SET status = 'stopped', stopped_at = NOW()
        WHERE id = $1
      `, [id]);

      logger.info(`Instance stopped: ${instance.container_name}`);

      res.json({ message: 'Instance stopped successfully' });

    } catch (dockerError) {
      logger.error(`Failed to stop container ${instance.container_name}:`, dockerError);
      
      // Update status to failed
      await DatabaseService.query(`
        UPDATE instances 
        SET status = 'failed', error_message = $2
        WHERE id = $1
      `, [id, dockerError.message]);

      res.status(500).json({ error: 'Failed to stop instance' });
    }

  } catch (error) {
    logger.error('Stop instance error:', error);
    res.status(500).json({ error: 'Failed to stop instance' });
  }
});

// POST /api/instances/:id/extend - Extend instance TTL
router.post('/:id/extend', [
  auth,
  param('id').isInt().withMessage('Valid instance ID is required'),
  body('hours').isInt({ min: 1, max: 6 }).withMessage('Hours must be between 1 and 6')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { hours } = req.body;
    const userId = req.user.userId;

    const result = await DatabaseService.query(`
      SELECT ttl_seconds, started_at
      FROM instances 
      WHERE id = $1 AND owner_user_id = $2 AND status = 'running'
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active instance not found' });
    }

    const additionalSeconds = hours * 3600;
    const newTtl = result.rows[0].ttl_seconds + additionalSeconds;

    await DatabaseService.query(`
      UPDATE instances 
      SET ttl_seconds = $2
      WHERE id = $1
    `, [id, newTtl]);

    logger.info(`Instance ${id} TTL extended by ${hours} hours`);

    res.json({ 
      message: `Instance lifetime extended by ${hours} hours`,
      new_ttl_seconds: newTtl
    });

  } catch (error) {
    logger.error('Extend instance error:', error);
    res.status(500).json({ error: 'Failed to extend instance' });
  }
});

module.exports = router;