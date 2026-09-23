<p align="center">
  <a href="https://gustavopalacios.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/gpalaciosvx3/gpalaciosvx3/master/assets/brand/logo-dark.svg">
      <img src="https://raw.githubusercontent.com/gpalaciosvx3/gpalaciosvx3/master/assets/brand/logo-light.svg" alt="Gustavo Palacios" height="64">
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://gustavopalacios.dev"><img src="https://img.shields.io/badge/web-gustavopalacios.dev-17a267?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI%2BPGRlZnM%2BPG1hc2sgaWQ9Im0iPjxwYXRoIGQ9Ik0zMiAyIEw1OCAxNyBMNTggNDcgTDMyIDYyIEw2IDQ3IEw2IDE3IFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjggMTQgTDE3LjUgNTAgTTI4IDE0IEw0Ni41IDUwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iNC44IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSIyOCIgY3k9IjE0IiByPSI0LjYiIGZpbGw9IiMwMDAiLz48L21hc2s%2BPC9kZWZzPjxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIG1hc2s9InVybCgjbSkiLz48L3N2Zz4%3D" alt="Web"></a>
  <a href="https://www.npmjs.com/org/gpkit"><img src="https://img.shields.io/badge/npm-%40gpkit-CB3837?logo=npm&logoColor=white" alt="npm @gpkit"></a>
  <a href="https://www.linkedin.com/in/gustavopalaciosv"><img src="https://img.shields.io/badge/LinkedIn-gustavopalaciosv-0A66C2?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0yMC40NSAyMC40NWgtMy41NnYtNS41N2MwLTEuMzMtLjAzLTMuMDQtMS44NS0zLjA0LTEuODYgMC0yLjE0IDEuNDUtMi4xNCAyLjk0djUuNjdIOS4zNVY5aDMuNDF2MS41NmguMDVjLjQ4LS45IDEuNjQtMS44NSAzLjM3LTEuODUgMy42IDAgNC4yNyAyLjM3IDQuMjcgNS40NnY2LjI4ek01LjM0IDcuNDNhMi4wNiAyLjA2IDAgMSAxIDAtNC4xMyAyLjA2IDIuMDYgMCAwIDEgMCA0LjEzek03LjEyIDIwLjQ1SDMuNTZWOWgzLjU2djExLjQ1eiIvPjwvc3ZnPg%3D%3D" alt="LinkedIn"></a>
  <a href="https://github.com/gpalaciosvx3"><img src="https://img.shields.io/badge/GitHub-gpalaciosvx3-181717?logo=github&logoColor=white" alt="GitHub"></a>
</p>

# arq-function-aws

Arquetipo de **función AWS Lambda** con NestJS, Clean Architecture y pruebas BDD. Es dueño de su código y de la función que lo ejecuta; la infraestructura compartida vive en el repo de IaC. Incluye la feature de referencia `ping/pong`.

| Ficha | |
|---|---|
| Destino | AWS Lambda |
| Runtime | Node.js 20 · TypeScript 5.5 strict |
| Framework | NestJS 10 (context-based, sin servidor HTTP) |
| Plataforma | `@gpkit/core` · `@gpkit/aws-lambda` · `@gpkit/arch-rules` |
| Artefacto | Stack CDK: la función, su rol IAM y su log group |
| Despliegue | `aws-cdk-deploy` · `aws-cdk-destroy` |
| Contrato IaC | Nomenclatura `{REGION}{PROYECTO}{SERVICIO}{NNN}` |

---

## Índice

