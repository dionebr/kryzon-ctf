-- Initial database setup for Kryzon CTF Platform
-- This script runs automatically when PostgreSQL container starts

-- Create database if not exists (usually handled by POSTGRES_DB env var)
-- SELECT 'CREATE DATABASE kryzon_ctf' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kryzon_ctf');

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE challenge_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE instance_status AS ENUM ('starting', 'running', 'stopping', 'stopped', 'error');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    difficulty challenge_difficulty NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    flag VARCHAR(255) NOT NULL,
    docker_image VARCHAR(255),
    docker_ports TEXT, -- JSON array of port mappings
    access_info TEXT, -- Instructions for accessing the challenge
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Challenge instances table
CREATE TABLE IF NOT EXISTS challenge_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    container_name VARCHAR(255) UNIQUE NOT NULL,
    container_id VARCHAR(255),
    host_url VARCHAR(255),
    access_info TEXT,
    status instance_status DEFAULT 'starting',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flag submissions table
CREATE TABLE IF NOT EXISTS flag_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES challenge_instances(id) ON DELETE SET NULL,
    submitted_flag VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_awarded INTEGER DEFAULT 0
);

-- User sessions table (for JWT blacklisting and session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT false
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_published ON challenges(is_published);
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON challenge_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_challenge_id ON challenge_instances(challenge_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON challenge_instances(status);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON flag_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON flag_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_jti ON user_sessions(token_jti);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON challenge_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES (
    'admin', 
    'admin@ctf.local', 
    '$2b$10$8K8vR8ZGN0hBzB/YoU8RJuMjqU2xT9H7F0R2qU5FkX4O8Q0vF6V7y', -- bcrypt hash of 'admin123'
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample challenges
INSERT INTO challenges (slug, name, description, category, difficulty, points, flag, docker_image, is_published) VALUES
    (
        'shadowmere',
        'Shadowmere',
        'A dark web application with hidden vulnerabilities. Can you find the flag hidden in the shadows?',
        'web',
        'easy',
        100,
        'flag{shadow_realm_conquered}',
        'kryzon/shadowmere:latest',
        true
    ),
    (
        'nethermind',
        'Nethermind',
        'A mysterious SSH server from the nether realm. Bruteforce your way in or find another path.',
        'network',
        'medium',
        200,
        'flag{nether_portal_opened}',
        'kryzon/nethermind:latest',
        true
    ),
    (
        'cryptomancer',
        'Cryptomancer',
        'Ancient cryptographic magic protects this treasure. Decode the secrets of the cryptomancer.',
        'crypto',
        'medium',
        150,
        'flag{ancient_cipher_broken}',
        'kryzon/cryptomancer:latest',
        true
    ),
    (
        'voidwalker',
        'Voidwalker',
        'A binary from the void realm. Reverse engineer this otherworldly executable.',
        'reverse',
        'hard',
        300,
        'flag{void_traversed_successfully}',
        'kryzon/voidwalker:latest',
        true
    )
ON CONFLICT (slug) DO NOTHING;