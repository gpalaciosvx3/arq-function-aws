import 'reflect-metadata';
import { INestApplicationContext, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

export const createNestController = <TController>(Module: Type, Controller: Type<TController>) => {
  let app: INestApplicationContext | undefined;

  return async (): Promise<TController> => {
    if (!app) {
      app = await NestFactory.createApplicationContext(Module, { logger: false });
    }
    return app.get(Controller);
  };
};
