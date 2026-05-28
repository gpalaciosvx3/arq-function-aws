import { EnvConstants } from '../constants/env.constants';

export const envConfig = {
  awsRegion: process.env[EnvConstants.AWS_REGION] ?? 'us-east-1',
};
