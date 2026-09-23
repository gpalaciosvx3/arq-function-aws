import { PingConstants } from '../constants/ping.constants';
import type { PingInput } from '../types/ping-input.types';
import type { PingOutput } from '../types/ping-output.types';

export class PingMapper {
  static toOutput(input: PingInput, receivedAt: Date): PingOutput {
    return {
      message: PingConstants.PONG_MESSAGE,
      echo: input.message,
      receivedAt: receivedAt.toISOString(),
    };
  }
}
