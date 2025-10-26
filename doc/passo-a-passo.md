# Passo a Passo para Instalação e Uso da Plataforma Kryzon CTF

## 1. Pré-requisitos
- Windows 11 atualizado
- WSL2 com Ubuntu
- Docker Desktop (com integração WSL2)
- Git, Node.js >= 18, VS Code

## 2. Instalação do Ambiente
1. Habilite o WSL2 e instale o Ubuntu:
   ```powershell
   wsl --install -d ubuntu
   ```
2. Instale o Docker Desktop e ative integração com WSL2.
3. Instale Git, Node.js e dependências no Ubuntu:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install git curl build-essential -y
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
4. Instale o VS Code e a extensão "Remote - WSL".

## 3. Clonando e Configurando o Projeto
1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd kryzon
   ```
2. Configure variáveis de ambiente conforme necessário.

## 4. Subindo a Infraestrutura
1. No diretório `infra/`, execute:
   ```bash
   docker compose up -d --build
   ```
2. Aguarde os containers subirem (Postgres, backend, frontend, proxy).
3. Rode as migrations do banco de dados (ver instruções no backend).

## 5. Utilizando a Plataforma
- Acesse o frontend via navegador: `http://<ip-wsl>:3000`
- Realize login/cadastro
- Inicie desafios pela interface
- Acesse as máquinas pelos links gerados
- Use o painel admin para gerenciar desafios, usuários e logs

## 6. Troubleshooting
- Verifique logs dos containers com `docker logs <container>`
- Use `docker compose ps` para checar status dos serviços
- Certifique-se de que todas as portas necessárias estão liberadas
- Consulte os arquivos de configuração em `infra/` e `backend/`

## 7. Backup e Restore
- Backup do banco: `docker exec -t <postgres_container> pg_dumpall -c -U ctfuser > dump_$(date +%F).sql`
- Restore: `cat dump.sql | docker exec -i <postgres_container> psql -U ctfuser`

---

*Este guia foi criado para permitir que qualquer pessoa (ou IA) consiga instalar, configurar e operar a plataforma Kryzon CTF do zero.*
