# Desafios/Máquinas — Documentação

## Visão Geral
Os desafios (máquinas vulneráveis) são implementados como containers Docker, cada um com seu próprio Dockerfile, arquivos e metadados. São instanciados sob demanda pelo backend e acessados via proxy reverso.

## Estrutura
- `challenges/`: diretório principal
- Cada desafio em um subdiretório (ex: `web-challenge-01/`)
- Arquivos típicos: `Dockerfile`, `files/`, `challenge.json`

## Exemplo de Dockerfile
```dockerfile
FROM php:8.1-apache
COPY src/ /var/www/html/
EXPOSE 80
HEALTHCHECK --interval=5s --timeout=3s CMD curl -f http://localhost/ || exit 1
```

## Metadados do Desafio
- `challenge.json`: nome, descrição, porta, flag, timeout, etc.

## Boas Práticas
- Use imagens base leves
- Defina limites de recursos
- Utilize `HEALTHCHECK`
- Não rode processos como root

## Build e Versionamento
- Build local: `docker build -t <tag> .`
- Versionamento por tag (ex: `web-chal-1:v1.0`)

## Troubleshooting
- Verifique logs do container
- Teste o acesso à porta exposta
- Cheque a configuração do proxy
