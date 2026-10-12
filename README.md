# 🏀 NBA Live — Full Stack Real-Time Platform

Plataforma de alta performance para acompanhamento de jogos, resultados ao vivo, estatísticas avançadas e classificação da NBA com atualizações instantâneas via **Server-Sent Events (SSE)**.

Construído com arquitetura monorepo, **Clean Architecture**, TypeScript em modo strict e foco em confiabilidade para ambientes de produção.

---

## 🏗️ Arquitetura do Sistema

```
                    ┌─────────────────────────┐
                    │   NBA Data Provider     │
                    │  (BallDontLie API /     │
                    │   Mock Live Simulator)  │
                    └───────────┬─────────────┘
                                │ Polling Centralizado (Worker)
                                ▼
                    ┌─────────────────────────┐
                    │   Bun + Hono Backend    │
                    │   - LiveSync Worker     │
                    │   - SSE Hub (Eventos)   │
                    │   - OpenAPI REST API    │
                    └──────┬────────────┬─────┘
           Persistência    │            │ Streaming SSE
          (Drizzle ORM)    │            │ (game.score.updated, etc.)
                           ▼            ▼
               ┌───────────────┐   ┌───────────────────────────┐
               │  PostgreSQL   │   │  React + Vite Frontend    │
               │  Relacional   │   │  - TanStack Query Cache   │
               └───────────────┘   │  - Recharts & Tailwind    │
                                   │  - Nginx Reverse Proxy    │
                                   └───────────────────────────┘
```

### Decisão Técnica Principal: Centralização de SSE vs Polling por Usuário

Para evitar que múltiplos navegadores clientes esgotem os limites de requisições da API da NBA (*HTTP 429 Too Many Requests*):
1. **Worker Centralizado no Backend:** Uma rotina única consulta periodicamente a API externa (`SYNC_INTERVAL_MS`).
2. **Deteção de Mutações (Diffing):** A aplicação compara as alterações em placares, relógio e períodos.
3. **Persistência Relacional:** As atualizações são salvas no PostgreSQL via **Drizzle ORM**.
4. **Broadcast via Server-Sent Events (SSE):** O `SSEHub` transmite os eventos formatados para todos os navegadores conectados em uma única conexão HTTP persistente.
5. **Atualização Granular no Frontend:** O TanStack Query muta o cache local (`queryClient.setQueryData`) sem recarregar a tela ou realizar novas consultas de rede.

---

## 🚀 Tecnologias Utilizadas

### Backend
- **Bun** — Runtime e gerenciador de pacotes ultrarrápido
- **TypeScript** — Tipagem estrita com modo strict ativado
- **Hono** — Framework HTTP de alta performance e baixo overhead
- **Drizzle ORM** — Mapeamento relacional type-safe com migrations versionadas
- **PostgreSQL** — Persistência relacional com índices e chaves estrangeiras
- **Zod** — Validação rigorosa de esquemas e variáveis de ambiente
- **Server-Sent Events (SSE)** — Transmissão contínua de eventos com heartbeat
- **OpenAPI 3.0 / Swagger UI** — Documentação interativa em `/docs`

### Frontend
- **React 18 + Vite** — Aplicação SPA moderna e responsiva
- **Tailwind CSS** — Estilização moderna e tema escuro esportivo
- **shadcn/ui** — Componentes acessíveis e consistentes
- **TanStack Query** — Gerenciamento de estado assíncrono e cache inteligente
- **Recharts** — Gráficos comparativos de arremessos e eficiência
- **Lucide React** — Iconografia moderna

### Infraestrutura & Deploy
- **Docker & Docker Compose** — Orquestração de containers com health checks e volumes
- **Nginx** — Servidor web de produção e proxy reverso para `/api`
- **Multi-stage Builds** — Imagens enxutas e otimizadas

---

## 📁 Estrutura do Monorepo

```text
nba_stats/
├── apps/
│   ├── api/                     # Backend Bun + Hono
│   │   ├── src/
│   │   │   ├── infrastructure/  # DB Drizzle, SSE Hub, Config e Worker
│   │   │   ├── modules/         # Clean Architecture (Games, Teams, Players, Standings)
│   │   │   ├── providers/       # Adapter Pattern (BallDontLie & Mock Simulators)
│   │   │   ├── middleware/      # Rate limiter, CORS, Logger, Error Handler
│   │   │   └── index.ts         # Composition root do servidor
│   │   ├── tests/               # Testes com Bun Test
│   │   └── Dockerfile           # Multi-stage Dockerfile para o backend
│   └── web/                     # Frontend React + Vite
│       ├── src/
│       │   ├── components/      # UI components (Button, Modal, Badge, Card, etc.)
│       │   ├── features/        # Módulos visuais (Dashboard, Teams, Standings, etc.)
│       │   ├── hooks/           # useGameEvents (SSE com auto-reconnect)
│       │   └── services/        # Cliente API desacoplado
│       ├── nginx.conf           # Configuração de proxy e buffer SSE
│       └── Dockerfile           # Multi-stage Dockerfile Nginx
├── packages/
│   └── shared/                  # Contratos de domínio, DTOs e tipos compartilhados
├── docker-compose.yml           # Orquestração (postgres + api + web)
├── .env.example                 # Modelo de variáveis de ambiente
└── README.md
```

