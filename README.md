# arq-function-aws

Arquetipo de **función Lambda** con NestJS, Clean Architecture y pruebas BDD. Incluye una feature de referencia `ping/pong` completa.

El repo es dueño de **su código y de cómo se conecta**, nada más. La infraestructura que comparte con otros servicios —el HTTP API y sus rutas, colas, buses, tablas— vive en el repo de IaC (Terraform) y se consume por contrato.

Tiene un gemelo en Azure: [`arq-function-azure`](https://github.com/gpalaciosvx3/arq-function-azure). `domain/`, `application/` y `test/` son **idénticos** en ambos; cambia solo `infrastructure/` y la forma de desplegar.

---

## Índice

- [Qué es de este repo y qué no](#qué-es-de-este-repo-y-qué-no)
- [El contrato con IaC](#el-contrato-con-iac)
- [Cablear otros disparadores](#cablear-otros-disparadores)
- [Las librerías de la plataforma](#las-librerías-de-la-plataforma)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Stack técnico](#stack-técnico)
- [Feature de referencia: ping/pong](#feature-de-referencia-pingpong)
- [Observabilidad](#observabilidad)
- [Fronteras de arquitectura](#fronteras-de-arquitectura)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [CI/CD](#cicd)

---

## Qué es de este repo y qué no

La línea es **quién es dueño del recurso**:

| Recurso | Dónde vive |
|---|---|
| La función: código, rol IAM, log group, variables de entorno, alarmas propias | **Aquí** (CDK en `infra/`) |
| El cable de la función al recurso compartido: event source mapping, target de una regla | **Aquí**, importando el recurso por su nombre estándar |
| HTTP API, **rutas, su integración y el rol que invoca la función**, autorizadores, dominio, CORS | IaC |
| Colas, DLQ, buses de EventBridge, tablas y sus streams, buckets | IaC |
| Alarmas de colas y DLQ, dashboards de plataforma | IaC |

En AWS la función es infraestructura (a diferencia de Azure Functions, donde el Function App lo crea IaC y el trigger se declara en el código), así que este repo conserva un CDK mínimo: la función y, si el trigger lo exige, su enganche.

---

## El contrato con IaC

**Nomenclatura, sin SSM.** Ambos lados construyen el mismo nombre con la regla `{REGION}{PROYECTO}{SERVICIO}{NNN}`: Terraform crea el recurso con ese nombre y este repo lo declara en `infra/common/constants/naming.constants.ts`. Los ARN se arman con `Stack.formatArn`; cuenta y región salen del stack.

**IaC → función.** IaC declara la ruta `POST /ping`, su integración y un rol con `lambda:InvokeFunction` sobre `arn:aws:lambda:<region>:<cuenta>:function:UE1ARQLMB001`. La integración usa ese rol (`credentials_arn`), así que la función **no lleva `lambda.Permission`** ni necesita conocer el ID del API. El ARN se arma sin que la función exista: no hay dependencia circular.

**Orden del primer despliegue:** IaC primero, después este repo. Hasta que la función exista la ruta responde 500; desde ahí cada release es solo `cdk deploy` de este repo.

> **Payload.** `ApiGwHandlerFactory` espera el formato **2.0** del HTTP API (`APIGatewayProxyEventV2`). La integración en IaC debe declarar `payload_format_version = "2.0"`.

---

## Cablear otros disparadores

Hoy HTTP no necesita nada en `infra/`. Para los demás, un construct en `infra/lib/<feature>-constructs/<servicio>/` importa el recurso **por nombre** y crea solo el enganche.

| Disparador | Lo que crea este repo | Cómo importa el recurso | Factory en `@gpkit/aws-lambda` |
|---|---|---|---|
| HTTP API | Nada — IaC invoca por rol | — | `ApiGwHandlerFactory` |
| SQS | `lambda.EventSourceMapping` con `reportBatchItemFailures` + permisos de consumo en el rol | `sqs.Queue.fromQueueArn` con el ARN armado desde el nombre | `SqsHandlerFactory` |
| EventBridge | `events.Rule` con la función como target | `events.EventBus.fromEventBusName` | `EventBridgeHandlerFactory` |
| DynamoDB Streams | `lambda.EventSourceMapping` + permisos de lectura del stream | El ARN del stream lleva un timestamp: se resuelve en despliegue con un `AwsCustomResource` (`DescribeTable`) | `DynamoStreamHandlerFactory` |
| S3 | `lambda.Permission` para `s3.amazonaws.com` (la notificación es del bucket y va en IaC) | `arn:aws:s3:::<nombre>` | `S3HandlerFactory` |

La cola, el bus, la tabla o el bucket **nunca** se crean aquí, aunque hoy los use una sola función.

---

## Las librerías de la plataforma

| Paquete | Qué aporta a este proyecto |
|---|---|
| `@gpkit/core` | `CustomException`, `ValidationException`, `ErrorDictionary`, contrato `Logger` + `getLogger()`, `@HandleExecution`, tipos `ApiSuccessBody`/`ApiErrorBody`, procesamiento por lotes |
| `@gpkit/aws-lambda` | `ApiGwHandlerFactory` y las otras factories por trigger, middleware de parseo, `ApiGwHelper`, observabilidad Powertools |
| `@gpkit/arch-rules` | Perfil de dependency-cruiser que verifica las fronteras entre capas |

`@gpkit/aws` (clientes de DynamoDB, S3, SQS, SNS, SES, Step Functions, SSM) **no está instalado**: la feature `ping` no toca ningún servicio. Al añadir el primero:

```bash
npm i @gpkit/aws @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb   # solo el peer que uses
```

**Regla dura:** si algo de una librería resuelve lo que necesitas, se usa — no se escribe una versión local ni un wrapper que la envuelva. Si la librería no cubre un caso real, se reporta a `pt-npm-packages` en vez de taparlo aquí.

**Solo `infrastructure/` importa `@gpkit/aws-lambda`.** `domain/` y `application/` usan únicamente `@gpkit/core` —el logger lo obtienen con `getLogger()`, que la factory deja registrado al arrancar—. Eso es lo que los mantiene idénticos a los de `arq-function-azure`.

---

## Estructura del proyecto

```
arq-function-aws/
  src/
    common/
      constants/env.constants.ts   # Variables de entorno obligatorias por función
      errors/app.error-dictionary.ts  # Errores de negocio propios (prefijo ARQ-)
    ping/                          # Feature de referencia
      domain/                      # ← idéntico en arq-function-azure
        constants/                 # PONG_MESSAGE
        mapper/                    # PingMapper — input → output
        service/                   # PingService — [PASO N] con getLogger()
        types/                     # PingInput, PingOutput
      application/                 # ← idéntico en arq-function-azure
        dtos/                      # PingRequestSchema (Zod)
        use-cases/                 # PingUseCase
      infrastructure/              # ← lo único propio de AWS en src/
        bootstrap/                 # PingModule, ping.handler.ts (entry point Lambda)
        controller/                # PingController + @HandleExecution + ApiGwHelper
  test/
    ping/
      features/ping.feature        # Escenarios BDD
      ping.steps.ts                # Steps jest-cucumber
  infra/                           # La función y su cableado — ver infra/README.md
```

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20, TypeScript 5.5 strict |
| Framework | NestJS 10 (sin HTTP server — context-based) |
| Plataforma | `@gpkit/core` + `@gpkit/aws-lambda` |
| Observabilidad | AWS Lambda Powertools v2 (Logger, Tracer, Metrics) vía la factory |
| Validación | Zod 3.x |
| Tests | jest-cucumber 4.x (BDD: `.feature` + `.steps.ts`) |
| Arquitectura | dependency-cruiser + `@gpkit/arch-rules` |
| Infra | AWS CDK v2 — solo la función y su cableado |
| Calidad | ESLint + Prettier + Husky (pre-commit y pre-push) |

---

## Feature de referencia: ping/pong

La ruta la define IaC; este es el contrato que la función atiende:

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

Los transversales los aporta `ErrorDictionary` de `@gpkit/core` — no se redefinen aquí:

| Código | HTTP | Descripción |
|---|---|---|
| `CORE-001` | 400 | El cuerpo de la solicitud no es válido |
| `CORE-002` | 500 | Ocurrió un error inesperado |
| `CORE-003` | 500 | Variable de entorno requerida no encontrada |
| `CORE-004` | 403 | No tiene autorización para acceder a este recurso |

Los errores **de negocio** van en `src/common/errors/app.error-dictionary.ts`, con la misma forma `InputError` y un prefijo propio. Nunca se mezclan con los `CORE-*`.

---

## Observabilidad

`ApiGwHandlerFactory.build()` cablea Powertools vía middy y registra su logger en `@gpkit/core`, así que `getLogger()` escribe por Powertools sin configurar nada:

| Capa | Qué registra |
|---|---|
| **Logger** | JSON estructurado con correlación. Formato `--- feature start/end ---` y `[PASO N]` fijado en `@gpkit/core` |
| **Tracer** | X-Ray (`tracing: ACTIVE` en la función) |
| **Metrics** | Namespace `Arquetipo/Business`. `appMetrics` / `appTracer` de `@gpkit/aws-lambda/observability` se usan desde `infrastructure/`, nunca desde el dominio |

El `ObservabilityStack` (opcional, `DEPLOY_OBSERVABILITY=true`) despliega solo lo que es de la función:

- Alarmas por Lambda: error rate > 5%, p99 > 10 000 ms, throttles > 0
- Dashboard CloudWatch con widgets por Lambda y métricas de negocio
- SNS Topic con suscripción email opcional (`ALARM_EMAIL`)

Las alarmas de colas y DLQ ya no están aquí: la cola es de IaC, y sus alarmas también.

---

## Fronteras de arquitectura

```bash
npm run arch:check
```

Aplica el perfil `@gpkit/arch-rules/serverless-nest` sobre `src/` e `infra/`:

- ninguna feature importa los internos de otra
- `domain/` no conoce `application/` ni `infrastructure/`
- `application/` no conoce `infrastructure/` (se inyecta al revés, con DI)
- `src/common/` no depende de ninguna feature
- el código de aplicación e `infra/` no se cruzan en ninguna dirección

Corre en el hook `pre-push` y en CI.

> La carpeta de IaC **debe** llamarse `infra/`: las dos últimas reglas anclan ahí sus rutas.

---

## Instalación y desarrollo local

```bash
npm install
cd infra && npm install && cd ..

npm run typecheck
npm run lint
npm run arch:check
npm test
npm run format
```

---

## CI/CD

| Archivo | Trigger | Acción |
|---|---|---|
| `deploy.yml` | `pull_request` a `master` | `node-validate`: tipos, lint, `arch:check`, tests y `cdk synth` |
| `deploy.yml` | `push` a `master` | `aws-cdk-deploy` |
| `deploy-manual.yml` | Manual | Despliega cualquier rama, tag o SHA |
| `destroy.yml` | Manual, escribiendo `DESTRUIR` | Destruye los stacks de este repo: la función, su rol y sus alarmas. Nada de IaC |

Las plantillas viven en [`pt-ci-pipelines`](https://github.com/gpalaciosvx3/pt-ci-pipelines) y autentican por **OIDC**: no hay llaves de AWS en el repo.

**Environment `deployer` — Variables:**

```
AWS_DEPLOY_ROLE_ARN    # Rol que asume el pipeline
AWS_ACCOUNT_ID
AWS_REGION
DEPLOY_OBSERVABILITY   # Opcional — "true" despliega el ObservabilityStack
ALARM_EMAIL            # Opcional — email suscrito al topic de alarmas
```
