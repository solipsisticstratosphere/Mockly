import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import { logger } from './config/logger';
import { verifyJwt } from './config/jwks';
import { streamFeedback } from './services/groq.service';
import { supabase } from './config/supabase';

const PORT = Number(process.env.PORT ?? 3000);
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws, req) => {
  const token = req.headers.authorization?.split(' ')[1] ?? new URL(req.url ?? '', 'ws://x').searchParams.get('token');
  if (!token) { ws.close(1008, 'Unauthorized'); return; }

  try {
    const decoded = await verifyJwt(token);
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
