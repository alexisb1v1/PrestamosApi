export interface JwtPayload {
  sub: string;
  username: string;
  profile: string;
  personId: string;
  companyId?: string;
  keyToken?: string;
  fgp: string;
  iat?: number;
  exp?: number;
}
