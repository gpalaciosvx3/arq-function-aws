# arq-serverless-cdk

Arquetipo serverless NestJS + AWS CDK (TypeScript). Punto de partida para proyectos Lambda con Clean Architecture, observabilidad integrada y pruebas BDD. Incluye una feature de referencia `ping/pong` completamente implementada.

Todo lo transversal —errores, logging, respuestas HTTP, arranque del handler, clientes de AWS— vive en las librerías [`@gpalacios/*`](https://www.npmjs.com/package/@gpalacios/core), no en este repositorio. Aquí solo queda el negocio y el cableado.

---

## Índice

- [Las librerías de la plataforma](#las-librerías-de-la-plataforma)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Stack técnico](#stack-técnico)
- [Feature de referencia: ping/pong](#feature-de-referencia-pingpong)
- [Observabilidad](#observabilidad)
- [Fronteras de arquitectura](#fronteras-de-arquitectura)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [Tests](#tests)
- [CI/CD](#cicd)

---

## Las librerías de la plataforma

| Paquete | Qué aporta a este proyecto |
|---|---|
| `@gpalacios/core` | `CustomException`, `ValidationException`, `ErrorDictionary`, contrato `Logger`, `@HandleExecution`, tipos `ApiSuccessBody`/`ApiErrorBody`, procesamiento por lotes |
| `@gpalacios/aws-lambda` | `ApiGwHandlerFactory` y las otras 7 factories por trigger, middleware de parseo, `ApiGwHelper`, observabilidad Powertools (`appLogger`, `appTracer`, `appMetrics`) |
| `@gpalacios/arch-rules` | Perfil de dependency-cruiser que verifica las fronteras entre capas |

`@gpalacios/aws` (clientes de DynamoDB, S3, SQS, SNS, SES, Step Functions, SSM) **no está instalado**: la feature `ping` no toca ningún servicio. Al añadir el primero:

```bash
npm i @gpalacios/aws @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb   # solo el peer que uses
```

**Regla dura:** si algo de una librería resuelve lo que necesitas, se usa — no se escribe una versión local ni un wrapper que la envuelva. Si la librería no cubre un caso real, se reporta a `gpalacios-platform` en vez de taparlo aquí.

---

## Estructura del proyecto

```
arq-serverless-cdk/
  src/
    common/                        # Solo lo específico de este proyecto
      constants/env.constants.ts   # Variables de entorno obligatorias por función
      di/logger.token.ts           # Token con el que se inyecta el Logger
      errors/app.error-dictionary.ts  # Errores de negocio propios (prefijo ARQ-)
    ping/                          # Feature de referencia
      domain/
        constants/                 # PONG_MESSAGE
        service/                   # PingService — inyecta el contrato Logger
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
  infra/                           # Infraestructura AWS CDK — ver infra/README.md
```

`src/common/` es deliberadamente mínimo. Todo lo que antes vivía ahí (bootstrap, middleware, logger, tracer, metrics, helpers, errores transversales, tipos de respuesta) está ahora en las librerías.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20, TypeScript 5.5 strict |
| Framework | NestJS 10 (sin HTTP server — context-based) |
| Plataforma | `@gpalacios/core` + `@gpalacios/aws-lambda` |
| Lambda middleware | Middy 3.x (vía `@gpalacios/aws-lambda`) |
| Observabilidad | AWS Lambda Powertools v2 (Logger, Tracer, Metrics) |
| Validación | Zod 3.x |
| Tests | jest-cucumber 4.x (BDD: `.feature` + `.steps.ts`) |
| Arquitectura | dependency-cruiser + `@gpalacios/arch-rules` |
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
  "code": "CORE-001",
  "description": "El cuerpo de la solicitud no es válido",
  "issues": [{ "path": ["message"], "message": "String must contain at least 1 character(s)" }]
}
```

### Códigos de error

Los transversales los aporta `ErrorDictionary` de `@gpalacios/core` — no se redefinen aquí:

| Código | HTTP | Descripción |
|---|---|---|
| `CORE-001` | 400 | El cuerpo de la solicitud no es válido |
| `CORE-002` | 500 | Ocurrió un error inesperado |
| `CORE-003` | 500 | Variable de entorno requerida no encontrada |
| `CORE-004` | 403 | No tiene autorización para acceder a este recurso |

Los errores **de negocio** de cada proyecto van en `src/common/errors/app.error-dictionary.ts`, con la misma forma `InputError` y un prefijo propio. Nunca se mezclan con los `CORE-*`.

### Cómo se inyecta el logger

El dominio depende del contrato `Logger` de `@gpalacios/core`, no de Powertools. Quién lo implementa lo decide el módulo:

```ts
// ping.module.ts — el appLogger de la librería escribe por Powertools
providers: [{ provide: LOGGER, useValue: appLogger }, PingService, ...]

// ping.service.ts — el dominio solo conoce la interfaz
constructor(@Inject(LOGGER) private readonly logger: Logger) {}
```

En los tests se inyecta un mock del contrato; no hace falta simular Powertools.

---

## Observabilidad

`ApiGwHandlerFactory.build()` cablea las tres capas de Powertools vía middy — no hay wiring manual en este repositorio:

| Capa | Qué registra |
|---|---|
| **Logger** | Structured JSON logs con correlación. Formato `--- feature start/end ---` y `[PASO N]` fijado en `@gpalacios/core` |
| **Tracer** | X-Ray subsegmentos por operación I/O + anotaciones de negocio (`appTracer`) |
| **Metrics** | Métricas custom en namespace `Arquetipo/Business` (`appMetrics`) |

El `ObservabilityStack` (opcional, activo con `DEPLOY_OBSERVABILITY=true`) despliega:

- Alarmas por Lambda: error rate > 5%, p99 > 10 000 ms, throttles > 0
- Alarma DLQ: mensajes visibles > 0
- Alarma queue age: mensaje más antiguo > 300 s
- Dashboard CloudWatch unificado con widgets por Lambda, cola y tabla
- SNS Topic con suscripción email opcional (`ALARM_EMAIL`)

---

## Fronteras de arquitectura

```bash
npm run arch:check
```

Aplica el perfil `@gpalacios/arch-rules/serverless-nest` sobre `src/` e `infra/`:

- ninguna feature importa los internos de otra
- `domain/` no conoce `application/` ni `infrastructure/`
- `application/` no conoce `infrastructure/` (se inyecta al revés, con DI)
- `src/common/` no depende de ninguna feature
- el código de aplicación e `infra/` no se cruzan en ninguna dirección

Corre en el hook `pre-push` y en CI. El hook local se salta con `--no-verify`; el de CI no.

> La carpeta de IaC **debe** llamarse `infra/`: las dos últimas reglas anclan ahí sus rutas. Con otro nombre pasan en verde sin verificar nada.

---

## Flujo de datos (ping)

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
cd infra && npm install && cd ..

# Type-check
npm run typecheck

# Linter
npm run lint

# Fronteras de arquitectura
npm run arch:check

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
| `deploy.yml` | `pull_request` a `master` | Type-check, `arch:check`, tests y `cdk synth` |
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
```
