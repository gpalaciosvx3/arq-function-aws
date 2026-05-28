import { Module } from '@nestjs/common';
import { AppLogger } from '../../../common/logger/lambda.logger';
import { AppTracer } from '../../../common/tracer/lambda.tracer';
import { AppMetrics } from '../../../common/metrics/lambda.metrics';
import { PingService } from '../../domain/service/ping.service';
import { PingUseCase } from '../../application/use-cases/ping.usecase';
import { PingController } from '../controller/ping.controller';

@Module({
  providers: [
    { provide: AppLogger,  useFactory: () => new AppLogger()  },
    { provide: AppTracer,  useFactory: () => new AppTracer()  },
    { provide: AppMetrics, useFactory: () => new AppMetrics() },
    {
      provide: PingService,
      useFactory: (logger: AppLogger, tracer: AppTracer, metrics: AppMetrics) =>
        new PingService(logger, tracer, metrics),
      inject: [AppLogger, AppTracer, AppMetrics],
    },
    {
      provide: PingUseCase,
      useFactory: (svc: PingService) => new PingUseCase(svc),
      inject: [PingService],
    },
    {
      provide: PingController,
      useFactory: (uc: PingUseCase) => new PingController(uc),
      inject: [PingUseCase],
    },
  ],
})
export class PingModule {}
