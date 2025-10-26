const { Pool } = require('pg');
const { createLogger } = require('winston');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.logger = createLogger({ level: 'info' });
  }

  async initialize() {
    try {
      this.pool = new Pool({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.logger.info('Database connection established successfully');

      // Run migrations
      await this.runMigrations();

    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async runMigrations() {
    // Check if schema is already initialized (has uuid extension)
    const result = await this.query(`
      SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
    `);
    
    if (result.rows.length > 0) {
      this.logger.info('Database schema already initialized by init script, skipping migrations');
      return;
    }

    // If no UUID extension, run legacy migrations for backward compatibility
    const migrations = [
      // Create UUID extension
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
      
      // Users table (using UUID, same as init script)
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true
      )`,

      // Challenges table (using UUID, same as init script)
      `CREATE TABLE IF NOT EXISTS challenges (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
        points INTEGER NOT NULL DEFAULT 100,
        flag VARCHAR(255) NOT NULL,
        docker_image VARCHAR(255),
        docker_ports TEXT,
        access_info TEXT,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      )`,

      // Challenge instances table (using UUID, same as init script)
      `CREATE TABLE IF NOT EXISTS challenge_instances (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        container_name VARCHAR(255) UNIQUE NOT NULL,
        container_id VARCHAR(255),
        host_url VARCHAR(255),
        access_info TEXT,
        status VARCHAR(20) DEFAULT 'starting' CHECK (status IN ('starting', 'running', 'stopping', 'stopped', 'error')),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        stopped_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Flag submissions table (using UUID, same as init script)
      `CREATE TABLE IF NOT EXISTS flag_submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        instance_id UUID REFERENCES challenge_instances(id) ON DELETE SET NULL,
        submitted_flag VARCHAR(255) NOT NULL,
        is_correct BOOLEAN NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        points_awarded INTEGER DEFAULT 0
      )`,

      // User sessions table
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_jti VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_revoked BOOLEAN DEFAULT false
      )`,

      // Audit logs table
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(255),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Create indexes for better performance (same as init script)
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug)`,
      `CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category)`,
      `CREATE INDEX IF NOT EXISTS idx_challenges_published ON challenges(is_published)`,
      `CREATE INDEX IF NOT EXISTS idx_instances_user_id ON challenge_instances(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_instances_challenge_id ON challenge_instances(challenge_id)`,
      `CREATE INDEX IF NOT EXISTS idx_instances_status ON challenge_instances(status)`,
      `CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON flag_submissions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON flag_submissions(challenge_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_token_jti ON user_sessions(token_jti)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)`,

      // Create default admin user (password: admin123) - same as init script
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ('admin', 'admin@ctf.local', '$2b$10$8K8vR8ZGN0hBzB/YoU8RJuMjqU2xT9H7F0R2qU5FkX4O8Q0vF6V7y', 'admin')
       ON CONFLICT (username) DO NOTHING`,

      // Add updated_at trigger function (same as init script)
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
       END;
       $$ language 'plpgsql'`,

      // Create triggers for updated_at (same as init script)
      `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      
      `CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
       
      `CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON challenge_instances
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    ];

    for (const migration of migrations) {
      try {
        await this.query(migration);
        this.logger.info('Migration executed successfully');
      } catch (error) {
        this.logger.error('Migration failed:', error.message);
        throw error;
      }
    }

    this.logger.info('All migrations completed successfully');
  }

  async query(text, params) {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        this.logger.warn(`Slow query (${duration}ms):`, text);
      }
      
      return res;
    } catch (error) {
      this.logger.error('Database query error:', {
        error: error.message,
        query: text,
        params
      });
      throw error;
    }
  }

  async getClient() {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return await this.pool.connect();
  }

  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('Database connection closed');
    }
  }
}

module.exports = new DatabaseService();