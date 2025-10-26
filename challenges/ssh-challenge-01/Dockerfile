FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install SSH server and other utilities
RUN apt-get update && apt-get install -y \
    openssh-server \
    curl \
    nano \
    htop \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Create SSH host keys
RUN ssh-keygen -A

# Create users with weak passwords
RUN useradd -m -s /bin/bash user && \
    echo 'user:password' | chpasswd && \
    useradd -m -s /bin/bash admin && \
    echo 'admin:123456' | chpasswd && \
    useradd -m -s /bin/bash guest && \
    echo 'guest:guest' | chpasswd

# Create flag file
RUN echo 'KRYZON{w34k_ssh_cr3d3nt14ls_pwn3d}' > /home/user/flag.txt && \
    chown user:user /home/user/flag.txt && \
    chmod 644 /home/user/flag.txt

# Create some decoy files and directories
RUN mkdir -p /home/user/documents /home/user/projects && \
    echo 'This is just a decoy file.' > /home/user/documents/readme.txt && \
    echo 'Nothing interesting here...' > /home/user/projects/notes.txt && \
    chown -R user:user /home/user/documents /home/user/projects

# SSH configuration with security hardening disabled for CTF purposes
RUN mkdir -p /var/run/sshd && \
    echo 'PermitRootLogin no' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'ChallengeResponseAuthentication no' >> /etc/ssh/sshd_config && \
    echo 'UsePAM yes' >> /etc/ssh/sshd_config && \
    echo 'MaxAuthTries 6' >> /etc/ssh/sshd_config && \
    echo 'ClientAliveInterval 60' >> /etc/ssh/sshd_config && \
    echo 'ClientAliveCountMax 3' >> /etc/ssh/sshd_config

# Create a welcome message
RUN echo 'Welcome to Nethermind CTF Challenge!\n\
\n\
A secure server with strong authentication mechanisms...\n\
or so they thought!\n\
\n\
Available users: user, admin, guest\n\
Try to find weak credentials and get access!\n\
\n\
Challenge: Find the flag in /home/user/flag.txt\n\
' > /etc/motd

# Create startup script
RUN echo '#!/bin/bash\n\
service ssh start\n\
echo "SSH server started on Nethermind"\n\
echo "Available for brute force attacks..."\n\
tail -f /dev/null\n\
' > /start.sh && chmod +x /start.sh

# Expose SSH port
EXPOSE 22

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD nc -z localhost 22 || exit 1

# Start SSH service
CMD ["/start.sh"]