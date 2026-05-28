import { ApiGwHandlerFactory } from '../../../common/bootstrap';
import { EnvConstants } from '../../../common/constants/env.constants';
import { PingModule } from './ping.module';
import { PingController } from '../controller/ping.controller';

export const handler = new ApiGwHandlerFactory()
  .build(PingModule, PingController, EnvConstants.REQUERIDAS_PING);
