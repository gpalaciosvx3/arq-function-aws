import { MiddyfiedHandler } from '@middy/core';
import { Type } from '@nestjs/common';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { requireEnvVarsMiddleware } from '../../middleware/env-validation.middleware';
import { createNestController } from '../nest-app.context';
import { powertoolsTracer, powertoolsLogger, powertoolsMetrics } from '../../config/aws.config';

export abstract class LambdaHandlerFactory<TEvent, TResult, TController> {
  build(
    Module: Type,
    Controller: Type<TController>,
    required: readonly string[],
  ): MiddyfiedHandler<TEvent, TResult> {
    const getController = createNestController(Module, Controller);
    const chain = this.createHandler(getController);
    chain.use(captureLambdaHandler(powertoolsTracer));
    chain.use(injectLambdaContext(powertoolsLogger));
    chain.use(logMetrics(powertoolsMetrics));
    chain.use(requireEnvVarsMiddleware<TEvent, TResult>(required));
    return chain;
  }

  protected abstract createHandler(
    getController: () => Promise<TController>,
  ): MiddyfiedHandler<TEvent, TResult>;
}
