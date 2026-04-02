export interface JwtPayload {
  sub: string;
  username: string;
  profile: string;
  personId: string;
  fgp: string;
  iat?: number;
  exp?: number;
}
