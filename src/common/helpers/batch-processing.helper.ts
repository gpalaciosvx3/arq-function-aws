import { CustomException, ValidationException } from '../errors/custom.exception';
import { ProcessRecordResult } from '../types/process-record-result.types';
import { BatchProcessSummary, SequencedRecord } from '../types/batch-processing.types';

export async function executeChunkedBatch<TRecord extends SequencedRecord>(
  records: readonly TRecord[],
  chunkSize: number,
  executeOne: (record: TRecord) => Promise<void>,
  onRejected: (sequenceNumber: string, error: unknown) => ProcessRecordResult,
): Promise<ProcessRecordResult[]> {
  const results: ProcessRecordResult[] = [];

  for (const chunk of chunkRecords(records, chunkSize)) {
    const settled = await Promise.allSettled(chunk.map((record) => executeOne(record)));
    settled.forEach((outcome, index) => {
      const sequenceNumber = chunk[index].sequenceNumber;
      results.push(toProcessRecordResult(sequenceNumber, outcome, onRejected));
    });
  }

  return results;
}

export function classifyBatchFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
  if (error instanceof ValidationException) return { sequenceNumber, retry: false, error };
  if (error instanceof CustomException) return { sequenceNumber, retry: true, error };

  return { sequenceNumber, retry: true };
}

export function summarizeBatchResults(
  results: readonly ProcessRecordResult[],
): BatchProcessSummary {
  const success = results.filter((result) => !result.retry && !result.error).length;
  const discarded = results.filter((result) => !result.retry && result.error).length;
  const retryable = results.filter((result) => result.retry).length;

  return {
    total: results.length,
    success,
    discarded,
    retryable,
  };
}

function chunkRecords<T>(records: readonly T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize) as T[]);
  }
  return chunks;
}

function toProcessRecordResult<TRecord extends SequencedRecord>(
  sequenceNumber: string,
  outcome: PromiseSettledResult<void>,
  onRejected: (sequenceNumber: string, error: unknown) => ProcessRecordResult,
): ProcessRecordResult {
  if (outcome.status === 'fulfilled') return { sequenceNumber, retry: false };
  return onRejected(sequenceNumber, outcome.reason);
}
