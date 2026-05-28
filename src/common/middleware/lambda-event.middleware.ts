import { MiddlewareObj } from '@middy/core';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import {
  ApiGwExtracted,
  SqsExtracted,
  DynamoStreamExtracted,
  ApiGwHandlerEvent,
  SqsHandlerEvent,
  DynamoStreamHandlerEvent,
} from './types/lambda-event.types';

export const parseApiGwEventMiddleware = <TResult>(): MiddlewareObj<
  ApiGwHandlerEvent,
  TResult
> => ({
  before: (request) => {
    const e = request.event;
    request.event.parsed = {
      source: 'api-gw',
      body: JSON.parse(e.body ?? '{}'),
      pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
      queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
      headers: normalizeHeaders(e.headers),
    } satisfies ApiGwExtracted;
  },
});

export const parseSqsEventMiddleware = <TResult>(): MiddlewareObj<SqsHandlerEvent, TResult> => ({
  before: (request) => {
    const e = request.event;
    request.event.parsed = {
      source: 'sqs',
      records: e.Records.map((r) => ({
        body: JSON.parse(r.body),
        messageId: r.messageId,
        sequenceNumber: r.messageId,
      })),
    } satisfies SqsExtracted;
  },
});

export const parseDynamoStreamEventMiddleware = <TResult>(): MiddlewareObj<
  DynamoStreamHandlerEvent,
  TResult
> => ({
  before: (request) => {
    const e = request.event;
    request.event.parsed = {
      source: 'dynamodb-stream',
      records: e.Records.filter((r) => r.eventName === 'INSERT' && r.dynamodb?.NewImage).map(
        (r) => ({
          sequenceNumber: r.dynamodb!.SequenceNumber!,
          newImage: unmarshall(r.dynamodb!.NewImage! as Record<string, AttributeValue>),
        }),
      ),
    } satisfies DynamoStreamExtracted;
  },
});

function normalizeHeaders(headers: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k.toLowerCase(), v as string]),
  );
}
