# CLAUDE.md

Este arquivo orienta o Claude (e qualquer dev) a trabalhar neste repositório com contexto consistente sobre arquitetura, convenções e plano de implementação.

## Visão geral do projeto

**Ticketly** (nome pode evoluir — o domínio já não é mais "assento") é uma plataforma de venda de ingressos para eventos, com três perfis de acesso: **usuário comum**, **organizador (dono do evento)** e **admin geral**. O desafio técnico central é evitar **overselling** — vender mais ingressos de um tipo do que a quantidade disponível — sob alta concorrência, sem sobrecarregar o banco relacional.

Arquitetura de microsserviços com mensageria híbrida (Kafka para eventos de domínio, ActiveMQ para tarefas pontuais de fila), containerizado com Docker e orquestrado em Kubernetes.

## Stack tecnológica

- **Backend**: Java 17 + Spring Boot 4.1.x (Web, Data JPA, Security, Validation)
- **Frontend**: React 18 + Vite + TypeScript
- **Cache / controle de estoque**: Redis
- **Mensageria de eventos**: Apache Kafka
- **Mensageria de filas pontuais**: ActiveMQ (Artemis)
- **Banco de dados**: PostgreSQL (um schema/instância por serviço)
- **Storage de documentos**: MinIO (S3 compatível) — alvarás e docs de aprovação de evento
- **Containerização**: Docker + Docker Compose (dev local)
- **Orquestração**: Kubernetes (Helm charts ou manifests puros)
- **Observabilidade** (fase avançada): Prometheus + Grafana

## Perfis de acesso

| Perfil | O que faz |
|---|---|
| `USER` | Navega eventos filtrando por cidade, compra ingressos, visualiza "meus ingressos" com QR code |
| `ORGANIZER` | Cria evento (capacidade, cidade, data), envia documentos para aprovação, cria tipos de ingresso com preços, acompanha dashboard de vendas, valida ingressos na entrada |
| `ADMIN` | Aprova/rejeita eventos após análise de documentos, gerencia usuários, acessa dashboard global da plataforma |

## Arquitetura de microsserviços

| Serviço | Responsabilidade | Persistência |
|---|---|---|
| `api-gateway` | Roteamento, rate limiting, validação de JWT e perfil | — |
| `user-service` | Cadastro, autenticação JWT, perfis (`USER`/`ORGANIZER`/`ADMIN`), cidade do usuário | PostgreSQL |
| `event-service` | CRUD de eventos, upload de documentos, workflow de aprovação, CRUD de tipos de ingresso | PostgreSQL + MinIO |
| `order-service` | Controle de estoque por tipo de ingresso, criação de pedidos | PostgreSQL + Redis |
| `payment-service` | Processamento de pagamento (simulado) | PostgreSQL |
| `ticket-service` | Geração de ingresso (QR code assinado), validação na portaria | PostgreSQL |
| `notification-service` | E-mail de confirmação com ingresso anexado | — (stateless) |
| `dashboard-service` | Modelo de leitura (CQRS) para métricas de vendas do organizador e da plataforma | PostgreSQL (read model) |

### Mensageria — quando usar o quê

- **Kafka** (múltiplos consumidores, alto volume, replay possível): tópicos `event-events` (`EventSubmitted`, `EventApproved`, `EventRejected`), `order-events` (`OrderCreated`, `PaymentConfirmed`, `PaymentFailed`), `ticket-events` (`TicketIssued`, `TicketValidated`). `dashboard-service` consome todos esses tópicos para montar as métricas sem acoplar aos serviços de escrita.
- **ActiveMQ** (um único consumidor, garantia de entrega individual, ack manual): filas `payment-processing`, `ticket-generation`, `email-notifications`.

### Fluxo crítico de compra (onde a concorrência acontece)

1. Usuário escolhe tipo de ingresso e quantidade → `order-service` executa `DECRBY` atômico (via Lua script) no contador Redis daquele tipo de ingresso.
2. Sem estoque suficiente → erro imediato, sem tocar no banco relacional.
3. Estoque reservado → cria pedido `PENDING` no Postgres → publica `OrderCreated` no Kafka.
4. `payment-service` processa via fila ActiveMQ `payment-processing`.
5. Pagamento aprovado → publica `PaymentConfirmed` → `ticket-service` gera um QR code por ingresso do pedido.
6. Pagamento falha ou expira → `INCRBY` devolve o estoque no Redis → publica `PaymentFailed`.

### Fluxo de aprovação de evento

