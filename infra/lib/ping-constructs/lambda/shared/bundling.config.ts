import * as path from 'path';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';

export const repoRoot = path.join(__dirname, '../../../../../');

export const lambdaBundling: BundlingOptions = {
  preCompilation: false,
  externalModules: [
    'class-transformer',
    'class-validator',
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
    '@nestjs/platform-express',
  ],
  minify: false,
  sourceMap: false,
  target: 'node20',
  tsconfig: path.join(__dirname, '../../../../../tsconfig.lambda.json'),
};
