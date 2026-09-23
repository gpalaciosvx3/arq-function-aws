import { getLogger } from '@gpkit/core';
import { Injectable } from '@nestjs/common';
import { PingMapper } from '../mapper/ping.mapper';
import type { PingInput } from '../types/ping-input.types';
import type { PingOutput } from '../types/ping-output.types';

@Injectable()
export class PingService {
  pong(input: PingInput): PingOutput {
    getLogger().step(1, 'Generando respuesta pong', { echo: input.message });
    return PingMapper.toOutput(input, new Date());
  }
}
