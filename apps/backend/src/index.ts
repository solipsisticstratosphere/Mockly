import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import app from './app';
import { logger } from './lib/logger';
import { streamFeedback } from './services/groq.service';
import { supabase } from './lib/supabase';

const PORT = Number(process.env.PORT ?? 3000);
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

const jwks = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
});

wss.on('connection', async (ws, req) => {
  const token = req.headers.authorization?.split(' ')[1] ?? new URL(req.url ?? '', 'ws://x').searchParams.get('token');
  if (!token) { ws.close(1008, 'Unauthorized'); return; }

  try {
    const decoded = await new Promise<any>((res, rej) =>
      jwt.verify(token, (h, cb) => jwks.getSigningKey(h.kid!, (e, k) => cb(e, k?.getPublicKey())), { algorithms: ['RS256'] }, (e, d) => e ? rej(e) : res(d))
    );
    const userId = decoded.sub as string;

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type !== 'STREAM_FEEDBACK') return;

        const { session_id, question_id, answer_text } = msg.payload;
        const { data: question } = await supabase.from('questions').select('text, category').eq('id', question_id).single();
        const { data: session } = await supabase.from('sessions').select('level').eq('id', session_id).single();

        for await (const event of streamFeedback(question!.text, answer_text, session?.level ?? 'junior', question!.category)) {
          ws.send(JSON.stringify(event));
        }
      } catch (e: any) {
        ws.send(JSON.stringify({ type: 'ERROR', payload: { message: e.message ?? 'Unknown error' } }));
      }
    });
  } catch {
    ws.close(1008, 'Invalid token');
  }
});

server.listen(PORT, () => logger.info(`Mockly backend running on port ${PORT}`));
