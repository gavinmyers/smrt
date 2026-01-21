import type { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  sid?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface ErrorWithSentinel extends Error {
  sentinel?: string;
}
