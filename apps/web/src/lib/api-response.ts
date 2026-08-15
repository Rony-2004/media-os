const SERVER_UNAVAILABLE_MESSAGE = 'The server is temporarily unavailable. Please try again.';

export async function readApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  if (!contentType.includes('application/json')) {
    throw new Error(SERVER_UNAVAILABLE_MESSAGE);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(SERVER_UNAVAILABLE_MESSAGE);
  }
}
