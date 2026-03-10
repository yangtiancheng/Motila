export type JwtUser = {
  sub: string;
  email: string;
  role: 'ADMIN' | 'USER';
  roles?: string[];
  permissions?: string[];
  modules?: string[];
};
