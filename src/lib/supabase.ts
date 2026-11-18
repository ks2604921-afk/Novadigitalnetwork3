export type AuthUser = {
  id: string;
  phone: string;
  display_name?: string | null;
};

export type Session = {
  token: string;
  user: AuthUser;
};
