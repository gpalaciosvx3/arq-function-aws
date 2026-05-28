import { appLogger } from '../logger/lambda.logger';

export function HandleExecution(
  featureName: string,
  onError?: (error: unknown) => unknown,
): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const start = Date.now();
      appLogger.start(featureName);
      try {
        const result = await original.apply(this, args);
        appLogger.end(featureName, Date.now() - start, true);
        return result;
      } catch (error) {
        appLogger.end(featureName, Date.now() - start, false);
        if (onError) return onError(error);
        throw error;
      }
    };

    return descriptor;
  };
}
