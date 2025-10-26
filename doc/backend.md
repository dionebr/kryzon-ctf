# Backend — Documentação Detalhada

## Visão Geral
O backend é responsável por autenticação, gerenciamento de desafios, ciclo de vida das instâncias, integração com Docker, registro no banco de dados e automação de tarefas administrativas.

## Tecnologias
- Node.js 18
- Express
- JWT
- Dockerode (ou child_process para CLI Docker)
- PostgreSQL

## Estrutura
- `src/controllers/`: controladores das rotas
- `src/services/`: lógica de negócio e integração com Docker/DB
- `src/index.js`: inicialização do servidor

## Endpoints Principais
- `POST /api/auth/login` — autenticação
- `GET /api/challenges` — lista de desafios
- `POST /api/challenges` — criar desafio (admin)
- `POST /api/instances` — criar instância
- `POST /api/instances/:id/stop` — parar instância
- `GET /api/instances/:id/status` — status da instância

## Integração com Docker
- Criação e remoção de containers para cada instância
- Uso de labels para proxy dinâmico (Traefik/Nginx)
- Limites de recursos: CPU, memória, TTL

## Banco de Dados
- Tabelas: users, challenges, instances, flags, sessions, audit logs
- Migrations automáticas

## Segurança
- JWT para autenticação
- Validação de permissões (admin, user)
- Limites de recursos nos containers

## Exemplos de Uso
- Criar instância: `POST /api/instances` com `{ challenge_id, user_id }`
- Parar instância: `POST /api/instances/:id/stop`

## Troubleshooting
- Verifique logs do backend: `docker logs kryzon-backend`
- Cheque conexão com o banco de dados
- Certifique-se de que o Docker está acessível
