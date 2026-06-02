import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { SubmitAnswerSchema, EditAnswerSchema } from '@mockly/shared';
import { supabase } from '../lib/supabase';
import { analyzeFeedback } from '../services/groq.service';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

router.post('/', authMiddleware, validate(SubmitAnswerSchema), async (req: any, res) => {
  const { session_id, question_id, text } = req.body;
  const { data: question } = await supabase.from('questions').select('text, category').eq('id', question_id).single();
  if (!question) { res.status(404).json({ error: 'Question not found' }); return; }

  const { data: session } = await supabase.from('sessions').select('level').eq('id', session_id).single();

  const feedback = await analyzeFeedback(question.text, text, session?.level ?? 'junior', question.category);

  const { data: answer, error } = await supabase.from('answers').insert({
    session_id, question_id, user_id: req.userId, text,
    score: feedback.score, score_structure: feedback.score_structure,
    score_technical: feedback.score_technical, score_clarity: feedback.score_clarity,
    feedback_summary: feedback.feedback_summary,
    feedback_strengths: feedback.feedback_strengths,
    feedback_weaknesses: feedback.feedback_weaknesses,
    ai_recommendation: feedback.ai_recommendation,
  }).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }

  res.json({ answer, feedback });
});

router.post('/voice', authMiddleware, upload.single('audio'), async (req: any, res) => {
  if (!req.file) { res.status(400).json({ error: 'Audio file required' }); return; }
  const { session_id, question_id } = req.body;

  const { transcribeAudio } = await import('../services/groq.service');
  const transcript = await transcribeAudio(req.file.buffer, req.file.originalname ?? 'audio.m4a');

  const { data: question } = await supabase.from('questions').select('text, category').eq('id', question_id).single();
  const { data: session } = await supabase.from('sessions').select('level').eq('id', session_id).single();
  const feedback = await analyzeFeedback(question!.text, transcript, session?.level ?? 'junior', question!.category);

  const { data: answer, error } = await supabase.from('answers').insert({
    session_id, question_id, user_id: req.userId, text: transcript, transcript,
    score: feedback.score, score_structure: feedback.score_structure,
    score_technical: feedback.score_technical, score_clarity: feedback.score_clarity,
    feedback_summary: feedback.feedback_summary,
    feedback_strengths: feedback.feedback_strengths,
    feedback_weaknesses: feedback.feedback_weaknesses,
    ai_recommendation: feedback.ai_recommendation,
  }).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }

  res.json({ answer, feedback, transcript });
});

router.put('/:id', authMiddleware, validate(EditAnswerSchema), async (req: any, res) => {
  const { data, error } = await supabase.from('answers').update({ text: req.body.text }).eq('id', req.params.id).eq('user_id', req.userId).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ answer: data });
});

router.post('/:id/skip', authMiddleware, async (req: any, res) => {
  const { data, error } = await supabase.from('answers').update({ skipped: true }).eq('id', req.params.id).eq('user_id', req.userId).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ answer: data });
});

export default router;
