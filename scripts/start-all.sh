#!/bin/bash

# Kryzon CTF Platform - Start All Services
# This script initializes and starts the entire CTF platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
cat << "EOF"
██╗  ██╗██████╗ ██╗   ██╗███████╗ ██████╗ ███╗   ██╗
██║ ██╔╝██╔══██╗╚██╗ ██╔╝╚══███╔╝██╔═══██╗████╗  ██║
█████╔╝ ██████╔╝ ╚████╔╝   ███╔╝ ██║   ██║██╔██╗ ██║
██╔═██╗ ██╔══██╗  ╚██╔╝   ███╔╝  ██║   ██║██║╚██╗██║
██║  ██╗██║  ██║   ██║   ███████╗╚██████╔╝██║ ╚████║
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
                                                      
    Local CTF Platform - Starting All Services...
EOF
echo -e "${NC}"

# Check if running in WSL
if grep -qi microsoft /proc/version; then
    echo -e "${BLUE}🐧 Running in WSL environment${NC}"
else
    echo -e "${YELLOW}⚠️  Not running in WSL - some features may not work correctly${NC}"
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found! Please install Docker first.${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon not running! Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found! Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is available${NC}"

# Set working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "${CYAN}📁 Project directory: $PROJECT_DIR${NC}"

# Create necessary directories
echo -e "${BLUE}📂 Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p infra/traefik/config
mkdir -p infra/postgres/init
mkdir -p data/postgres
mkdir -p data/redis

# Create hosts file entries
echo -e "${YELLOW}🌐 Configuring local hosts...${NC}"
echo -e "${BLUE}Please add these entries to your Windows hosts file manually:${NC}"
echo -e "${CYAN}File location: C:\\Windows\\System32\\drivers\\etc\\hosts${NC}"
echo -e "${CYAN}Add these lines:${NC}"
cat << EOF
127.0.0.1 ctf.local
127.0.0.1 www.ctf.local  
127.0.0.1 api.ctf.local
127.0.0.1 traefik.ctf.local
127.0.0.1 portainer.ctf.local
127.0.0.1 vm-1.ctf.local
127.0.0.1 vm-2.ctf.local
127.0.0.1 vm-3.ctf.local
127.0.0.1 vm-4.ctf.local
127.0.0.1 vm-5.ctf.local
EOF

echo -e "${YELLOW}Press Enter to continue after adding hosts entries...${NC}"
read -p ""

# Build challenge images
echo -e "${BLUE}🐳 Building challenge Docker images...${NC}"

# Build Shadowmere (Web Challenge)
if [ -d "challenges/web-challenge-01" ]; then
    echo -e "${CYAN}Building Shadowmere (Web Challenge)...${NC}"
    docker build -t kryzon/shadowmere:latest challenges/web-challenge-01/
fi

# Build Nethermind (SSH Challenge)  
if [ -d "challenges/ssh-challenge-01" ]; then
    echo -e "${CYAN}Building Nethermind (SSH Challenge)...${NC}"
    docker build -t kryzon/nethermind:latest challenges/ssh-challenge-01/
fi

# Stop any existing services
echo -e "${YELLOW}🛑 Stopping any existing services...${NC}"
cd infra
docker-compose down --remove-orphans 2>/dev/null || true

# Start main infrastructure
echo -e "${BLUE}🚀 Starting infrastructure services...${NC}"
docker-compose up -d --build

# Wait for services to be ready
echo -e "${CYAN}⏳ Waiting for services to start...${NC}"

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U kryzon_user -d kryzon_ctf >/dev/null 2>&1; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for backend
echo -n "Waiting for Backend API..."
for i in {1..30}; do
    if curl -s -f http://localhost:5000/api/health >/dev/null 2>&1; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Initialize database with sample challenges
echo -e "${BLUE}📊 Initializing database with sample challenges...${NC}"
cd "$PROJECT_DIR"

# Create init script for challenges
cat > /tmp/init_challenges.sql << EOF
-- Insert sample challenges
INSERT INTO challenges (slug, name, description, difficulty, category, points, image_tag, port, published, author, hints) 
VALUES 
    ('shadowmere', 'Shadowmere', 'Um desenvolvedor novato criou um sistema de login para uma loja de artefatos mágicos. Será que você consegue encontrar uma forma de burlar a autenticação e acessar a área administrativa?', 'easy', 'web', 100, 'kryzon/shadowmere:latest', 80, true, 'Kryzon Team', ARRAY['SQL Injection é uma vulnerabilidade comum', 'Nem sempre é necessário conhecer uma senha válida', 'Tente usar '' OR ''1''=''1'' -- como payload']),
    ('nethermind', 'Nethermind', 'Um servidor SSH foi configurado com credenciais fracas. O administrador do sistema acredita que sua senha é segura, mas será que realmente é?', 'easy', 'system', 150, 'kryzon/nethermind:latest', 22, true, 'Kryzon Team', ARRAY['Wordlists comuns podem ser úteis', 'Existem 3 usuários: user, admin, guest', 'A flag está em /home/user/flag.txt']),
    ('cryptomancer', 'Cryptomancer', 'Um mago das trevas escondeu um segredo usando antigos rituais de criptografia. Apenas aqueles versados nas artes arcanas da decodificação conseguirão revelar seus mistérios.', 'medium', 'crypto', 250, 'kryzon/cryptomancer:latest', 80, false, 'Kryzon Team', ARRAY['Múltiplas camadas de criptografia', 'Caesar, Base64, ROT13', 'Preste atenção aos padrões']),
    ('voidwalker', 'Voidwalker', 'Uma entidade das trevas criou um portal dimensional protegido por magia binária. Apenas os mestres em exploração de memória conseguirão atravessar o vazio.', 'hard', 'pwn', 400, 'kryzon/voidwalker:latest', 9999, false, 'Kryzon Team', ARRAY['Buffer overflow clássico', 'ASLR pode estar desabilitado', 'GDB e pwntools são essenciais'])
ON CONFLICT (slug) DO NOTHING;

-- Insert flags
INSERT INTO flags (challenge_id, flag_value) 
SELECT c.id, 
    CASE c.slug
        WHEN 'shadowmere' THEN 'KRYZON{sh4dow_sqli_byp4ss_m4st3r}'
        WHEN 'nethermind' THEN 'KRYZON{w34k_ssh_cr3d3nt14ls_pwn3d}'
        WHEN 'cryptomancer' THEN 'KRYZON{mult1_l4y3r_cr7pt0_m4st3ry}'
        WHEN 'voidwalker' THEN 'KRYZON{v01d_buff3r_0v3rfl0w_m4st3r}'
    END
FROM challenges c
WHERE c.slug IN ('shadowmere', 'nethermind', 'cryptomancer', 'voidwalker')
ON CONFLICT DO NOTHING;
EOF

# Execute initialization
docker-compose exec -T postgres psql -U kryzon_user -d kryzon_ctf -f /dev/stdin < /tmp/init_challenges.sql >/dev/null 2>&1 || true

# Display final status
echo -e "${GREEN}"
echo "🎉 Kryzon CTF Platform Started Successfully!"
echo "==========================================="
echo -e "${NC}"

echo -e "${CYAN}🌐 Access URLs:${NC}"
echo -e "   Frontend:    ${BLUE}http://ctf.local${NC}"
echo -e "   API:         ${BLUE}http://api.ctf.local${NC}" 
echo -e "   Traefik UI:  ${BLUE}http://traefik.ctf.local${NC}"
echo -e "   Portainer:   ${BLUE}http://portainer.ctf.local${NC}"

echo -e "\n${YELLOW}👤 Default Admin Credentials:${NC}"
echo -e "   Username: ${GREEN}admin${NC}"
echo -e "   Password: ${GREEN}admin123${NC}"

echo -e "\n${PURPLE}🏆 Available Challenges:${NC}"
echo -e "   • ${GREEN}Shadowmere${NC} - Easy Web Challenge (SQL Injection)"
echo -e "   • ${GREEN}Nethermind${NC} - Easy SSH Challenge (Weak Credentials)"
echo -e "   • ${YELLOW}Cryptomancer${NC} - Medium Crypto Challenge (Coming Soon)"
echo -e "   • ${RED}Voidwalker${NC} - Hard Binary Exploitation (Coming Soon)"

echo -e "\n${BLUE}📊 Service Status:${NC}"
docker-compose ps

echo -e "\n${GREEN}✅ Setup complete! Happy hacking! 🚀${NC}"
echo -e "${CYAN}To stop all services, run: ${NC}./scripts/stop-all.sh"
echo -e "${CYAN}To view logs, run: ${NC}docker-compose -f infra/docker-compose.yml logs -f"
