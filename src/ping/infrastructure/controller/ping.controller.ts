import { ApiGwHelper } from '@gpalacios/aws-lambda/http';
import { HandleExecution } from '@gpalacios/core';
import { Injectable, HttpStatus } from '@nestjs/common';
import { PingUseCase } from '../../application/use-cases/ping.usecase';
import type { ApiGwController, ApiGwHandlerEvent } from '@gpalacios/aws-lambda/bootstrap/api-gw';
import type { APIGatewayProxyResult } from 'aws-lambda';

@Injectable()
export class PingController implements ApiGwController {
  constructor(private readonly useCase: PingUseCase) {}

  @HandleExecution('Ping', ApiGwHelper.error)
  async handle(event: ApiGwHandlerEvent): Promise<APIGatewayProxyResult> {
    return ApiGwHelper.success(HttpStatus.OK, this.useCase.execute(event.parsed.body));
  }
}
