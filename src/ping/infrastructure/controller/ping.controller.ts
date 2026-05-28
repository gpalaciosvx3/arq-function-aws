import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGwHandlerEvent } from '../../../common/middleware/types/lambda-event.types';
import { PingUseCase } from '../../application/use-cases/ping.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class PingController {
  constructor(private readonly useCase: PingUseCase) {}

  @HandleExecution('Ping', ApiGwHelper.error)
  async handle(event: ApiGwHandlerEvent): Promise<APIGatewayProxyResult> {
    return ApiGwHelper.success(HttpStatus.OK, this.useCase.execute(event.parsed.body));
  }
}
