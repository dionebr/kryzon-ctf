# Scripts e Automação

## Visão Geral
A plataforma conta com scripts para facilitar a automação de tarefas como subir a infraestrutura, criar instâncias de desafios, backup e restore do banco de dados.

## Scripts Principais
- `scripts/start-all.sh`: sobe toda a infraestrutura (backend, frontend, banco, proxy)
- `scripts/create-challenge-instance.sh`: cria uma instância de desafio

## Exemplo de start-all.sh
```bash
#!/usr/bin/env bash
cd $(dirname "$0")/..
docker compose -f infra/docker-compose.yml up -d --build
# aguarda postgres
sleep 10
# roda migrations (ex: usando knex/sequelize)
# npm --prefix backend run migrate
```

## Backup e Restore
- Backup: `docker exec -t <postgres_container> pg_dumpall -c -U ctfuser > dump_$(date +%F).sql`
- Restore: `cat dump.sql | docker exec -i <postgres_container> psql -U ctfuser`

## Troubleshooting
- Certifique-se de que os scripts têm permissão de execução (`chmod +x scripts/*.sh`)
- Execute sempre a partir do diretório raiz do projeto