1. [Alcance](#1-alcance)
2. [Arquitectura](#2-arquitectura)
3. [Plataforma](#3-plataforma)
4. [Feature de referencia](#4-feature-de-referencia)
5. [Desarrollo local](#5-desarrollo-local)
6. [Calidad](#6-calidad)
7. [Despliegue](#7-despliegue)
8. [Contrato con IaC](#8-contrato-con-iac)
9. [Anexos](#9-anexos)

---

## 1. Alcance

| Recurso | Dónde vive |
|---|---|
| Código de la función | **Aquí** (`src/`) |
| La función, su rol IAM, log group, variables de entorno y alarmas propias | **Aquí** (`infra/`, CDK) |
| El enganche de la función a un recurso compartido: event source mapping, target de una regla | **Aquí**, importando el recurso por su nombre estándar |
| HTTP API, rutas, integración, rol que invoca la función, autorizadores, dominio, CORS | IaC |
| Colas, DLQ, buses de EventBridge, tablas y sus streams, buckets | IaC |
| Alarmas de colas y DLQ, dashboards de plataforma | IaC |

---

## 2. Arquitectura

### Estructura

```
arq-function-aws/
  src/
    common/
      constants/env.constants.ts      # Variables de entorno obligatorias por función
      errors/app.error-dictionary.ts  # Errores de negocio propios (prefijo ARQ-)
    ping/
      domain/                         # Agnóstico de la nube — solo @gpkit/core
        constants/  mapper/  service/  types/
      application/                    # Agnóstico de la nube — solo @gpkit/core
        dtos/  use-cases/
      infrastructure/                 # Lo único propio de Lambda en src/
        bootstrap/                    # PingModule + ping.handler.ts (entry point)
        controller/                   # PingController + @HandleExecution + ApiGwHelper
  test/
    ping/                             # features/*.feature + *.steps.ts
  infra/
    bin/ping.ts                       # Entry point CDK — PingStack + ObservabilityStack opcional
    lib/
      stacks/                         # ping.stack.ts · observability.stack.ts
      ping-constructs/
        cloudwatch/                   # Log group, retención 1 semana
        iam/                          # Rol mínimo: BasicExecution + XRayDaemonWriteAccess
        lambda/
          shared/bundling.config.ts   # Opciones de esbuild compartidas
          ping/ping-fn.construct.ts   # LogGroup + Role + NodejsFunction
      observability-constructs/
        sns/  cloudwatch/             # Topic, alarmas y dashboard de la función
    common/constants/
      naming.constants.ts             # Nombres canónicos — el contrato con IaC
      resource.constants.ts           # Alias semánticos
      infra.constants.ts              # Timeout, memoria, umbrales de alarmas
```

### Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20, TypeScript 5.5 strict |
| Framework | NestJS 10 |
| Middleware Lambda | Middy (vía `@gpkit/aws-lambda`) |
| Observabilidad | AWS Lambda Powertools v2 (vía `@gpkit/aws-lambda`) |
| Validación | Zod 3.x |
| Tests | jest-cucumber 4.x |
| Arquitectura | dependency-cruiser + `@gpkit/arch-rules` |
| Infra | AWS CDK v2 |
| Calidad | ESLint + Prettier + Husky |

### Capas

`domain/` y `application/` importan únicamente `@gpkit/core`: el logger lo obtienen con `getLogger()`, que la factory deja registrado al arrancar. Solo `infrastructure/` conoce Lambda.

---

## 3. Plataforma

| Paquete | Qué aporta |
|---|---|
| `@gpkit/core` | `CustomException`, `ValidationException`, `ErrorDictionary`, `getLogger()`, `@HandleExecution`, tipos `ApiSuccessBody` / `ApiErrorBody`, procesamiento por lotes |
| `@gpkit/aws-lambda` | Factories de handler por disparador, middleware de parseo, `ApiGwHelper`, observabilidad Powertools |
| `@gpkit/arch-rules` | Perfil de dependency-cruiser con las fronteras entre capas |

**No instalado:** `@gpkit/aws` (clientes de DynamoDB, S3, SQS, SNS, SES, Step Functions, SSM). `ping` no toca ningún servicio. Al añadir el primero: `npm i @gpkit/aws` + el peer del SDK que uses.

**Regla dura:** si una librería resuelve lo que necesitas, se usa. Si no cubre un caso real, se agrega en `pt-npm-packages`, no aquí.

---

## 4. Feature de referencia

La ruta la declara IaC; este es el contrato que atiende la función.

```
POST /ping
Content-Type: application/json

{ "message": "hello" }
```

**`200`**

```json
{ "data": { "message": "pong", "echo": "hello", "receivedAt": "2026-05-27T10:00:00.000Z" } }
```

**`400`** — mensaje vacío

```json
{
  "code": "CORE-001",
  "description": "El cuerpo de la solicitud no es válido",
  "issues": [{ "path": ["message"], "message": "String must contain at least 1 character(s)" }]
}
```

| Código | HTTP | Descripción |
|---|---|---|
| `CORE-001` | 400 | El cuerpo de la solicitud no es válido |
| `CORE-002` | 500 | Ocurrió un error inesperado |
| `CORE-003` | 500 | Variable de entorno requerida no encontrada |
| `CORE-004` | 403 | No tiene autorización para acceder a este recurso |

Los `CORE-*` vienen de `@gpkit/core`. Los errores de negocio van en `src/common/errors/app.error-dictionary.ts` con prefijo propio.

---

## 5. Desarrollo local

```bash
npm install
cd infra && npm install && cd ..
```

Para invocar la función ya desplegada, sin pasar por el API:

```bash
aws lambda invoke --function-name UE1ARQLMB001 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"version":"2.0","body":"{\"message\":\"hello\"}","headers":{},"requestContext":{"http":{"method":"POST"}}}' \
  out.json && cat out.json
```

---

## 6. Calidad

| Script | Qué verifica |
|---|---|
| `npm run typecheck` | Tipos de `src/` y `test/` |
| `npm run lint` | ESLint, incluidas las reglas de `infra/` |
| `npm run arch:check` | Fronteras de capas sobre `src/` e `infra/` |
| `npm test` | Escenarios BDD (jest-cucumber) con cobertura mínima del 80% |
| `npm run format` | Prettier |

Reglas de `arch:check`: ninguna feature importa internos de otra; `domain/` no conoce `application/` ni `infrastructure/`; `application/` no conoce `infrastructure/`; `src/common/` no depende de features; `src/` e `infra/` no se cruzan. La carpeta **debe** llamarse `infra/`: las reglas anclan ahí su ruta.

Hooks: `lint-staged` en `pre-commit`, `arch:check` en `pre-push`.

---

## 7. Despliegue

| Workflow | Disparador | Acción |
|---|---|---|
| `deploy.yml` | `pull_request` a `master` | `node-validate`: tipos, lint, `arch:check`, tests y `cdk synth` |
| `deploy.yml` | `push` a `master` | `aws-cdk-deploy` |
| `deploy-manual.yml` | Manual | Despliega cualquier rama, tag o SHA |
| `destroy.yml` | Manual, escribiendo `DESTRUIR` | Destruye los stacks de este repo; nada de IaC |

Las plantillas viven en `pt-ci-pipelines` y autentican por OIDC.

**Variables del environment `deployer`**

| Variable | Uso |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | Rol que asume el pipeline |
| `AWS_ACCOUNT_ID` | Cuenta destino |
| `AWS_REGION` | Región destino |
| `DEPLOY_OBSERVABILITY` | Opcional — `true` despliega el `ObservabilityStack` |
| `ALARM_EMAIL` | Opcional — email suscrito al topic de alarmas |

**Qué despliega**

| Stack | Recurso | Nombre |
|---|---|---|
| `PingStack` | Lambda | `UE1ARQLMB001` |
| `PingStack` | IAM Role | `UE1ARQROL001` |
| `PingStack` | Log Group | `/aws/lambda/UE1ARQLMB001` |
| `ObservabilityStack` | Alarmas: error rate > 5%, p99 > 10 000 ms, throttles > 0 | `UE1ARQALM001`–`003` |
| `ObservabilityStack` | Dashboard y SNS topic (desactivados por defecto) | `UE1ARQCWD001` · `UE1ARQSNS001` |

Requisito de cuenta: `cdk bootstrap` hecho una vez.

---

## 8. Contrato con IaC

**Nomenclatura, sin SSM.** Ambos lados construyen el mismo nombre con `{REGION}{PROYECTO}{SERVICIO}{NNN}`: Terraform crea el recurso y este repo lo declara en `infra/common/constants/naming.constants.ts`. Los ARN se arman con `Stack.formatArn`.

| Dirección | Qué | Cómo |
|---|---|---|
| IaC → función | Ruta `POST /ping` e integración | IaC invoca `UE1ARQLMB001` con un rol propio (`credentials_arn`). La función no lleva `lambda.Permission` |
| Función → IaC | Colas, buses, tablas | Este repo los importa por nombre (ver [9.2](#92-enganchar-otros-disparadores)) |

- **Orden del primer despliegue:** IaC primero, este repo después. Hasta entonces la ruta responde 500.
- **Payload:** la integración debe declarar `payload_format_version = "2.0"`.

---

## 9. Anexos

### 9.1 Observabilidad

`ApiGwHandlerFactory.build()` cablea Powertools y registra su logger en `@gpkit/core`: `getLogger()` escribe JSON estructurado con el formato `--- feature start/end ---` y `[PASO N]`. Trazas en X-Ray (`tracing: ACTIVE`) y métricas en el namespace `Arquetipo/Business`. `appTracer` y `appMetrics` se usan desde `infrastructure/`, nunca desde el dominio.

### 9.2 Enganchar otros disparadores

Un construct en `infra/lib/<feature>-constructs/<servicio>/` importa el recurso por nombre y crea solo el enganche. El recurso nunca se crea aquí.

| Disparador | Lo que crea este repo | Cómo importa el recurso | Factory |
|---|---|---|---|
| HTTP API | Nada | — | `ApiGwHandlerFactory` |
| SQS | `EventSourceMapping` con `reportBatchItemFailures` + permisos de consumo | `Queue.fromQueueArn` con el ARN armado desde el nombre | `SqsHandlerFactory` |
| EventBridge | `events.Rule` con la función como target | `EventBus.fromEventBusName` | `EventBridgeHandlerFactory` |
| DynamoDB Streams | `EventSourceMapping` + permisos de lectura | El ARN lleva un timestamp: `AwsCustomResource` (`DescribeTable`) | `DynamoStreamHandlerFactory` |
| S3 | `lambda.Permission` para `s3.amazonaws.com` | `arn:aws:s3:::<nombre>` | `S3HandlerFactory` |
