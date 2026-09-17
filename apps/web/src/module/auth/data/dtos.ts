export type UserRole =
  | "admin"
  | "front_desk"
  | "teacher"
  | "student"
  | "parent";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export type LogoutResponse = {
  ok: boolean;
};
