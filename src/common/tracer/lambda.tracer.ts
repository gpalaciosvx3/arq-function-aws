import { powertoolsTracer } from '../config/aws.config';

class AppTracer {
  annotate(key: string, value: string | number | boolean): void {
    powertoolsTracer.putAnnotation(key, value);
  }

  async subsegment<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const sub = powertoolsTracer.getSegment()?.addNewSubsegment(`## ${name}`);
    try {
      return await fn();
    } finally {
      sub?.close();
    }
  }
}

export const appTracer = new AppTracer();
