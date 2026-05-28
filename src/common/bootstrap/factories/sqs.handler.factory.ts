import middy from '@middy/core';
import { SQSBatchResponse } from 'aws-lambda';
import { parseSqsEventMiddleware } from '../../middleware/lambda-event.middleware';
import { SqsHandlerEvent } from '../../middleware/types/lambda-event.types';
import { SqsBatchController } from '../interfaces/lambda-controller.interfaces';
import { LambdaHandlerFactory } from './lambda-handler.factory';

export class SqsHandlerFactory extends LambdaHandlerFactory<
  SqsHandlerEvent,
  SQSBatchResponse,
  SqsBatchController
> {
  protected createHandler(getController: () => Promise<SqsBatchController>) {
    return middy<SqsHandlerEvent, SQSBatchResponse>(async (event) => {
      const results = await (await getController()).handle(event);
      return {
        batchItemFailures: results
          .filter((r) => r.retry)
          .map((r) => ({ itemIdentifier: r.sequenceNumber })),
      };
    }).use(parseSqsEventMiddleware<SQSBatchResponse>());
  }
}
