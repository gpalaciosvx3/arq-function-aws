# arq-function-aws — CDK

La función Lambda y, cuando el trigger lo exige, su enganche a la infraestructura compartida. **No crea** API Gateway, rutas, colas, buses ni tablas: viven en el repo de IaC y se importan por su nombre estándar.

---

## Índice

- [Estructura](#estructura)
- [Qué despliega](#qué-despliega)
- [Requisitos](#requisitos)
- [Despliegue](#despliegue)
- [Probar la función](#probar-la-función)

---

## Estructura

```
infra/
  bin/
    ping.ts                               # Entry point — PingStack + ObservabilityStack opcional
  lib/
    stacks/
      ping.stack.ts                       # La función
      observability.stack.ts              # Alarmas y dashboard de la función
    ping-constructs/
      cloudwatch/
        lambda-log-group.construct.ts     # Log group con retención 1 semana
      iam/
        ping-role.construct.ts            # Role mínimo: BasicExecution + XRayDaemonWriteAccess
      lambda/
        shared/bundling.config.ts         # Configuración esbuild compartida
        ping/ping-fn.construct.ts         # Lambda ping: LogGroup + Role + NodejsFunction
    observability-constructs/
      sns/alarm-topic.construct.ts        # SNS topic + suscripción email opcional
      cloudwatch/
        lambda-alarms.construct.ts        # Error rate + p99 + throttles por Lambda
        observability-dashboard.construct.ts  # Dashboard de la función
  common/
    constants/
      naming.constants.ts                 # Nombres canónicos — el contrato con IaC
      resource.constants.ts               # Alias semánticos
      infra.constants.ts                  # Timeout, memoria, umbrales de alarmas
```

---

## Qué despliega

### PingStack

| Recurso | Construct | Nombre físico |
|---|---|---|
| Lambda `ping` | `PingFnConstruct` | `UE1ARQLMB001` |
| IAM Role | `PingRoleConstruct` | `UE1ARQROL001` |
| CloudWatch Log Group | `LambdaLogGroupConstruct` | `/aws/lambda/UE1ARQLMB001` |

No hay `lambda.Permission`: el HTTP API de IaC invoca la función con su propio rol (`credentials_arn`), apuntando al nombre `UE1ARQLMB001`.

### ObservabilityStack (opcional)

| Recurso | Construct | Descripción |
|---|---|---|
| SNS Topic | `AlarmTopicConstruct` | Recibe las alarmas — suscripción email opcional vía `ALARM_EMAIL` |
| CloudWatch Alarm ×3 | `LambdaAlarmsConstruct` | Error rate (> 5%) + p99 (> 10 000 ms) + throttles (> 0) |
| CloudWatch Dashboard | `ObservabilityDashboardConstruct` | Métricas de la función y de negocio |

Umbrales en `common/constants/infra.constants.ts`.

---

## Requisitos

- Node.js 20+
- En la cuenta: `cdk bootstrap` hecho una vez.

---

## Despliegue

En CI lo hace `aws-cdk-deploy` de `pt-ci-pipelines`. A mano:

```bash
cd infra && npm install
npx cdk diff
npx cdk deploy --all --require-approval never
```

---

## Probar la función

Sin pasar por el API, directo contra la función:

```bash
aws lambda invoke --function-name UE1ARQLMB001 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"version":"2.0","body":"{\"message\":\"hello\"}","headers":{},"requestContext":{"http":{"method":"POST"}}}' \
  out.json && cat out.json
```

Por el HTTP API compartido, una vez que IaC declara la ruta:

```bash
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/ping \
  -H 'Content-Type: application/json' \
  -d '{"message": "hello"}'
```
