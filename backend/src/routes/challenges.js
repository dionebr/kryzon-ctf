const express = require('express');
const { body, validationResult, param } = require('express-validator');
const DatabaseService = require('../services/DatabaseService');
const auth = require('../middleware/auth');
const { createLogger } = require('winston');

const router = express.Router();
const logger = createLogger({ level: 'info' });

// GET /api/challenges - List published challenges
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    
    let query = `
      SELECT 
        id, slug, name, description, difficulty, category, points, image_tag,
        port, created_at, published, author
      FROM challenges 
      WHERE published = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (difficulty) {
      paramCount++;
      query += ` AND difficulty = $${paramCount}`;
      params.push(difficulty);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await DatabaseService.query(query, params);
    
    res.json({
      challenges: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    logger.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// GET /api/challenges/:slug - Get specific challenge details
router.get('/:slug', [
  param('slug').isSlug().withMessage('Invalid challenge slug')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug } = req.params;
    
    const result = await DatabaseService.query(`
      SELECT 
        id, slug, name, description, difficulty, category, points, 
        image_tag, port, created_at, published, author, hints
      FROM challenges 
      WHERE slug = $1 AND published = true
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = result.rows[0];

    // Get challenge statistics
    const statsResult = await DatabaseService.query(`
      SELECT 
        COUNT(DISTINCT i.id) as total_attempts,
        COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END) as completions
      FROM instances i
      WHERE i.challenge_id = $1
    `, [challenge.id]);

    challenge.stats = statsResult.rows[0];

    res.json(challenge);

  } catch (error) {
    logger.error('Get challenge details error:', error);
    res.status(500).json({ error: 'Failed to fetch challenge details' });
  }
});

// GET /api/challenges/categories - Get available categories
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await DatabaseService.query(`
      SELECT DISTINCT category 
      FROM challenges 
      WHERE published = true AND category IS NOT NULL
      ORDER BY category
    `);

    res.json({
      categories: result.rows.map(row => row.category)
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/challenges/:slug/submit-flag - Submit flag for challenge
router.post('/:slug/submit-flag', [
  auth,
  param('slug').isSlug().withMessage('Invalid challenge slug'),
  body('flag').trim().notEmpty().withMessage('Flag is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug } = req.params;
    const { flag } = req.body;
    const userId = req.user.userId;

    // Get challenge and flag
    const challengeResult = await DatabaseService.query(`
      SELECT c.id, c.name, f.flag_value 
      FROM challenges c
      LEFT JOIN flags f ON c.id = f.challenge_id
      WHERE c.slug = $1 AND c.published = true
    `, [slug]);

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];
    const isCorrect = flag.trim() === challenge.flag_value;

    // Record submission
    await DatabaseService.query(`
      INSERT INTO flag_submissions (challenge_id, user_id, submitted_flag, is_correct, submitted_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [challenge.id, userId, flag, isCorrect]);

    if (isCorrect) {
      // Mark challenge as completed by user
      await DatabaseService.query(`
        INSERT INTO user_completions (user_id, challenge_id, completed_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, challenge_id) DO NOTHING
      `, [userId, challenge.id]);

      logger.info(`User ${req.user.username} completed challenge: ${challenge.name}`);

      res.json({
        correct: true,
        message: 'Congratulations! Flag is correct!',
        challenge: challenge.name
      });
    } else {
      res.json({
        correct: false,
        message: 'Flag is incorrect. Try again!'
      });
    }

  } catch (error) {
    logger.error('Submit flag error:', error);
    res.status(500).json({ error: 'Failed to submit flag' });
  }
});

module.exports = router;