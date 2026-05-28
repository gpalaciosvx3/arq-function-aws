import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { envConfig } from './env.config';

export const dynamoDbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: envConfig.awsRegion }),
  { marshallOptions: { convertClassInstanceToMap: true, removeUndefinedValues: true } },
);
export const sqsClient = new SQSClient({ region: envConfig.awsRegion });

export const powertoolsTracer = new Tracer();
export const powertoolsLogger = new Logger();
export const powertoolsMetrics = new Metrics();
