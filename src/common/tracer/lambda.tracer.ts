import { Injectable } from '@nestjs/common';
import { Subsegment } from 'aws-xray-sdk-core';
import { powertoolsTracer } from '../config/aws.config';

@Injectable()
export class AppTracer {
  annotate(key: string, value: string): void {
    powertoolsTracer.putAnnotation(key, value);
  }

  async subsegment<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const segment = powertoolsTracer.getSegment();
    const sub: Subsegment | undefined = segment?.addNewSubsegment(name);
    try {
      const result = await fn();
      sub?.close();
      return result;
    } catch (error) {
      sub?.addError(error as Error);
      sub?.close();
      throw error;
    }
  }
}
