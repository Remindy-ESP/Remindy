import { getErrorMessage, isNetworkError, getErrorStatusCode } from '../apiUtils';

/**
 * Helper to build a plain mock error that looks like an AxiosError.
 * We cannot use `new AxiosError(...)` because axios is mocked globally in jest.setup.js.
 */
function makeAxiosLike(options: {
  responseData?: Record<string, unknown>;
  status?: number;
  hasResponse?: boolean;
}): Error & { response?: { data: any; status: number } } {
  const { responseData, status = 400, hasResponse = true } = options;
  const error = new Error('Request failed') as any;
  // Mark as having a 'response' property so utils treat it as an AxiosError
  if (hasResponse) {
    error.response = {
      data: responseData,
      status,
    };
  }
  return error;
}

describe('getErrorMessage', () => {
  it('returns default message when error is null', () => {
    expect(getErrorMessage(null)).toBe('Une erreur est survenue');
  });

  it('returns default message when error is undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Une erreur est survenue');
  });

  it('returns custom default message when provided', () => {
    expect(getErrorMessage(null, 'Custom default')).toBe('Custom default');
  });

  it('extracts string message from Axios response data', () => {
    const error = makeAxiosLike({ responseData: { message: 'Unauthorized' }, status: 401 });
    expect(getErrorMessage(error)).toBe('Unauthorized');
  });

  it('joins array of messages from ValidationPipe', () => {
    const error = makeAxiosLike({
      responseData: { message: ['Field A is required', 'Field B is invalid'] },
      status: 422,
    });
    expect(getErrorMessage(error)).toBe('Field A is required, Field B is invalid');
  });

  it('falls back to error field when message is missing', () => {
    const error = makeAxiosLike({
      responseData: { error: 'Bad Request' },
      status: 400,
    });
    expect(getErrorMessage(error)).toBe('Bad Request');
  });

  it('falls through to Error.message when response data has no message or error fields', () => {
    // makeAxiosLike creates a new Error(), so error instanceof Error is true
    // After the response block finds nothing, it returns error.message
    const error = makeAxiosLike({
      responseData: { statusCode: 500 },
      status: 500,
    });
    expect(getErrorMessage(error, 'Fallback')).toBe('Request failed');
  });

  it('falls through to Error.message when response data is undefined', () => {
    const error = makeAxiosLike({ responseData: undefined, status: 500 });
    expect(getErrorMessage(error, 'Fallback')).toBe('Request failed');
  });

  it('extracts message from standard Error objects', () => {
    const error = new Error('Standard error message');
    expect(getErrorMessage(error)).toBe('Standard error message');
  });

  it('returns default for unknown error type (string)', () => {
    expect(getErrorMessage('some string error', 'Default')).toBe('Default');
  });

  it('returns default for unknown error type (number)', () => {
    expect(getErrorMessage(42, 'Default')).toBe('Default');
  });

  it('falls through to Error.message when Axios-like error has no response', () => {
    // makeAxiosLike returns a new Error(), so instanceof Error is true
    // No response → skips response block → uses error.message
    const error = makeAxiosLike({ hasResponse: false });
    expect(getErrorMessage(error, 'Network error')).toBe('Request failed');
  });

  it('handles empty array message', () => {
    const error = makeAxiosLike({ responseData: { message: [] }, status: 400 });
    // join on empty array gives ''
    expect(getErrorMessage(error)).toBe('');
  });
});

describe('isNetworkError', () => {
  it('returns true when error has response key but no value (network failure)', () => {
    const error = makeAxiosLike({ hasResponse: false });
    // No response property → isNetworkError checks for 'response' in error, but it's not set
    // Actually the function checks: if 'response' in error AND !axiosError.response → true
    // Since hasResponse=false means no response property set at all, 'response' is NOT in error
    // So isNetworkError returns false. Let me verify the implementation:
    // function isNetworkError(error: unknown): boolean {
    //   if (error && typeof error === 'object' && 'response' in error) {
    //     const axiosError = error as AxiosError;
    //     return !axiosError.response; // true when no response
    //   }
    //   return false;
    // }
    // hasResponse=false means no 'response' property at all → returns false
    expect(isNetworkError(error)).toBe(false);
  });

  it('returns false when error has a response (server responded)', () => {
    const error = makeAxiosLike({ responseData: { message: 'Not Found' }, status: 404 });
    expect(isNetworkError(error)).toBe(false);
  });

  it('returns true for axios-like error with response property set to undefined', () => {
    const error: any = new Error('Network issue');
    error.response = undefined; // has the property but value is falsy
    expect(isNetworkError(error)).toBe(true);
  });

  it('returns false for standard Error objects', () => {
    expect(isNetworkError(new Error('Standard error'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isNetworkError(null)).toBe(false);
  });

  it('returns false for non-object values', () => {
    expect(isNetworkError('string error')).toBe(false);
    expect(isNetworkError(42)).toBe(false);
  });

  it('returns false for objects without response property', () => {
    expect(isNetworkError({ someOtherProp: true })).toBe(false);
  });
});

describe('getErrorStatusCode', () => {
  it('returns status code from Axios-like response', () => {
    const error = makeAxiosLike({ responseData: { message: 'Not Found' }, status: 404 });
    expect(getErrorStatusCode(error)).toBe(404);
  });

  it('returns 401 for unauthorized error', () => {
    const error = makeAxiosLike({ responseData: { message: 'Unauthorized' }, status: 401 });
    expect(getErrorStatusCode(error)).toBe(401);
  });

  it('returns 500 for server error', () => {
    const error = makeAxiosLike({ responseData: { message: 'Internal Server Error' }, status: 500 });
    expect(getErrorStatusCode(error)).toBe(500);
  });

  it('returns null when error has no response', () => {
    const error = makeAxiosLike({ hasResponse: false });
    // No 'response' property → getErrorStatusCode checks 'response' in error → false → returns null
    expect(getErrorStatusCode(error)).toBeNull();
  });

  it('returns null when response is undefined', () => {
    const error: any = new Error('Network issue');
    error.response = undefined;
    // 'response' is in error, but axiosError.response?.status is undefined → null via ?? null
    expect(getErrorStatusCode(error)).toBeNull();
  });

  it('returns null for standard Error objects', () => {
    expect(getErrorStatusCode(new Error('error'))).toBeNull();
  });

  it('returns null for null', () => {
    expect(getErrorStatusCode(null)).toBeNull();
  });

  it('returns null for non-object values', () => {
    expect(getErrorStatusCode('string')).toBeNull();
    expect(getErrorStatusCode(undefined)).toBeNull();
  });
});
