import { z } from 'zod';

export const PingRequestSchema = z.object({
  message: z.string().min(1),
});

export type PingRequest = z.infer<typeof PingRequestSchema>;
