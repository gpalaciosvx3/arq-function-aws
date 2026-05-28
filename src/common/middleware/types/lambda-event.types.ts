import { APIGatewayProxyEventV2, SQSEvent, DynamoDBStreamEvent } from 'aws-lambda';

export type ApiGwExtracted = {
  source: 'api-gw';
  body: unknown;
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
  headers: Record<string, string>;
};

export type SqsMessage = {
  body: unknown;
  messageId: string;
  sequenceNumber: string;
};

export type SqsExtracted = {
  source: 'sqs';
  records: SqsMessage[];
};

export type DynamoStreamRecord = {
  sequenceNumber: string;
  newImage: Record<string, unknown>;
};

export type DynamoStreamExtracted = {
  source: 'dynamodb-stream';
  records: DynamoStreamRecord[];
};

export type LambdaExtracted = ApiGwExtracted | SqsExtracted | DynamoStreamExtracted;

export type ApiGwHandlerEvent = APIGatewayProxyEventV2 & { parsed: ApiGwExtracted };
export type SqsHandlerEvent = SQSEvent & { parsed: SqsExtracted };
export type DynamoStreamHandlerEvent = DynamoDBStreamEvent & { parsed: DynamoStreamExtracted };
