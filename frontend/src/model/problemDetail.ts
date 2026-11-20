// Error body returned by the backend (RFC 9457), e.g. for 404 Not Found.

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}