---

## ⚡ Como Executar o Projeto

### Pré-requisitos
- [Bun](https://bun.sh/) (v1.0+) ou [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/) e Docker Compose (para execução em containers)

---

### Opção 1: Execução com Docker Compose (Ambiente Completo de Produção)

1. Clone o repositório e configure as variáveis de ambiente:
```bash
cp .env.example .env
```

2. Inicie todos os serviços com build:
```bash
docker compose up --build
```

Os seguintes serviços estarão disponíveis:
- **Frontend NBA Live:** [http://localhost:3000](http://localhost:3000)
- **API Backend:** [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Documentação Swagger UI:** [http://localhost:3001/docs](http://localhost:3001/docs)
- **Health Check da Aplicação:** [http://localhost:3001/health](http://localhost:3001/health)

---

### Opção 2: Desenvolvimento Local (Execução Rápida com Bun)

1. Instale as dependências de todo o monorepo:
```bash
bun install
```

2. (Opcional) Gere as migrações do banco de dados:
```bash
bun run db:generate
```

3. Inicie o backend e o frontend simultaneamente:
```bash
# Inicia a API (porta 3001) e o Frontend (porta 3000 com proxy /api)
bun run dev:api
bun run dev:web
```

> **Resiliência Local:** Caso o PostgreSQL local não esteja iniciado, a API ativa automaticamente a camada de persistência em memória mantendo todos os dados, schemas e o streaming de SSE 100% funcionais!

---

## 🧪 Testes Automatizados

O projeto utiliza o **Bun Test** para testes unitários e de integração de serviços, providers e eventos SSE:

```bash
bun run test
```

Testes inclusos:
- ✅ Provedor Mock e integrador BallDontLie
- ✅ Clean Architecture Services (cálculo de agregados, box score, conferências)
- ✅ Broadcast, deduplicação e ciclo de vida do SSEHub
- ✅ Endpoints REST, OpenAPI Schema e simulação em tempo real

---

## 📡 Endpoints da REST API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/health` | Status do sistema, banco de dados e provider |
| `GET` | `/docs` | Swagger UI com documentação OpenAPI interativa |
| `GET` | `/api/v1/games` | Lista de jogos com paginação e filtros por data/temporada |
| `GET` | `/api/v1/games/live` | Jogos acontecendo em tempo real com placares |
| `GET` | `/api/v1/games/:id` | Detalhes completos da partida e evolução por quarto |
| `GET` | `/api/v1/games/:id/stats` | Box score individual dos atletas e comparação de equipes |
| `POST` | `/api/v1/games/:id/simulate-score` | Dispara pontuação simulada para teste do SSE |
| `GET` | `/api/v1/teams` | Listagem de franquias da NBA com filtro por conferência |
| `GET` | `/api/v1/teams/:id` | Perfil da equipe, cores e divisão |
| `GET` | `/api/v1/teams/:id/games` | Calendário e histórico recente de partidas da equipe |
| `GET` | `/api/v1/players` | Busca e paginação de atletas |
| `GET` | `/api/v1/players/:id` | Perfil físico, equipe e biografia do jogador |
| `GET` | `/api/v1/standings` | Classificação oficial das Conferências Leste e Oeste |
| `GET` | `/api/v1/events/games` | **Stream SSE em tempo real** |

### Eventos do Stream SSE (`/api/v1/events/games`)
- `game.started`: Notificação de início de partida
- `game.score.updated`: Atualização de placar, relógio e evolução por quarto
- `game.period.changed`: Fim e início de quarto (Q1, Q2, Q3, Q4, OT)
- `game.finished`: Conclusão do jogo com placar final e vencedor
- `system.ping`: Heartbeat periódico (a cada 15s) para manter conexões ativas

---

## 📈 Escalabilidade para Múltiplas Instâncias (Evolução Futura)

Em um ambiente de produção distribuído com múltiplas instâncias da API atrás de um balanceador de carga:
1. **Redis Pub/Sub:** Substituir o `EventEmitter` em memória por canais do Redis (`nba:events:games`).
2. **Leader Election:** Apenas um nó executa o `LiveSyncWorker` periodicamente para evitar duplicidade de consultas externas.
3. **Distribuição Horizontal:** Qualquer réplica da API que possua conexões abertas de navegadores recebe os eventos publicados via Redis e os repassa aos clientes SSE locais.

---

## 📄 Licença

Distribuído sob a licença MIT. Desenvolvido para portfólio Full Stack de alto nível.