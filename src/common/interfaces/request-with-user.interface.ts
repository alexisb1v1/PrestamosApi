import { Request } from 'express';
import { JwtPayload } from '@users/infrastructure/security/interfaces/jwt-payload.interface';

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
