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

- **Java**: pacotes por feature (não por camada), ex. `com.seatlock.order.{controller,service,repository,domain}`. DTOs separados de entidades JPA. Usar `record` para DTOs imutáveis.
- **REST**: rotas no plural (`/events`, `/orders`, `/tickets`), status HTTP semânticos, erros padronizados em `ProblemDetail` (RFC 7807). Autorização por perfil via `@PreAuthorize` (Spring Security).
- **Eventos Kafka**: payload em JSON, versionado (`schema_version` no envelope), nome do tópico em kebab-case.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- **Testes**: unitários com JUnit 5 + Mockito; integração com Testcontainers (Postgres, Redis, Kafka reais em container).
- **Frontend**: componentes funcionais, hooks, TypeScript estrito, chamadas à API centralizadas em uma camada `services/`. Três áreas de rota: pública/usuário, painel do organizador, painel do admin.

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

### Fase 0 — Fundação (infra local)
- [ ] Estrutura de monorepo (`/services/*`, `/frontend`, `/k8s`, `/docker`)
- [ ] `docker-compose.yml` com Postgres, Redis, Kafka (modo KRaft), ActiveMQ, MinIO
- [ ] Convenção de configuração (`application.yml` por perfil: `local`, `docker`, `k8s`)
- [ ] Pipeline básico de CI (build + testes) — GitHub Actions

### Fase 1 — Identidade e perfis
- [ ] `user-service`: cadastro, login, JWT, campo de cidade, perfis `USER`/`ORGANIZER`/`ADMIN`
- [ ] `api-gateway`: roteamento + validação de JWT e checagem de perfil por rota
- [ ] Frontend: login/cadastro, seleção de perfil no cadastro (usuário vs. organizador)

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
