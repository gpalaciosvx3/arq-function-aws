import { Module } from '@nestjs/common';
import { AppLogger } from '../../../common/logger/lambda.logger';
import { PingService } from '../../domain/service/ping.service';
import { PingUseCase } from '../../application/use-cases/ping.usecase';
import { PingController } from '../controller/ping.controller';

@Module({
  providers: [
    { provide: AppLogger,  useFactory: () => new AppLogger()  },
    {
      provide: PingService,
      useFactory: (logger: AppLogger) => new PingService(logger),
      inject: [AppLogger],
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
