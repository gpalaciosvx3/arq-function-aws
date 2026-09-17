# aq-api-serverless — CDK

Infraestructura AWS del arquetipo serverless CDK (TypeScript).

---

## Índice

- [Índice](#índice)
- [Estructura](#estructura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Despliegue en AWS](#despliegue-en-aws)
- [Comandos de referencia](#comandos-de-referencia)

---

## Estructura

```
infra/
  bin/
    ping.ts                               # Entry point — instancia AppStack + ObservabilityStack
  lib/
    stacks/
      ping.stack.ts                       # Stack principal: API Gateway + Lambda ping
      observability.stack.ts             # Stack de observabilidad: alarmas, dashboard, SNS
    ping-constructs/
      api-gateway/
        http-api.construct.ts            # REST API POST /ping
      cloudwatch/
        lambda-log-group.construct.ts    # Log group con retención 1 semana
      iam/
        ping-role.construct.ts           # Role mínimo: BasicExecution + XRayDaemonWriteAccess
      lambda/
        shared/bundling.config.ts        # Configuración esbuild compartida
        ping/ping-fn.construct.ts        # Lambda ping: LogGroup + Role + NodejsFunction
    observability-constructs/
      sns/
        alarm-topic.construct.ts         # SNS topic + suscripción email opcional
      cloudwatch/
        lambda-alarms.construct.ts       # Error rate + p99 + throttles por Lambda
        dlq-alarm.construct.ts           # Mensajes visibles en DLQ
        queue-age-alarm.construct.ts     # Edad máxima en colas de procesamiento
        observability-dashboard.construct.ts  # Dashboard unificado
  common/
    constants/
      naming.constants.ts               # NamingConstants — nombres canónicos de recursos
      resource.constants.ts             # ResourceConstants — alias semánticos
      infra.constants.ts                # InfraConstants — timeout, memory, umbrales de alarmas
```

### Dos stacks independientes

| Stack | Descripción |
|---|---|
| `AppStack` | Infraestructura funcional: API Gateway REST, Lambda ping, IAM Role, Log Group |
| `ObservabilityStack` | Monitoreo: alarmas por Lambda (error rate + p99 + throttles), dashboard CloudWatch, SNS topic. **Opcional** — solo se despliega si `DEPLOY_OBSERVABILITY=true` |

---

## Requisitos

- Node.js 20+
- AWS CLI configurado (para deploy en AWS)

---

## Instalación

```bash
cd infra && npm install

# Instalar CLI global (una sola vez)
npm install -g aws-cdk
```

---

## Despliegue en AWS

```bash
# Bootstrap (una vez por cuenta/región)
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# Preview
cdk diff

# Deploy
cdk deploy --require-approval never
```

---

## Comandos de referencia

### Verificar recursos en AWS

```bash
# Lambda
aws lambda list-functions --query 'Functions[*].FunctionName'

# API Gateway
aws apigateway get-rest-apis

# CloudWatch
aws cloudwatch list-dashboards
```

### Probar el endpoint desplegado

```bash
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/prod/ping \
  -H 'Content-Type: application/json' \
  -d '{"message": "hello"}'
```

**Response esperado:**
```json
{
  "data": {
    "message": "pong",
    "echo": "hello",
    "receivedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

---

## Recursos desplegados

### PingStack

| Recurso | Nombre lógico | Nombre físico |
|---|---|---|
| Lambda `ping` | `PingFnConstruct` | `UE1ARQLMB001` |
| API Gateway REST | `HttpApiConstruct` | `UE1ARQGTW001` |
| IAM Role | `PingRoleConstruct` | `UE1ARQROL001` |
| CloudWatch Log Group | `LambdaLogGroupConstruct` | `/aws/lambda/UE1ARQLMB001` |

### ObservabilityStack (opcional)

| Recurso | Construct | Descripción |
|---|---|---|
| SNS Topic | `AlarmTopicConstruct` | Recibe todas las alarmas — suscripción email opcional vía `ALARM_EMAIL` |
| CloudWatch Alarm ×3 | `LambdaAlarmsConstruct` | Error rate (> 5%) + p99 (> 10 000 ms) + throttles (> 0) para Lambda ping |
| CloudWatch Dashboard | `ObservabilityDashboardConstruct` | Vista unificada: métricas de Lambda ping |

**Umbrales configurables** en `common/constants/infra.constants.ts`:

| Constante | Default |
|---|---|
| `LAMBDA_ALARM_ERROR_RATE_PERCENT` | `5` |
| `LAMBDA_ALARM_P99_DURATION_MS` | `10 000` |
| `LAMBDA_ALARM_QUEUE_AGE_SECONDS` | `300` |

