# Documentação Completa da Plataforma Kryzon CTF

## Guia Rápido de Inicialização

Este guia apresenta os passos essenciais para você subir e utilizar a plataforma Kryzon CTF rapidamente em seu ambiente local.

---

### 1. Pré-requisitos
- Windows 11 atualizado
- WSL2 com Ubuntu
- Docker Desktop (com integração WSL2)
- Git, Node.js >= 18, VS Code

### 2. Instalação do Ambiente
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

### 3. Clonando o Projeto
```bash
git clone <url-do-repositorio>
cd kryzon
```

### 4. Subindo a Infraestrutura
```bash
cd infra
docker compose up -d --build
```

### 5. Acessando a Plataforma
- Frontend: `http://<ip-wsl>:3000`
- Backend: `http://<ip-wsl>:5000`

### 6. Comandos Úteis
- Verificar status dos containers:
  ```bash
  docker compose ps
  ```
- Ver logs de um serviço:
  ```bash
  docker logs <nome-do-container>
  ```
- Parar a infraestrutura:
  ```bash
  docker compose down
  ```

---

## Índice

1. Visão geral do projeto
2. Estrutura do projeto
3. Tecnologias utilizadas
4. Passo a passo de instalação e configuração
5. Backend (API)
6. Banco de Dados
7. Frontend (React)
8. Máquinas/Desafios (Containers)
9. Orquestração e Proxy
10. Scripts e automação
11. Segurança e boas práticas
12. Troubleshooting
13. Anexos e exemplos

---

## 1. Visão geral do projeto

A plataforma Kryzon CTF é uma solução completa para competições de Capture The Flag (CTF) totalmente local, sem dependência de internet. Permite criar, gerenciar e acessar desafios (máquinas vulneráveis) via interface web, com backend robusto, banco de dados, orquestração Docker e proxy reverso.

## 2. Estrutura do projeto

```
kryzon/
├─ infra/
│  ├─ nginx/
│  │  ├─ nginx.conf
│  │  └─ sites-enabled/
│  └─ docker-compose.yml
├─ backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ services/
│  │  └─ index.js
│  ├─ dockerfile
│  └─ package.json
├─ frontend/
│  ├─ src/
│  └─ package.json
├─ challenges/
│  ├─ web-challenge-01/
│  │  ├─ Dockerfile
│  │  └─ files/
│  └─ ssh-challenge-01/
├─ scripts/
│  ├─ start-all.sh
│  └─ create-challenge-instance.sh
└─ README.md
```

## 3. Tecnologias utilizadas

- **Backend:** Node.js 18, Express, JWT, Dockerode, PostgreSQL
- **Frontend:** React 18, Tailwind CSS, Axios, React Router
- **Banco de Dados:** PostgreSQL 15 (via Docker)
- **Orquestração:** Docker Compose, Traefik/Nginx
- **Proxy reverso:** Nginx ou Traefik
- **Desafios:** Containers Docker customizados
- **Infraestrutura:** Scripts Bash, WSL2, Docker Desktop

## 4. Passo a passo de instalação e configuração

### 4.1 Pré-requisitos
- Windows 11 atualizado
- WSL2 com Ubuntu
- Docker Desktop (com integração WSL2)
- Git, Node.js >= 18, VS Code

### 4.2 Instalação do ambiente
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

### 4.3 Clonando e configurando o projeto
1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd kryzon
   ```
2. Configure variáveis de ambiente conforme necessário.

### 4.4 Subindo a infraestrutura
1. No diretório `infra/`, execute:
   ```bash
   docker compose up -d --build
   ```
2. Aguarde os containers subirem (Postgres, backend, frontend, proxy).
3. Rode as migrations do banco de dados (ver instruções no backend).

---

## 5. Backend (API)
- Local: `backend/`
- Stack: Node.js, Express, JWT, Dockerode
- Endpoints principais: autenticação, gerenciamento de desafios, instâncias, usuários, logs
- Integração com Docker para start/stop de containers
- Migrations automáticas para o banco de dados

## 6. Banco de Dados
- Local: `infra/docker-compose.yml` (serviço postgres)
- Stack: PostgreSQL 15
- Tabelas: users, challenges, instances, flags, sessions, audit logs
- Backup e restore via scripts

## 7. Frontend (React)
- Local: `frontend/`
- Stack: React 18, Tailwind CSS, Axios
- Páginas: Home, Lista de Desafios, Instância, Admin, Login
- Consome API do backend

## 8. Máquinas/Desafios (Containers)
- Local: `challenges/`
- Cada desafio possui Dockerfile, arquivos e metadados
- Exemplos: web-challenge-01, ssh-challenge-01
- Build e versionamento local

## 9. Orquestração e Proxy
- Local: `infra/`
- Docker Compose para orquestração
- Nginx ou Traefik para proxy reverso e roteamento dinâmico
- Configuração de hostnames locais via arquivo hosts

## 10. Scripts e automação
- Local: `scripts/`
- `start-all.sh`: sobe toda a infraestrutura
- `create-challenge-instance.sh`: cria instância de desafio

## 11. Segurança e boas práticas
- Limites de recursos nos containers
- Redes Docker isoladas
- TTL para instâncias
- Logs centralizados
- Backup regular do banco de dados

## 12. Troubleshooting
- Verifique logs dos containers com `docker logs <container>`
- Certifique-se de que todas as portas necessárias estão liberadas
- Use `docker compose ps` para checar status dos serviços
- Consulte os arquivos de configuração em `infra/` e `backend/`

## 13. Anexos e exemplos
- Exemplos de Dockerfile, docker-compose.yml, scripts de start, configurações de proxy
- Snippets de código para backend e frontend

---

Para detalhes completos, consulte os arquivos individuais em cada pasta e siga o passo a passo deste documento.

---

*Documentação gerada para facilitar a compreensão e manutenção por humanos e IAs. Qualquer dúvida, consulte os exemplos e scripts fornecidos.*
