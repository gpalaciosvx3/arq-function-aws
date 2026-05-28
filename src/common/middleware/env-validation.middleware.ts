import { MiddlewareObj } from '@middy/core';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';

export const requireEnvVarsMiddleware = <TEvent, TResult>(
  required: readonly string[],
): MiddlewareObj<TEvent, TResult> => ({
  before: () => {
    const faltante = required.find((nombre) => !process.env[nombre]);
    if (faltante) throw new CustomException(ErrorDictionary.ENV_VAR_MISSING, faltante);
  },
});
