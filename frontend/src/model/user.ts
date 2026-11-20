// Mirrors backend DTOs: LoginRequest, UserResponse.

/** Body of POST /api/users/login (mock login: no password). */
export interface LoginRequest {
  username: string;
  email: string;
}

/** A learner. The email (trimmed, lower-cased) identifies them; the username is a display name. */
export interface User {
  id: number;
  username: string;
  email: string;
}
