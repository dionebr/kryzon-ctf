# Infraestrutura e Orquestração

## Visão Geral
A infraestrutura da plataforma Kryzon CTF é composta por containers Docker orquestrados via Docker Compose, com proxy reverso (Nginx ou Traefik), banco de dados, backend, frontend e desafios isolados.

## Estrutura
- `infra/docker-compose.yml`: orquestra todos os serviços
- `infra/nginx/`: arquivos de configuração do proxy
- `infra/nginx/nginx.conf`: configuração principal do Nginx
- `infra/nginx/sites-enabled/`: configurações de hosts dinâmicos

## Serviços Principais
- **proxy**: Nginx ou Traefik, roteia requisições para containers
- **postgres**: banco de dados PostgreSQL
- **backend**: API Node.js
- **frontend**: React servido via Nginx

## Passos para Subir a Infraestrutura
1. No diretório `infra/`, execute:
   ```bash
   docker compose up -d --build
   ```
2. Aguarde todos os containers ficarem saudáveis
3. Rode as migrations do backend

## Proxy Reverso
- Nginx: configuração manual de hosts
- Traefik: detecção automática de containers via labels
- Configuração de hostnames locais no arquivo `hosts` do Windows

## Troubleshooting
- Use `docker compose ps` para checar status
- Verifique logs dos serviços: `docker logs <container>`
- Cheque configurações de rede e portas
