import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Supabase publishes public keys at this endpoint — no secret needed in .env.
const jwks = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
});

export function verifyJwt(token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) =>
    jwt.verify(
      token,
      (h, cb) => jwks.getSigningKey(h.kid!, (e, k) => cb(e, k?.getPublicKey())),
      { algorithms: ['ES256', 'RS256'] },
      (e, d) => (e ? reject(e) : resolve(d as jwt.JwtPayload)),
    ),
  );
}
