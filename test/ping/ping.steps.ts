import { ValidationException } from '@gpkit/core';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { PingUseCase } from '../../src/ping/application/use-cases/ping.usecase';
import { PingService } from '../../src/ping/domain/service/ping.service';
import type { PingOutput } from '../../src/ping/domain/types/ping-output.types';

const feature = loadFeature('./test/ping/features/ping.feature');

defineFeature(feature, (test) => {
  let useCase: PingUseCase;
  let rawInput: unknown;
  let result: PingOutput;
  let caughtError: unknown;

  beforeEach(() => {
    useCase = new PingUseCase(new PingService());
    caughtError = undefined;
  });

  test('Retorna pong con el mensaje recibido', ({ given, when, then, and }) => {
    given(/^un mensaje de entrada "(.*)"$/, (mensaje: string) => {
      rawInput = { message: mensaje };
    });

    when('se ejecuta el use case', () => {
      result = useCase.execute(rawInput);
    });

    then(/^la respuesta contiene message "(.*)"$/, (esperado: string) => {
      expect(result.message).toBe(esperado);
    });

    and(/^la respuesta contiene echo "(.*)"$/, (esperado: string) => {
      expect(result.echo).toBe(esperado);
    });

    and('la respuesta contiene receivedAt con formato ISO', () => {
      expect(new Date(result.receivedAt).toISOString()).toBe(result.receivedAt);
    });
  });

  test('Falla con mensaje vacío', ({ given, when, then }) => {
    given(/^un mensaje de entrada "(.*)"$/, (mensaje: string) => {
      rawInput = { message: mensaje };
    });

    when('se ejecuta el use case', () => {
      try {
        useCase.execute(rawInput);
      } catch (e) {
        caughtError = e;
      }
    });

    then('se lanza una ValidationException', () => {
      expect(caughtError).toBeInstanceOf(ValidationException);
    });
  });
});
