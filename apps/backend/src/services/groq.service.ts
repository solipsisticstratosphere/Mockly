import { groq, GROQ_MODELS, GROQ_DEFAULTS } from '../lib/groq';
import type { UserRole, DifficultyLevel, TopicKey, QuestionCategory, AnswerFeedback } from '@mockly/shared';

// ─── Helpers ──────────────────────────────────────────────────

function parseGroqJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── Question Generation ───────────────────────────────────────

const QUESTION_SYSTEM = `You are a senior technical interviewer at a top-tier tech company.
Generate exactly one interview question. Return ONLY valid JSON, no markdown, no extra text.

Response format:
{
  "text": "<the question>",
  "category": "technical|behavioral|system_design",
  "estimated_answer_minutes": <1-5>,
  "key_concepts": ["concept1", "concept2"]
}`;

export async function generateQuestion(params: {
  role: UserRole;
  level: DifficultyLevel;
  topic: TopicKey;
  previousTopics?: string[];
  lastScore?: number;
}): Promise<{ text: string; category: QuestionCategory; estimated_answer_minutes: number; key_concepts: string[] }> {
  const difficulty =
    params.lastScore === undefined ? 'appropriate' :
    params.lastScore < 4 ? 'simpler' :
    params.lastScore > 7 ? 'harder' : 'similar difficulty';

  const userMsg = `Generate a ${difficulty} ${params.level} ${params.role} developer interview question about ${params.topic}.
Previously asked topics to avoid: ${(params.previousTopics ?? []).join(', ') || 'none'}.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODELS.question,
    messages: [{ role: 'system', content: QUESTION_SYSTEM }, { role: 'user', content: userMsg }],
    ...GROQ_DEFAULTS.question,
  });

  return parseGroqJson(completion.choices[0].message.content ?? '{}');
}

// ─── Answer Feedback ───────────────────────────────────────────

const FEEDBACK_SYSTEM = `You are an expert technical interviewer evaluating a candidate's answer.
Score and return ONLY valid JSON, no markdown, no text outside the JSON.

Response format:
{
  "score": <0.0-10.0>,
  "score_structure": <0.0-10.0>,
  "score_technical": <0.0-10.0>,
  "score_clarity": <0.0-10.0>,
  "feedback_summary": "<2-3 sentences>",
  "feedback_strengths": ["<point>"],
  "feedback_weaknesses": ["<point>"],
  "ai_recommendation": "<one actionable improvement>"
}

Scoring: structure 20%, technical 50%, clarity 30%. Weighted average = score.
For behavioral questions: check STAR format (Situation/Task/Action/Result). Penalize missing components in score_structure.`;

export async function analyzeFeedback(
  question: string,
  answer: string,
  level: DifficultyLevel,
  category: QuestionCategory
): Promise<AnswerFeedback> {
  const categoryNote = category === 'behavioral'
    ? '\nBehavioral question — enforce STAR format strictly in score_structure.'
    : '';

  const completion = await groq.chat.completions.create({
    model: GROQ_MODELS.feedback,
    messages: [
      { role: 'system', content: FEEDBACK_SYSTEM + categoryNote },
      { role: 'user', content: `Question: ${question}\n\nCandidate Answer: ${answer}\n\nEvaluate for ${level} developer position.` },
    ],
    ...GROQ_DEFAULTS.feedback,
  });

  return parseGroqJson<AnswerFeedback>(completion.choices[0].message.content ?? '{}');
}

// ─── Streaming feedback ────────────────────────────────────────

export async function* streamFeedback(question: string, answer: string, level: DifficultyLevel, category: QuestionCategory) {
  const categoryNote = category === 'behavioral' ? '\nBehavioral — enforce STAR format.' : '';
  const stream = await groq.chat.completions.create({
    model: GROQ_MODELS.feedback,
    messages: [
      { role: 'system', content: FEEDBACK_SYSTEM + categoryNote },
      { role: 'user', content: `Question: ${question}\n\nAnswer: ${answer}\n\nEvaluate for ${level} developer.` },
    ],
    stream: true,
    ...GROQ_DEFAULTS.feedback,
  });

  let full = '';
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? '';
    full += token;
    yield { type: 'TOKEN' as const, payload: token };
  }
  const parsed = parseGroqJson<AnswerFeedback>(full);
  yield { type: 'DONE' as const, payload: parsed };
}

// ─── Voice (Whisper) ───────────────────────────────────────────

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const file = new File([audioBuffer], filename, { type: 'audio/m4a' });
  const result = await groq.audio.transcriptions.create({
    file,
    model: GROQ_MODELS.whisper,
    response_format: 'text',
  });
  return result as unknown as string;
}
