import { CustomException } from '../errors/custom.exception';

export interface ProcessRecordResult {
  sequenceNumber: string;
  retry: boolean;
  error?: CustomException;
}
