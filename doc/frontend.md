# Frontend — Documentação Detalhada

## Visão Geral
O frontend é a interface web da plataforma, desenvolvida em React, responsável pela interação do usuário, autenticação, listagem de desafios, gerenciamento de instâncias e painel administrativo.

## Tecnologias
- React 18
- Tailwind CSS
- Axios
- React Router
- Context API para autenticação

## Estrutura
- `src/`: código-fonte principal
- `src/pages/`: páginas (Home, Desafios, Instância, Admin, Login)
- `src/components/`: componentes reutilizáveis
- `src/context/`: contexto de autenticação

## Funcionalidades
- Login e cadastro de usuários
- Listagem de desafios disponíveis
- Iniciar/parar instâncias de desafios
- Visualizar detalhes e status das instâncias
- Painel administrativo para gerenciamento de desafios, usuários e logs

## Consumo de API
- Comunicação com backend via Axios
- Endpoints: login, listar desafios, criar instância, status, admin

## Build e Deploy
- Build de produção: `npm run build`
- Servido via Nginx em container Docker

## Troubleshooting
- Verifique logs do frontend: `docker logs kryzon-frontend`
- Certifique-se de que o backend está acessível
- Cheque se o arquivo CSS foi gerado corretamente no build
