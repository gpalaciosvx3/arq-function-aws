# arq-serverless-cdk

Arquetipo serverless NestJS + AWS CDK (TypeScript). Punto de partida para proyectos Lambda con Clean Architecture, observabilidad integrada y pruebas BDD. Incluye una feature de referencia `ping/pong` completamente implementada.

---

## Índice

- [Estructura del proyecto](#estructura-del-proyecto)
- [Stack técnico](#stack-técnico)
- [Feature de referencia: ping/pong](#feature-de-referencia-pingpong)
- [Observabilidad](#observabilidad)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [Tests](#tests)
- [CI/CD](#cicd)

---

## Estructura del proyecto

```
project-template/
  src/
    common/                        # Infraestructura transversal
      bootstrap/
        factories/                 # LambdaHandlerFactory (ApiGw, SQS, DynamoStream)
      config/                      # aws.config.ts — clientes SDK + singletons Powertools
      constants/                   # env.constants.ts, error codes
      decorator/                   # @HandleExecution
      errors/                      # CustomException, ValidationException, aws-error.mapper
      helpers/                     # ApiGwHelper, batch-processing
      logger/                      # AppLogger (@Injectable + singleton)
      metrics/                     # AppMetrics (@Injectable)
      middleware/                  # middy: parseApiGwEvent, parseSqsEvent, envValidation
      tracer/                      # AppTracer (@Injectable)
      types/                       # api-response, batch-processing, process-record-result
    ping/                          # Feature de referencia
      domain/
        constants/                 # PONG_MESSAGE
        service/                   # PingService — constructor injection de Logger/Tracer/Metrics
        types/                     # PingInput, PingOutput
      application/
        dtos/                      # PingRequestSchema (Zod)
        use-cases/                 # PingUseCase
      infrastructure/
        bootstrap/                 # PingModule, ping.handler.ts (entry point Lambda)
        controller/                # PingController + @HandleExecution
  test/
    ping/
      features/ping.feature        # Escenarios BDD
      ping.steps.ts                # Steps jest-cucumber
  cdk/                             # Infraestructura AWS CDK — ver cdk/README.md
```

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20, TypeScript 5.5 strict |
| Framework | NestJS 10 (sin HTTP server — context-based) |
| Lambda middleware | Middy 3.x |
| Observabilidad | AWS Lambda Powertools v2 (Logger, Tracer, Metrics) |
| Validación | Zod 3.x |
| Tests | jest-cucumber 4.x (BDD: `.feature` + `.steps.ts`) |
| Infra | AWS CDK v2 |
| Calidad | Prettier 3.x + Husky 9.x (pre-push hook) |

---

## Feature de referencia: ping/pong

### Endpoint

```
POST /ping
Content-Type: application/json

{ "message": "hello" }
```

**Response `200`:**
```json
{
  "data": {
    "message": "pong",
    "echo": "hello",
    "receivedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

**Response `400` — mensaje vacío:**
```json
{
  "code": "ARQ-001",
  "description": "VALIDATION_ERROR",
  "issues": [{ "path": ["message"], "message": "String must contain at least 1 character(s)" }]
}
```

### Códigos de error

| Código | HTTP | Descripción |
|---|---|---|
| `ARQ-001` | 400 | Error de validación (Zod) |
| `ARQ-002` | 500 | Error interno inesperado |
| `ARQ-003` | 500 | Variable de entorno faltante |

---

## Observabilidad

Cada Lambda emite las tres capas de Powertools automáticamente vía middy (`LambdaHandlerFactory`):

| Capa | Qué registra |
|---|---|
| **Logger** | Structured JSON logs con correlación. Steps `[PASO N]` en domain services |
| **Tracer** | X-Ray subsegmentos por operación I/O + anotaciones de negocio |
| **Metrics** | Métricas custom en namespace `Arquetipo/Business` |

El `ObservabilityStack` (opcional, activo con `DEPLOY_OBSERVABILITY=true`) despliega:

- Alarmas por Lambda: error rate > 5%, p99 > 10 000 ms, throttles > 0
- Alarma DLQ: mensajes visibles > 0
- Alarma queue age: mensaje más antiguo > 300 s
- Dashboard CloudWatch unificado con widgets por Lambda, cola y tabla
- SNS Topic con suscripción email opcional (`ALARM_EMAIL`)

---

## Instalación y desarrollo local

### Flujo de datos (ping)

```
Cliente
  │  POST /ping  { "message": "hello" }
  ▼
API Gateway REST
  └──► Lambda ping
            │  PingController → PingUseCase → PingService
            └──► { message: "pong", echo: "hello", receivedAt: "..." }
```

### Recursos AWS (arquetipo base)

| Recurso | Nombre | Descripción |
|---|---|---|
| API Gateway REST | `UE1ARQGTW001` | Entry point — `POST /ping` |
| Lambda `ping` | `UE1ARQLMB001` | Recibe POST /ping y responde con pong |
| IAM Role | `UE1ARQROL001` | BasicExecutionRole + XRayDaemonWriteAccess |
| CloudWatch Log Group | `/aws/lambda/UE1ARQLMB001` | Retención 1 semana |
| CloudWatch Dashboard | `UE1ARQCWD001` | Widgets por Lambda (opcional — ObservabilityStack) |
| SNS Topic | — | Alarmas — suscripción email opcional (opcional) |



---

## Instalación y desarrollo local

```bash
# Instalar dependencias del proyecto (src + tests)
npm install

# Instalar dependencias CDK
cd cdk && npm install && cd ..

# Type-check
npx tsc --noEmit

# Tests BDD (con cobertura)
npm test

# Formatear código
npm run format
```

---

## Tests

```bash
npm test
```

Los tests usan **jest-cucumber**: cada feature tiene un archivo `.feature` (Gherkin) y un `.steps.ts`.

| Suite | Escenarios | Cobertura |
|---|---|---|
| `test/ping/ping.steps.ts` | 2 | 100% |

---

## CI/CD

### Pipelines

| Archivo | Trigger | Acción |
|---|---|---|
| `deploy.yml` | `push` a `master` | Deploy en AWS |
| `destroy.yml` | Manual (`workflow_dispatch`) | Destruye el stack del stage seleccionado |

### Secretos requeridos

Configurar en GitHub → Settings → Environments:

**`deployer` — Secrets:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
CDK_DEFAULT_ACCOUNT
AWS_DEFAULT_REGION
```

**`deployer` — Variables:**
```
DEPLOY_OBSERVABILITY   # Opcional — "true" para desplegar el ObservabilityStack (default: no se despliega)
ALARM_EMAIL            # Opcional — email para suscripción SNS de alarmas
ENVIRONMENT           # Opcional — nombre del entorno (default: "dev")
```