1. Organizador cria evento com status `PENDING_APPROVAL` e envia documentos (alvará etc.) para o MinIO via `event-service`.
2. Evento não aparece nas buscas de usuários enquanto pendente.
3. Admin revisa os documentos e aprova (`APPROVED`) ou rejeita (`REJECTED`, com justificativa).
4. Evento aprovado passa a ser listado, filtrável por cidade.
5. Só após aprovado o organizador pode criar tipos de ingresso e abrir vendas.

## Convenções de código

- **Java**: pacotes por feature (não por camada), ex. `com.ticketly.order.{controller,service,repository,domain}`. DTOs separados de entidades JPA. Usar `record` para DTOs imutáveis.
- **REST**: rotas no plural (`/events`, `/orders`, `/tickets`), status HTTP semânticos. Autorização por perfil via `@PreAuthorize` (Spring Security) ou filtro JWT próprio.
- **Erros de API**: formato simples `{ "code": "ALGO_ERROR_CODE", "message": "texto legível" }` (não RFC 7807/`ProblemDetail`, decisão consciente de simplicidade). Mensagens vêm de `messages.properties` via `MessageSource` do Spring, resolvido por `Accept-Language` — ver `user-service/src/main/java/com/ticketly/user/exception/`. Cada erro de domínio é uma exceção que estende `ApiException` com um `ErrorCode` (enum: chave de mensagem + `HttpStatus`).
- **Eventos Kafka**: payload em JSON, versionado (`schema_version` no envelope), nome do tópico em kebab-case.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- **Testes**: unitários com JUnit 5 + Mockito; integração com Testcontainers (Postgres, Redis, Kafka reais em container).
- **Frontend**: componentes funcionais, hooks, TypeScript estrito, chamadas à API centralizadas em uma camada `services/` (a criar quando a primeira tela consumir a API). Três áreas de rota via `react-router-dom`: pública/usuário (`src/pages/public`), painel do organizador (`src/pages/organizer`), painel do admin (`src/pages/admin`) — cada uma com seu layout em `src/components/layout/`. Componentes de UI do shadcn ficam em `src/components/ui/` (gerados, não editar à mão — reinstalar via CLI); componentes de domínio (ex. `event-card.tsx`) em `src/components/<domínio>/`. Alias `@/*` aponta pra `src/*`.

### Controle de versão (branches, commits e demandas)

- Toda demanda de trabalho tem um código curto (ex.: `EV-001`, `EV-002`, ...) usado tanto no nome da branch quanto na mensagem de commit.
- **Branch**: `EV-001-definicao-arquitetura` (código da demanda + slug descritivo em kebab-case).
- **Commit**: código da demanda no início da mensagem, seguido do padrão Conventional Commits, ex.: `EV-001: chore: estrutura inicial do monorepo`.
- **Sem trailer `Co-Authored-By` do Claude** nos commits deste repositório — o usuário deve aparecer como único autor/committer no GitHub.
- Repositório remoto: https://github.com/DiogoLeonardoo/Ticketly (branch principal `main`, via SSH).

## Frontend — stack e design system

Iniciado na demanda `EV-002` (junto com identidade/perfis), como base pra todas as fases seguintes de UI.

### Stack

- Vite + React 18 + TypeScript, Tailwind CSS v4 (via plugin `@tailwindcss/vite`, sem `tailwind.config.js` — configuração em `src/index.css`), shadcn/ui (base `radix`, preset `nova`, componentes gerados em `src/components/ui/`), `react-router-dom` pra as 3 áreas de rota.
- `frontend/components.json` é a config do shadcn CLI — usar `npx shadcn@latest add <componente>` pra trazer novos componentes, nunca copiar manualmente.

### Paleta de cores

Decisão de identidade visual: verde escuro (tom "ingresso premium/teatro") + dourado como acento de CTA. Implementada como CSS custom properties em `frontend/src/index.css` (claro e escuro), mapeadas nos tokens do shadcn:

| Token shadcn | Uso | Cor (claro) |
|---|---|---|
| `--primary` | Botões de ação principal (comprar ingresso, confirmar, submit) | Dourado `#c9a227` |
| `--sidebar` / `--sidebar-*` | Fundo da navegação nos painéis de organizador e admin (não usado na área pública) | Verde floresta `#0f3d2e` |
| `--secondary-foreground` | Texto de marca (logo "Ticketly", títulos de destaque) na área pública | Verde floresta `#0f3d2e` |
| `--success` / `--success-foreground` | Estados semânticos de sucesso (pedido confirmado, pagamento aprovado) | Verde `#16a34a` — **de propósito diferente** do verde de marca, pra não confundir "isto é a marca" com "isto é uma confirmação" |
| `--background`, `--muted`, `--border` | Neutros da área pública | Tons quentes (não cinza puro), ex. `#f7f5ef` |

