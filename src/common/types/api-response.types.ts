import { ZodIssue } from 'zod';

export interface ApiSuccessBody<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  code: string;
  description: string;
}

export interface ApiValidationErrorBody extends ApiErrorBody {
  issues: ZodIssue[];
}
