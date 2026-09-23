import { ApiGwHandlerFactory } from '@gpkit/aws-lambda/bootstrap/api-gw';
import { PingModule } from './ping.module';
import { EnvConstants } from '../../../common/constants/env.constants';
import { PingController } from '../controller/ping.controller';
import type { ApiGwHandlerEvent } from '@gpkit/aws-lambda/bootstrap/api-gw';
import type { APIGatewayProxyResult, Handler } from 'aws-lambda';

export const handler: Handler<ApiGwHandlerEvent, APIGatewayProxyResult> =
  new ApiGwHandlerFactory().build(PingModule, PingController, EnvConstants.REQUERIDAS_PING);
