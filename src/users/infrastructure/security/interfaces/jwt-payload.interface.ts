export interface JwtPayload {
  sub: string;
  username: string;
  profile: string;
  personId: string;
  iat?: number;
  exp?: number;
}
