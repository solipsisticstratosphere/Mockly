import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid!, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }
  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    req.userId = (decoded as jwt.JwtPayload).sub;
    next();
  });
}
