// types/auth.ts

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: "password" | "google";
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  issuedAt: number;
}