Modo escuro replica a mesma lógica com tons ajustados (ver bloco `.dark` em `index.css`). Cores de `--chart-*` ficaram no padrão neutro do preset — decisão de paleta de gráficos fica pra quando o `dashboard-service` (Fase 7) existir de fato.

### Estrutura de pastas

```
frontend/src/
├── components/
│   ├── ui/          # gerado pelo shadcn CLI — não editar à mão
│   ├── layout/       # PublicLayout+Navbar (área pública), DashboardLayout (organizer/admin, usa --sidebar)
│   └── <domínio>/    # ex. events/event-card.tsx
├── pages/
│   ├── public/        # rota pública/usuário
│   ├── organizer/     # painel do organizador
│   └── admin/         # painel do admin
└── services/          # camada de chamadas à API (criar por feature, ex. auth-service.ts)
```

### Skills de design instaladas (via `npx skills add`, não versionadas — ver `.gitignore`)

Pacotes de terceiros que seguem o padrão aberto Agent Skills, instalados em `.claude/skills/` (ignorado no git — cada dev que quiser usar roda o `npx skills add` de novo):

- **`mattbx/shadcn-skills`** → `shadcn-component-discovery` (busca componentes prontos no ecossistema shadcn antes de construir do zero — usada pra achar `navigation-menu`/`card` na Fase EV-002) e `shadcn-component-review` (audita componentes custom contra os padrões shadcn).
- **`emilkowalski/skill`** → pacote de design engineering (animações, polish de UI): `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `emil-design-eng`, `pick-ui-library`, `prototype`. Relevantes principalmente a partir da Fase 8 (frontend completo), quando o app tiver interações reais pra animar/revisar.
- **`pbakaus/impeccable`** (`npx impeccable install`) → detector de qualidade de design; registra hooks em `.claude/settings.local.json` que rodam depois de toda edição de arquivo de UI (`PostToolUse`) e no fim de cada resposta (`Stop`), via `.claude/skills/impeccable/scripts/hook.mjs`. Rodar `/impeccable init` (dentro do chat) quando o frontend tiver mais conteúdo, pra gerar o `PRODUCT.md` de contexto de design.

## Comandos úteis

```bash
# Subir toda a stack local
docker compose up -d

# Rodar um serviço específico em dev (fora do compose)
cd order-service && ./mvnw spring-boot:run

# Rodar testes de um serviço
./mvnw test

# Build de todas as imagens
docker compose build

