# Kryzon CTF Platform - Logs Directory
# This directory will contain application logs from various services

# Backend logs: backend.log, error.log
# Challenge instance logs: challenges/
# Audit logs: audit.log
# System logs: system.log

# Directory structure:
# logs/
# ├── backend/
# ├── challenges/
# ├── nginx/
# ├── traefik/
# └── audit/

# Keep this directory in git but ignore actual log files
*
!.gitkeep
!README.md