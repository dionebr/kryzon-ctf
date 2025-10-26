# Kryzon CTF — Plataforma Local de Capture The Flag

Bem-vindo ao repositório da Kryzon CTF, uma plataforma completa para competições de Capture The Flag totalmente local, desenvolvida para rodar em ambientes Windows 11 + WSL2, sem dependência de internet.

## Sumário
- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Instalação Rápida](#instalação-rápida)
- [Documentação Completa](#documentação-completa)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Autor](#autor)

---

## Visão Geral
A Kryzon CTF permite criar, gerenciar e acessar desafios (máquinas vulneráveis) via interface web, com backend robusto, banco de dados, orquestração Docker e proxy reverso. Tudo local, seguro e prático para times, treinamentos e eventos.

## Funcionalidades
- Interface web moderna (React + Tailwind)
- Painel Admin para gestão de desafios, usuários e logs
- Backend Node.js com autenticação JWT
- Banco de dados PostgreSQL em container
- Orquestração via Docker Compose
- Proxy reverso (Nginx ou Traefik)
- Instanciação dinâmica de desafios (containers)
- Scripts de automação e backup

## Instalação Rápida
1. Prepare o ambiente (Windows 11, WSL2, Docker Desktop, Git, Node.js)
2. Clone o repositório:
   ```bash
   git clone https://github.com/dionebr/kryzon-ctf.git
   cd kryzon
   ```
3. Suba a infraestrutura:
   ```bash
   cd infra
   docker compose up -d --build
   ```
4. Acesse o frontend em `http://<ip-wsl>:3000`
5. Consulte a [documentação completa](./doc/README.md) para detalhes e troubleshooting

## Documentação Completa
Toda a documentação detalhada está disponível na pasta [`doc/`](./doc/README.md), incluindo:
- Passo a passo de instalação
- Arquitetura e tecnologias
- Uso de cada componente
- Exemplos de configuração
- Troubleshooting e dicas

## Tecnologias Utilizadas
- Node.js, Express, JWT, Dockerode
- React, Tailwind CSS, Axios
- PostgreSQL, Docker Compose
- Nginx ou Traefik
- Scripts Bash, WSL2

## Estrutura do Projeto
```
kryzon/
├─ infra/
├─ backend/
├─ frontend/
├─ challenges/
├─ scripts/
├─ doc/
└─ README.md
```

## Contribuição
Contribuições são bem-vindas! Siga o guia de contribuição na documentação e abra issues ou pull requests para melhorias.

## Licença
Este projeto está sob a licença MIT.

## Autor
Plataforma criada por Dione, desenvolvida ao longo de 5 meses de estudos, pesquisa de documentação e prática intensiva em tecnologias modernas de desenvolvimento, infraestrutura e segurança. Todo o conhecimento aplicado foi adquirido por meio de leitura de documentação oficial, artigos, exemplos de código e experimentação prática.