# Aplicar manifests no cluster local (kind/minikube)
kubectl apply -k k8s/overlays/local
```

## Plano de implementação

### Fase 0 — Fundação (infra local) — demanda `EV-001`
- [x] Estrutura de monorepo (`/services/*`, `/frontend`, `/k8s`, `/docker`)
- [x] `docker-compose.yml` com Postgres, Redis, Kafka (modo KRaft), ActiveMQ, MinIO
- [x] Convenção de configuração (`application.yml` por perfil: `local`, `docker`, `k8s`)
- [x] Subir a stack local (`docker compose up -d`) e validar healthchecks
- [ ] Pipeline básico de CI (build + testes) — GitHub Actions

### Fase 1 — Identidade e perfis — demanda `EV-002`
- [x] `user-service`: cadastro (`POST /auth/register`), login com JWT (`POST /auth/login`), campo de cidade, perfis `USER`/`ORGANIZER`/`ADMIN` (cadastro de `ADMIN` bloqueado via API), testes unitários (`AuthServiceTest`, `JwtServiceTest`)
- [x] Frontend: scaffold Vite + React + TS, Tailwind + shadcn/ui, design system (paleta verde/dourado), roteamento das 3 áreas com layouts — ver seção "Frontend — stack e design system"
- [ ] Frontend: telas de login/cadastro de fato (formulário conectado à API, seleção de perfil usuário vs. organizador)
- [ ] `api-gateway`: retirado do escopo da `EV-002` — vira demanda própria mais adiante (roteamento + validação de JWT + checagem de perfil por rota)

### Fase 2 — Eventos e aprovação
- [ ] `event-service`: CRUD de evento (dados básicos + capacidade + cidade)
- [ ] Upload de documentos para MinIO, vínculo com o evento
- [ ] Workflow de status (`PENDING_APPROVAL` → `APPROVED`/`REJECTED`)
- [ ] Painel do admin: fila de eventos pendentes, aprovar/rejeitar
- [ ] Frontend: formulário de criação de evento (organizador) + fila de aprovação (admin)

### Fase 3 — Tipos de ingresso e listagem pública
- [ ] `event-service`: CRUD de tipos de ingresso (nome, preço, quantidade) vinculado a evento aprovado
- [ ] Endpoint público de listagem de eventos filtrando por cidade (`GET /events?city=`)
- [ ] Frontend: listagem/filtro de eventos, página de detalhe com tipos de ingresso

### Fase 4 — Núcleo de concorrência (compra, sem mensageria ainda)
- [ ] `order-service`: endpoint síncrono de compra com decremento atômico no Redis (Lua script)
- [ ] Testes de carga (k6 ou JMeter) simulando N usuários disputando o mesmo tipo de ingresso
- [ ] Testes de concorrência real com Testcontainers + threads paralelas (garantir que o estoque nunca fica negativo)

### Fase 5 — Mensageria assíncrona
- [ ] Configurar Kafka local e tópicos `event-events`, `order-events`, `ticket-events`
- [ ] `order-service` publica `OrderCreated`; `event-service` publica `EventApproved`/`EventRejected`
- [ ] Configurar ActiveMQ e filas `payment-processing`, `ticket-generation`, `email-notifications`
- [ ] `payment-service`: consome fila de pagamento, publica `PaymentConfirmed`/`PaymentFailed`
- [ ] Devolução de estoque (`INCRBY`) em caso de falha/expiração do pedido

### Fase 6 — Ingressos e validação
- [ ] `ticket-service`: consumer Kafka → gera QR code assinado (HMAC) por ingresso do pedido
- [ ] Geração de PDF do ingresso (OpenPDF)
- [ ] Endpoint de validação (`POST /tickets/{id}/validate`) restrito a `ORGANIZER` dono do evento
- [ ] `notification-service`: consome fila de e-mail, envia confirmação com ingresso anexado

### Fase 7 — Dashboards
- [ ] `dashboard-service`: consumer Kafka construindo read model de vendas
- [ ] Dashboard do organizador: vendidos por tipo, receita, validados vs. vendidos
- [ ] Dashboard do admin: visão agregada de todos os eventos/organizadores

### Fase 8 — Frontend completo
- [ ] Fluxo do usuário: buscar → escolher tipo/quantidade → checkout → confirmação → "meus ingressos"
- [ ] Painel do organizador: criação de evento, upload de docs, tipos de ingresso, dashboard, leitor de QR code
- [ ] Painel do admin: aprovação de eventos, gestão de usuários, dashboard global

### Fase 9 — Containerização e Kubernetes
- [ ] Dockerfile multi-stage para cada serviço Java (build + runtime slim)
- [ ] Dockerfile do frontend (build + nginx)
- [ ] Manifests K8s: Deployment, Service, ConfigMap, Secret por serviço
- [ ] StatefulSets/Helm para Postgres, Redis, Kafka, ActiveMQ, MinIO
- [ ] Ingress para `api-gateway` e frontend
- [ ] HPA no `order-service` (o gargalo do sistema em picos de venda)

### Fase 10 — Observabilidade e resiliência
- [ ] Métricas customizadas (Micrometer) expostas em `/actuator/prometheus`
- [ ] Dashboard Grafana para taxa de sucesso/falha de compra
- [ ] Circuit breaker (Resilience4j) entre `order-service` e dependências externas
- [ ] Logs estruturados (JSON) centralizados (opcional: ELK/Loki)

### Fase 11 — Polimento para portfólio
- [ ] README detalhado com diagrama de arquitetura e decisões técnicas
- [ ] Testes de carga documentados (antes/depois do contador Redis, antes/depois do HPA)
- [ ] Vídeo curto ou GIF demonstrando os três fluxos (usuário, organizador, admin)

## Notas de decisão (ADR resumido)

- **Por que decremento atômico no Redis em vez de lock por assento?** O domínio mudou de "assento único" para "estoque por tipo de ingresso" — não há mais identidade individual a travar, só uma quantidade a controlar. Um `DECRBY` atômico via Lua script resolve isso sem sobrecarregar o Postgres, e escala melhor pra picos de venda.
- **Por que Kafka E ActiveMQ, e não só um dos dois?** Propositalmente didático: Kafka mostra pub/sub com múltiplos consumidores (inclusive o `dashboard-service` fazendo CQRS); ActiveMQ mostra fila ponto-a-ponto com ack individual para tarefas que não podem duplicar (pagamento, geração de ticket, e-mail).
- **Por que um `dashboard-service` separado em vez de consultar direto o `order-service`?** Evita que o serviço de escrita (que já é o gargalo de concorrência) sofra a carga extra de queries analíticas. O read model consome os eventos do Kafka de forma assíncrona — bom exemplo de CQRS pra portfólio.
- **Por que MinIO para documentos?** Simula object storage real (S3) rodando localmente em container, evitando salvar arquivos binários no Postgres.
