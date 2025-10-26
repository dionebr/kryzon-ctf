const DatabaseService = require('./DatabaseService');
const DockerService = require('./DockerService');
const { createLogger } = require('winston');

class InstanceCleanupService {
  constructor() {
    this.logger = createLogger({ level: 'info' });
  }

  async cleanExpiredInstances() {
    try {
      this.logger.info('Starting instance cleanup...');

      // Find expired instances
      const expiredInstances = await DatabaseService.query(`
        SELECT id, container_name, container_id, challenge_id, owner_user_id, ttl_seconds, started_at
        FROM instances 
        WHERE status = 'running' 
        AND ttl_seconds IS NOT NULL
        AND (EXTRACT(EPOCH FROM (NOW() - started_at)) > ttl_seconds)
      `);

      if (expiredInstances.rows.length === 0) {
        this.logger.info('No expired instances found');
        return;
      }

      this.logger.info(`Found ${expiredInstances.rows.length} expired instances`);

      for (const instance of expiredInstances.rows) {
        try {
          await this.stopExpiredInstance(instance);
        } catch (error) {
          this.logger.error(`Failed to stop expired instance ${instance.id}:`, error);
        }
      }

      // Clean up orphaned containers (containers without database records)
      await this.cleanOrphanedContainers();

      // General Docker cleanup
      await DockerService.cleanup();

      this.logger.info('Instance cleanup completed');

    } catch (error) {
      this.logger.error('Instance cleanup failed:', error);
    }
  }

  async stopExpiredInstance(instance) {
    try {
      // Stop container if it exists
      if (instance.container_id) {
        await DockerService.stopContainer(instance.container_id);
        this.logger.info(`Stopped expired container: ${instance.container_name}`);
      }

      // Update instance status in database
      await DatabaseService.query(`
        UPDATE instances 
        SET status = 'stopped', stopped_at = NOW()
        WHERE id = $1
      `, [instance.id]);

      // End any active sessions
      await DatabaseService.query(`
        UPDATE sessions 
        SET end_time = NOW()
        WHERE instance_id = $1 AND end_time IS NULL
      `, [instance.id]);

      this.logger.info(`Instance ${instance.id} marked as stopped due to TTL expiration`);

    } catch (error) {
      // Mark as failed if we can't stop it properly
      await DatabaseService.query(`
        UPDATE instances 
        SET status = 'failed', error_message = $2
        WHERE id = $1
      `, [instance.id, `Cleanup failed: ${error.message}`]);

      throw error;
    }
  }

  async cleanOrphanedContainers() {
    try {
      // Get all kryzon containers from Docker
      const dockerContainers = await DockerService.listInstances();
      
      // Get all instances from database
      const dbInstances = await DatabaseService.query(`
        SELECT container_name, container_id 
        FROM instances 
        WHERE status IN ('running', 'starting')
      `);

      const dbContainerNames = new Set(dbInstances.rows.map(i => i.container_name));
      const dbContainerIds = new Set(dbInstances.rows.map(i => i.container_id).filter(Boolean));

      // Find orphaned containers (exist in Docker but not in DB)
      const orphanedContainers = dockerContainers.filter(container => {
        const containerName = container.names[0]?.replace('/', '');
        return !dbContainerNames.has(containerName) && !dbContainerIds.has(container.id);
      });

      if (orphanedContainers.length > 0) {
        this.logger.info(`Found ${orphanedContainers.length} orphaned containers`);

        for (const orphan of orphanedContainers) {
          try {
            await DockerService.stopContainer(orphan.id);
            this.logger.info(`Removed orphaned container: ${orphan.names[0]}`);
          } catch (error) {
            this.logger.warn(`Failed to remove orphaned container ${orphan.id}:`, error.message);
          }
        }
      }

    } catch (error) {
      this.logger.error('Orphaned container cleanup failed:', error);
    }
  }

  async cleanupUserInstances(userId, maxInstances = null) {
    try {
      maxInstances = maxInstances || parseInt(process.env.MAX_INSTANCES_PER_USER) || 3;

      // Get user's running instances ordered by start time (oldest first)
      const userInstances = await DatabaseService.query(`
        SELECT id, container_name, container_id, started_at
        FROM instances 
        WHERE owner_user_id = $1 AND status = 'running'
        ORDER BY started_at ASC
      `, [userId]);

      if (userInstances.rows.length <= maxInstances) {
        return; // User is within limits
      }

      const instancesToStop = userInstances.rows.slice(0, userInstances.rows.length - maxInstances);
      
      this.logger.info(`User ${userId} exceeded instance limit, stopping ${instancesToStop.length} oldest instances`);

      for (const instance of instancesToStop) {
        try {
          if (instance.container_id) {
            await DockerService.stopContainer(instance.container_id);
          }

          await DatabaseService.query(`
            UPDATE instances 
            SET status = 'stopped', stopped_at = NOW()
            WHERE id = $1
          `, [instance.id]);

          this.logger.info(`Stopped instance ${instance.id} due to user limit`);

        } catch (error) {
          this.logger.error(`Failed to stop user instance ${instance.id}:`, error);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to cleanup user ${userId} instances:`, error);
    }
  }

  async getCleanupStats() {
    try {
      const stats = await DatabaseService.query(`
        SELECT 
          status,
          COUNT(*) as count,
          AVG(CASE WHEN stopped_at IS NOT NULL THEN EXTRACT(EPOCH FROM (stopped_at - started_at)) END) as avg_duration_seconds
        FROM instances 
        GROUP BY status
      `);

      const totalInstances = await DatabaseService.query(`
        SELECT COUNT(*) as total FROM instances
      `);

      const dockerContainers = await DockerService.listInstances();

      return {
        database_stats: stats.rows,
        total_instances: parseInt(totalInstances.rows[0].total),
        docker_containers: dockerContainers.length,
        cleanup_timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to get cleanup stats:', error);
      throw error;
    }
  }

  async forceCleanupAll() {
    try {
      this.logger.warn('Starting FORCE cleanup of all instances...');

      // Stop all running containers
      const runningInstances = await DatabaseService.query(`
        SELECT id, container_id, container_name
        FROM instances 
        WHERE status IN ('running', 'starting')
      `);

      for (const instance of runningInstances.rows) {
        try {
          if (instance.container_id) {
            await DockerService.stopContainer(instance.container_id);
          }

          await DatabaseService.query(`
            UPDATE instances 
            SET status = 'stopped', stopped_at = NOW()
            WHERE id = $1
          `, [instance.id]);

        } catch (error) {
          this.logger.error(`Failed to force stop instance ${instance.id}:`, error.message);
        }
      }

      // Clean up all Docker containers
      await DockerService.cleanup();

      this.logger.warn('Force cleanup completed');

    } catch (error) {
      this.logger.error('Force cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new InstanceCleanupService();