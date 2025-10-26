const Docker = require('dockerode');
const { createLogger } = require('winston');

class DockerService {
  constructor() {
    this.docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock' });
    this.logger = createLogger({ level: 'info' });
    this.usedPorts = new Set();
  }

  async findAvailablePort() {
    const startPort = parseInt(process.env.INSTANCE_PORT_RANGE_START) || 18000;
    const endPort = parseInt(process.env.INSTANCE_PORT_RANGE_END) || 19000;
    
    for (let port = startPort; port <= endPort; port++) {
      if (!this.usedPorts.has(port)) {
        // Check if port is actually free
        try {
          const containers = await this.docker.listContainers();
          const portInUse = containers.some(container => 
            container.Ports.some(p => p.PublicPort === port)
          );
          
          if (!portInUse) {
            this.usedPorts.add(port);
            return port;
          }
        } catch (error) {
          this.logger.warn(`Error checking port ${port}:`, error.message);
        }
      }
    }
    
    throw new Error('No available ports in the specified range');
  }

  async startInstance(containerName, challenge, hostPort, instanceId) {
    try {
      this.logger.info(`Starting instance: ${containerName}`);

      // Pull image if not exists
      try {
        await this.pullImageIfNotExists(challenge.image_tag);
      } catch (pullError) {
        this.logger.warn(`Failed to pull image ${challenge.image_tag}: ${pullError.message}`);
        // Continue with existing local image
      }

      // Create container configuration
      const containerConfig = {
        Image: challenge.image_tag,
        name: containerName,
        Env: [
          `CHALLENGE_NAME=${challenge.name}`,
          `CHALLENGE_SLUG=${challenge.slug}`,
          `INSTANCE_ID=${instanceId}`
        ],
        ExposedPorts: {
          [`${challenge.port}/tcp`]: {}
        },
        HostConfig: {
          PortBindings: {
            [`${challenge.port}/tcp`]: [{ HostPort: hostPort.toString() }]
          },
          Memory: 256 * 1024 * 1024, // 256MB limit
          CpuShares: 512, // 0.5 CPU
          PidsLimit: 100,
          ReadonlyRootfs: false,
          RestartPolicy: { Name: 'no' },
          NetworkMode: 'kryzon-ctf-network'
        },
        Labels: {
          'kryzon.challenge': challenge.slug,
          'kryzon.instance_id': instanceId.toString(),
          'kryzon.type': 'challenge-instance',
          'traefik.enable': 'true',
          'traefik.http.routers.${containerName}.rule': `Host(\`vm-${instanceId}.${process.env.CTF_DOMAIN || 'ctf.local'}\`)`,
          'traefik.http.services.${containerName}.loadbalancer.server.port': challenge.port.toString()
        },
        Healthcheck: {
          Test: [`CMD-SHELL`, `curl -f http://localhost:${challenge.port}/ || exit 1`],
          Interval: 10000000000, // 10s in nanoseconds
          Timeout: 5000000000,   // 5s in nanoseconds
          Retries: 3,
          StartPeriod: 30000000000 // 30s in nanoseconds
        }
      };

      // Create network if it doesn't exist
      await this.ensureNetwork();

      // Create and start container
      const container = await this.docker.createContainer(containerConfig);
      await container.start();

      this.logger.info(`Container started successfully: ${containerName}`);

      return {
        success: true,
        containerId: container.id
      };

    } catch (error) {
      this.logger.error(`Failed to start instance ${containerName}:`, error);
      
      // Cleanup on failure
      try {
        const container = this.docker.getContainer(containerName);
        await container.remove({ force: true });
      } catch (cleanupError) {
        this.logger.warn(`Failed to cleanup container ${containerName}:`, cleanupError.message);
      }

      // Release port
      this.usedPorts.delete(hostPort);

      return {
        success: false,
        error: error.message
      };
    }
  }

  async ensureNetwork() {
    try {
      const networks = await this.docker.listNetworks({ 
        filters: { name: ['kryzon-ctf-network'] } 
      });
      
      if (networks.length === 0) {
        await this.docker.createNetwork({
          Name: 'kryzon-ctf-network',
          Driver: 'bridge',
          IPAM: {
            Config: [{
              Subnet: '172.20.0.0/16',
              Gateway: '172.20.0.1'
            }]
          },
          Options: {
            'com.docker.network.bridge.name': 'kryzon-br0'
          }
        });
        
        this.logger.info('Created kryzon-ctf-network');
      }
    } catch (error) {
      this.logger.warn('Network creation/check failed:', error.message);
    }
  }

