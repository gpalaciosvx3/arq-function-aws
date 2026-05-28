import middy, { MiddlewareObj } from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';
import { parseApiGwEventMiddleware } from '../../middleware/lambda-event.middleware';
import { ApiGwHandlerEvent } from '../../middleware/types/lambda-event.types';
import { ApiGwController } from '../interfaces/lambda-controller.interfaces';
import { LambdaHandlerFactory } from './lambda-handler.factory';

export class ApiGwHandlerFactory<
  TEvent extends ApiGwHandlerEvent = ApiGwHandlerEvent,
> extends LambdaHandlerFactory<TEvent, APIGatewayProxyResult, ApiGwController<TEvent>> {
  protected createHandler(getController: () => Promise<ApiGwController<TEvent>>) {
    return middy<TEvent, APIGatewayProxyResult>(async (event) => {
      return (await getController()).handle(event);
    }).use(
      parseApiGwEventMiddleware<APIGatewayProxyResult>() as MiddlewareObj<
        TEvent,
        APIGatewayProxyResult
      >,
    );
  }
}
