export interface SequencedRecord {
  sequenceNumber: string;
}

export interface BatchProcessSummary {
  total: number;
  success: number;
  discarded: number;
  retryable: number;
}