  async pullImageIfNotExists(imageTag) {
    try {
      // Check if image exists locally
      await this.docker.getImage(imageTag).inspect();
      this.logger.info(`Image ${imageTag} already exists locally`);
    } catch (error) {
      if (error.statusCode === 404) {
        this.logger.info(`Pulling image: ${imageTag}`);
        
        const stream = await this.docker.pull(imageTag);
        await new Promise((resolve, reject) => {
          this.docker.modem.followProgress(stream, (err, res) => {
            if (err) reject(err);
            else resolve(res);
          });
        });
        
        this.logger.info(`Image pulled successfully: ${imageTag}`);
      } else {
        throw error;
      }
    }
  }

  async stopContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      
      // Get container info to release port
      const info = await container.inspect();
      const ports = info.NetworkSettings.Ports;
      
      // Release ports
      Object.values(ports).forEach(portBindings => {
        if (portBindings) {
          portBindings.forEach(binding => {
            this.usedPorts.delete(parseInt(binding.HostPort));
          });
        }
      });

      // Stop and remove container
      await container.stop({ t: 10 }); // 10 second timeout
      await container.remove();

      this.logger.info(`Container stopped and removed: ${containerId}`);

    } catch (error) {
      this.logger.error(`Failed to stop container ${containerId}:`, error);
      throw error;
    }
  }

  async getContainerHealth(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      
      return {
        status: info.State.Status,
        health: info.State.Health?.Status || 'unknown',
        started_at: info.State.StartedAt,
        running: info.State.Running
      };

    } catch (error) {
      this.logger.error(`Failed to get container health ${containerId}:`, error);
      throw error;
    }
  }

  async listInstances() {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['kryzon.type=challenge-instance']
        }
      });

      return containers.map(container => ({
        id: container.Id,
        names: container.Names,
        image: container.Image,
        status: container.Status,
        state: container.State,
        ports: container.Ports,
        labels: container.Labels
      }));

    } catch (error) {
      this.logger.error('Failed to list instances:', error);
      throw error;
    }
  }

  async getContainerLogs(containerId, tail = 100) {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail,
        timestamps: true
      });

      return logs.toString();

    } catch (error) {
      this.logger.error(`Failed to get logs for container ${containerId}:`, error);
      throw error;
    }
  }

  async getContainerStats(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      const cpuUsage = this.calculateCpuUsage(stats);
      const memoryUsage = this.calculateMemoryUsage(stats);

      return {
        cpu_usage: cpuUsage,
        memory_usage: memoryUsage,
        network_io: stats.networks,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get stats for container ${containerId}:`, error);
      throw error;
    }
  }

  calculateCpuUsage(stats) {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats.system_cpu_usage || 0);
    
    if (systemDelta > 0 && cpuDelta > 0) {
      const cpuUsage = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
      return Math.round(cpuUsage * 100) / 100; // Round to 2 decimal places
    }
    
    return 0;
  }

  calculateMemoryUsage(stats) {
    const used = stats.memory_stats.usage || 0;
    const available = stats.memory_stats.limit || 0;
    
    return {
      used_bytes: used,
      available_bytes: available,
      used_mb: Math.round(used / 1024 / 1024 * 100) / 100,
      available_mb: Math.round(available / 1024 / 1024 * 100) / 100,
      percentage: available > 0 ? Math.round((used / available) * 100 * 100) / 100 : 0
    };
  }

  async cleanup() {
    try {
      // Remove all stopped kryzon containers
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['kryzon.type=challenge-instance'],
          status: ['exited', 'dead']
        }
      });

      for (const containerInfo of containers) {
        try {
          const container = this.docker.getContainer(containerInfo.Id);
          await container.remove();
          this.logger.info(`Cleaned up stopped container: ${containerInfo.Names[0]}`);
        } catch (error) {
          this.logger.warn(`Failed to remove container ${containerInfo.Id}:`, error.message);
        }
      }

      // Clear unused ports from memory
      this.usedPorts.clear();
      
      // Rebuild port usage from running containers
      const runningContainers = await this.listInstances();
      runningContainers.forEach(container => {
        container.ports.forEach(port => {
          if (port.PublicPort) {
            this.usedPorts.add(port.PublicPort);
          }
        });
      });

    } catch (error) {
      this.logger.error('Docker cleanup failed:', error);
    }
  }
}

module.exports = new DockerService();