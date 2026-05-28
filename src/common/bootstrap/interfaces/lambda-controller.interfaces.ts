import { APIGatewayProxyResult } from 'aws-lambda';
import {
  ApiGwHandlerEvent,
  SqsHandlerEvent,
  DynamoStreamHandlerEvent,
} from '../../middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../types/process-record-result.types';

export interface ApiGwController<TEvent extends ApiGwHandlerEvent = ApiGwHandlerEvent> {
  handle(event: TEvent): Promise<APIGatewayProxyResult>;
}

export interface SqsBatchController {
  handle(event: SqsHandlerEvent): Promise<ProcessRecordResult[]>;
}

export interface DynamoStreamBatchController {
  handle(event: DynamoStreamHandlerEvent): Promise<ProcessRecordResult[]>;
}
