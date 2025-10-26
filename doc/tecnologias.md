# Tecnologias Utilizadas na Plataforma Kryzon CTF

## Backend
- Node.js 18
- Express
- JWT (autenticação)
- Dockerode (controle de containers)
- PostgreSQL (armazenamento)
- Migrations automatizadas

## Frontend
- React 18
- Tailwind CSS
- Axios
- React Router
- Context API para autenticação

## Banco de Dados
- PostgreSQL 15 (via Docker)
- Tabelas: users, challenges, instances, flags, sessions, audit logs

## Orquestração e Proxy
- Docker Compose
- Nginx ou Traefik (proxy reverso)
- Configuração dinâmica de hostnames

## Desafios/Máquinas
- Docker (containers customizados)
- Dockerfile para cada desafio
- Versionamento local de imagens

## Infraestrutura
- Scripts Bash (start, build, backup)
- WSL2 (Windows Subsystem for Linux)
- Docker Desktop

## Observações
- Todos os componentes são executados localmente, sem dependência de internet.
- O proxy pode ser Nginx (configuração manual) ou Traefik (detecção automática de containers via labels).
- O backend pode usar dockerode (Node.js) ou comandos shell para controlar containers.
