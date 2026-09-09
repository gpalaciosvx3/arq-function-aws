import { Module } from '@nestjs/common';
import { PingUseCase } from '../../application/use-cases/ping.usecase';
import { PingService } from '../../domain/service/ping.service';
import { PingController } from '../controller/ping.controller';

@Module({
  providers: [
    { provide: PingService, useFactory: () => new PingService() },
    {
      provide: PingUseCase,
      useFactory: (service: PingService) => new PingUseCase(service),
      inject: [PingService],
    },
    {
      provide: PingController,
      useFactory: (useCase: PingUseCase) => new PingController(useCase),
      inject: [PingUseCase],
    },
  ],
})
export class PingModule {}
