import { ApiGwHandlerFactory } from '@gpalacios/aws-lambda/bootstrap/api-gw';
import type { ApiGwHandlerEvent } from '@gpalacios/aws-lambda/bootstrap/api-gw';
import type { APIGatewayProxyResult, Handler } from 'aws-lambda';
import { EnvConstants } from '../../../common/constants/env.constants';
import { PingModule } from './ping.module';
import { PingController } from '../controller/ping.controller';

export const handler: Handler<ApiGwHandlerEvent, APIGatewayProxyResult> =
  new ApiGwHandlerFactory().build(PingModule, PingController, EnvConstants.REQUERIDAS_PING);
