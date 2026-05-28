import middy from '@middy/core';
import { DynamoDBBatchResponse } from 'aws-lambda';
import { parseDynamoStreamEventMiddleware } from '../../middleware/lambda-event.middleware';
import { DynamoStreamHandlerEvent } from '../../middleware/types/lambda-event.types';
import { DynamoStreamBatchController } from '../interfaces/lambda-controller.interfaces';
import { LambdaHandlerFactory } from './lambda-handler.factory';

export class DynamoStreamHandlerFactory extends LambdaHandlerFactory<
  DynamoStreamHandlerEvent,
  DynamoDBBatchResponse,
  DynamoStreamBatchController
> {
  protected createHandler(getController: () => Promise<DynamoStreamBatchController>) {
    return middy<DynamoStreamHandlerEvent, DynamoDBBatchResponse>(async (event) => {
      const results = await (await getController()).handle(event);
      return {
        batchItemFailures: results
          .filter((r) => r.retry)
          .map((r) => ({ itemIdentifier: r.sequenceNumber })),
      };
    }).use(parseDynamoStreamEventMiddleware<DynamoDBBatchResponse>());
  }
}
