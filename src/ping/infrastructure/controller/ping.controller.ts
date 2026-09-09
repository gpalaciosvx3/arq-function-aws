import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { HandleExecution } from '@gpalacios/core';
import { ApiGwHelper } from '@gpalacios/aws-lambda/http';
import type { ApiGwController, ApiGwHandlerEvent } from '@gpalacios/aws-lambda/bootstrap/api-gw';
import { PingUseCase } from '../../application/use-cases/ping.usecase';

@Injectable()
export class PingController implements ApiGwController {
  constructor(private readonly useCase: PingUseCase) {}

  @HandleExecution('Ping', ApiGwHelper.error)
  async handle(event: ApiGwHandlerEvent): Promise<APIGatewayProxyResult> {
    return ApiGwHelper.success(HttpStatus.OK, this.useCase.execute(event.parsed.body));
  }
}
