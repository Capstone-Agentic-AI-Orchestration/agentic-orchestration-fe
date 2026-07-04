jest.mock('@/shared/auth/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

import { DevFlowApiError } from '@/shared/api/devflow-api';

describe('DevFlowApiError', () => {
  it('sets status from constructor input', () => {
    const err = new DevFlowApiError({ status: 404, kind: 'not_found', message: 'Not found' });
    expect(err.status).toBe(404);
  });

  it('sets kind from constructor input', () => {
    const err = new DevFlowApiError({ status: 403, kind: 'forbidden', message: 'Forbidden' });
    expect(err.kind).toBe('forbidden');
  });

  it('sets message from constructor input', () => {
    const err = new DevFlowApiError({ status: 500, kind: 'server', message: 'Internal server error' });
    expect(err.message).toBe('Internal server error');
  });

  it('sets name to "DevFlowApiError"', () => {
    const err = new DevFlowApiError({ status: 400, kind: 'validation', message: 'Bad input' });
    expect(err.name).toBe('DevFlowApiError');
  });

  it('extends Error', () => {
    const err = new DevFlowApiError({ status: 500, kind: 'server', message: 'Oops' });
    expect(err).toBeInstanceOf(Error);
  });

  it('sets details when provided', () => {
    const err = new DevFlowApiError({
      status: 422,
      kind: 'validation',
      message: 'Invalid fields',
      details: 'email must be a valid email',
    });
    expect(err.details).toBe('email must be a valid email');
  });

  it('defaults details to null when not provided', () => {
    const err = new DevFlowApiError({ status: 400, kind: 'validation', message: 'Bad request' });
    expect(err.details).toBeNull();
  });

  it('sets rawBody when provided', () => {
    const err = new DevFlowApiError({
      status: 500,
      kind: 'server',
      message: 'Server error',
      rawBody: '{"error":"internal"}',
    });
    expect(err.rawBody).toBe('{"error":"internal"}');
  });

  it('defaults rawBody to empty string when not provided', () => {
    const err = new DevFlowApiError({ status: 503, kind: 'network', message: 'Network error' });
    expect(err.rawBody).toBe('');
  });

  it('all error kinds are accepted without throwing', () => {
    const kinds = [
      'unauthenticated',
      'forbidden',
      'not_found',
      'validation',
      'server',
      'network',
      'unknown',
    ] as const;

    for (const kind of kinds) {
      expect(() => new DevFlowApiError({ status: 400, kind, message: 'test' })).not.toThrow();
    }
  });
});
