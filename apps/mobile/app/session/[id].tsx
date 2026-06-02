import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoreBar } from '../../components/ui/ScoreBar';
import { scoreColor, scoreLabel } from '../../lib/score';

// Scripted mock questions for the prototype
const QUESTIONS: Record<string, any[]> = {
  react: [
    { text: 'Explain the difference between `useMemo` and `useCallback`. When would reaching for either actually hurt performance?', category: 'technical', concepts: ['memoization', 'referential equality', 'render cost'], minutes: 3 },
    { text: 'A list re-renders every keystroke in an unrelated input. Walk me through how you would diagnose and fix it.', category: 'technical', concepts: ['React.memo', 'context splitting', 'profiler'], minutes: 4 },
  ],
  javascript: [
    { text: 'Explain the event loop. How do microtasks and macrotasks differ in execution order?', category: 'technical', concepts: ['call stack', 'task queue', 'promises'], minutes: 3 },
    { text: 'What is a closure, and give a real bug a closure can cause inside a loop.', category: 'technical', concepts: ['scope', 'let vs var', 'captured variables'], minutes: 3 },
  ],
  behavioral: [
    { text: 'Tell me about a time you disagreed with a senior engineer. Use the STAR format.', category: 'behavioral', concepts: ['situation', 'task', 'action', 'result'], minutes: 3 },
  ],
  system_design: [
    { text: 'Design the URL-shortener. Walk me from the API surface down to how you guarantee uniqueness at scale.', category: 'system_design', concepts: ['hashing', 'collision', 'sharding', 'caching'], minutes: 5 },
  ],
};
function getQuestions(topic: string) {
  return QUESTIONS[topic] ?? QUESTIONS.react;
}

const FEEDBACKS = [
  { score: 7.6, score_structure: 8.0, score_technical: 7.5, score_clarity: 7.3, summary: 'Solid grasp of the core distinction and you correctly tied both hooks to referential stability. The example was concrete, but you skipped the cost of memoization itself.', strengths: ['Clearly separated value memoization from function memoization', 'Used a real dependency-array example'], weaknesses: ['Did not mention memoization has its own comparison cost', 'Missed when premature memoization hurts readability'], recommendation: 'Next time, name one case where adding useMemo makes things slower.' },
  { score: 5.4, score_structure: 5.0, score_technical: 6.2, score_clarity: 5.0, summary: 'You identified the right primitives but the answer wandered. There was a correct idea buried under restarts.', strengths: ['Named the correct underlying mechanism'], weaknesses: ['No clear opening statement', 'Trailed off without a concrete example'], recommendation: 'Lead with a one-sentence answer, then justify it.' },
  { score: 8.6, score_structure: 9.0, score_technical: 8.5, score_clarity: 8.3, summary: 'Excellent. Structured, technically precise, and you proactively addressed the edge case.', strengths: ['Opened with a crisp thesis', 'Volunteered a tradeoff without prompting'], weaknesses: ['Slightly long — could cut the second example'], recommendation: 'Keep this structure. To go further, quantify impact.' },
];

type Phase = 'answering' | 'analyzing' | 'feedback';

export default function InterviewScreen() {
  const router = useRouter();
  const { id, mode, topic, count } = useLocalSearchParams<{ id: string; mode: string; topic: string; count: string }>();
  const totalCount = Number(count ?? 8);
  const questions = Array.from({ length: totalCount }, (_, i) => {
    const pool = getQuestions(topic ?? 'react');
    return pool[i % pool.length];
  });

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('answering');
  const [seconds, setSeconds] = useState(0);
  const [scores, setScores] = useState<(number | null)[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const isVoice = mode === 'voice';
  const q = questions[index];
  const fb = FEEDBACKS[index % FEEDBACKS.length];

  useEffect(() => {
    const timerId = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: true }); }, [index, phase]);

  const submit = () => {
    setPhase('analyzing');
    setTimeout(() => setPhase('feedback'), 1700);
  };
  const skip = () => advance(null);
  const advance = (score: number | null) => {
    const next = score == null ? scores : [...scores, score];
    setScores(next);
    if (index + 1 >= totalCount) {
      const valid = next.filter(s => s != null) as number[];
      const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      router.replace({ pathname: '/session/result/[sessionId]', params: { sessionId: 'done', avg: avg.toFixed(2), scores: JSON.stringify(next), seconds: String(seconds), topic: topic ?? 'react', answered: String(valid.length) } });
    } else {
      setIndex(i => i + 1);
      setAnswer('');
      setPhase('answering');
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <View style={styles.outer}>
      {/* Navy session bar */}
      <View style={styles.sessionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="x" size={18} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.timerRow}>
          <Icon name="clock" size={15} color="rgba(255,255,255,0.7)" />
          <Text style={styles.timer}>{mm}:{ss}</Text>
        </View>
        <Text style={styles.progress}>{index + 1}/{totalCount}</Text>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: totalCount }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= index && styles.dotActive]} />
        ))}
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.categoryRow}>
          <Badge tone={q.category === 'behavioral' ? 'info' : q.category === 'system_design' ? 'amber' : 'success'}>
            {q.category === 'system_design' ? 'System Design' : q.category.charAt(0).toUpperCase() + q.category.slice(1)}
          </Badge>
          <Text style={styles.duration}>~{q.minutes} min</Text>
        </View>
        <Text style={styles.questionText}>{q.text}</Text>
        <View style={styles.concepts}>
          {q.concepts.map((c: string) => (
            <View key={c} style={styles.conceptTag}><Text style={styles.conceptText}>{c}</Text></View>
          ))}
        </View>

        {/* Inline feedback card */}
        {phase === 'feedback' && <FeedbackCard fb={fb} />}
      </ScrollView>

      {/* Bottom panel */}
      <View style={styles.bottom}>
        {phase === 'answering' && !isVoice && (
          <View style={styles.textAnswerWrap}>
            <TextInput
              value={answer} onChangeText={setAnswer}
              placeholder="Type your answer…" placeholderTextColor={Colors.n70}
              multiline style={styles.textarea}
            />
            <View style={styles.textBtns}>
              <Button variant="secondary" leadingIcon="skip" onPress={skip} style={{ flex: 0 }}>Skip</Button>
              <Button full leadingIcon="send" disabled={!answer.trim()} onPress={submit}>Submit Answer</Button>
            </View>
          </View>
        )}
        {phase === 'answering' && isVoice && (
          <VoicePanel onSkip={skip} onSubmit={submit} />
        )}
        {phase === 'analyzing' && (
          <View style={styles.analyzing}>
            <ActivityIndicator color={Colors.blue700} size="small" />
            <Text style={styles.analyzingText}>Analyzing your answer…</Text>
          </View>
        )}
        {phase === 'feedback' && (
          <Button full trailingIcon={index + 1 >= totalCount ? 'check' : 'arrowRight'} onPress={() => advance(fb.score)}>
            {index + 1 >= totalCount ? 'See Results' : 'Next Question'}
          </Button>
        )}
      </View>
    </View>
  );
}

function VoicePanel({ onSkip, onSubmit }: { onSkip: () => void; onSubmit: () => void }) {
  const [recording, setRecording] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!recording) return;
    const timerId = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(timerId);
  }, [recording]);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  return (
    <View style={vStyles.wrap}>
      {recording && (
        <View style={vStyles.recRow}>
          <View style={vStyles.recDot} />
          <Text style={vStyles.recTimer}>{mm}:{ss}</Text>
        </View>
      )}
      {!recording && t === 0 && <Text style={vStyles.hint}>Tap to record your spoken answer</Text>}
      <View style={vStyles.btns}>
        {(recording || t > 0) && <TouchableOpacity onPress={onSkip}><Text style={vStyles.skipText}>Skip</Text></TouchableOpacity>}
        <TouchableOpacity
          onPress={() => setRecording(r => !r)}
          style={[vStyles.micBtn, recording && vStyles.micBtnRecording]}
        >
          {recording
            ? <View style={vStyles.stopSquare} />
            : <Icon name="mic" size={26} color={Colors.white} />
          }
        </TouchableOpacity>
        {(t > 0 && !recording) && <TouchableOpacity onPress={onSubmit}><Text style={vStyles.submitText}>Submit</Text></TouchableOpacity>}
        {recording && <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const vStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 9, height: 9, borderRadius: 999, backgroundColor: Colors.red },
  recTimer: { fontFamily: Font.bold, fontSize: 15, color: Colors.n100 },
  hint: { fontFamily: Font.regular, fontSize: 13, color: Colors.n70 },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skipText: { fontFamily: Font.semiBold, fontSize: 14, color: Colors.n70 },
  micBtn: { width: 64, height: 64, borderRadius: 999, backgroundColor: Colors.blue800, alignItems: 'center', justifyContent: 'center' },
  micBtnRecording: { backgroundColor: Colors.red },
  stopSquare: { width: 22, height: 22, borderRadius: 5, backgroundColor: Colors.white },
  submitText: { fontFamily: Font.bold, fontSize: 14, color: Colors.blue700 },
});

function FeedbackCard({ fb }: { fb: typeof FEEDBACKS[0] }) {
  const col = scoreColor(fb.score);
  return (
    <View style={fbStyles.wrap}>
      <View style={fbStyles.header}>
        <Icon name="sparkle" size={16} color={Colors.blue700} fill />
        <Text style={fbStyles.headerText}>AI Feedback</Text>
        <View style={fbStyles.headerLine} />
      </View>
      <Card padding={16}>
        <View style={fbStyles.scoreRow}>
          <View style={[fbStyles.scoreTile, { backgroundColor: col + '22' }]}>
            <Text style={[fbStyles.scoreNum, { color: col }]}>{fb.score.toFixed(1)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[fbStyles.scoreLabel, { color: col }]}>{scoreLabel(fb.score)}</Text>
            <Text style={fbStyles.summary}>{fb.summary}</Text>
          </View>
        </View>
        <View style={fbStyles.bars}>
          <ScoreBar label="Structure" value={fb.score_structure} />
          <ScoreBar label="Technical" value={fb.score_technical} />
          <ScoreBar label="Clarity" value={fb.score_clarity} />
        </View>
        <FbList tone="success" title="Strengths" items={fb.strengths} />
        <FbList tone="amber" title="To improve" items={fb.weaknesses} />
        <View style={fbStyles.rec}>
          <Icon name="sparkle" size={16} color={Colors.blue700} fill />
          <Text style={fbStyles.recText}>{fb.recommendation}</Text>
        </View>
      </Card>
    </View>
  );
}

function FbList({ tone, title, items }: { tone: 'success' | 'amber'; title: string; items: string[] }) {
  const col = tone === 'success' ? Colors.green : Colors.amber;
  return (
    <View style={fbStyles.listWrap}>
      <Text style={fbStyles.listTitle}>{title}</Text>
      {items.map((it, i) => (
        <View key={i} style={fbStyles.listRow}>
          <View style={[fbStyles.listDot, { backgroundColor: col + '33' }]}>
            <Icon name={tone === 'success' ? 'check' : 'target'} size={11} color={col} strokeWidth={2.6} />
          </View>
          <Text style={fbStyles.listText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

const fbStyles = StyleSheet.create({
  wrap: { marginTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  headerText: { fontFamily: Font.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.66, color: Colors.n70 },
  headerLine: { flex: 1, height: 1, backgroundColor: Colors.n30 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  scoreTile: { width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scoreNum: { fontFamily: Font.extraBold, fontSize: 24 },
  scoreLabel: { fontFamily: Font.bold, fontSize: 15 },
  summary: { fontFamily: Font.regular, fontSize: 13, color: Colors.n70, marginTop: 2, lineHeight: 18 },
  bars: { gap: 10, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.n30, marginBottom: 4 },
  listWrap: { marginTop: 12 },
  listTitle: { fontFamily: Font.bold, fontSize: 13, color: Colors.n100, marginBottom: 7 },
  listRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginBottom: 7 },
  listDot: { width: 18, height: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  listText: { flex: 1, fontFamily: Font.regular, fontSize: 13.5, color: Colors.n100, lineHeight: 19 },
  rec: { flexDirection: 'row', gap: 9, marginTop: 12, padding: 12, backgroundColor: 'rgba(1,89,166,0.07)', borderRadius: 10, alignItems: 'flex-start' },
  recText: { flex: 1, fontFamily: Font.regular, fontSize: 13, color: Colors.n100, lineHeight: 19 },
});

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  sessionBar: { backgroundColor: Colors.blue800, paddingTop: 56, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timer: { fontFamily: Font.semiBold, fontSize: 14, color: Colors.white },
  progress: { fontFamily: Font.bold, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  dots: { backgroundColor: Colors.blue800, flexDirection: 'row', gap: 5, paddingHorizontal: 16, paddingBottom: 14 },
  dot: { flex: 1, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
  dotActive: { backgroundColor: '#5BC98A' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  duration: { fontFamily: Font.regular, fontSize: 12, color: Colors.n70 },
  questionText: { fontFamily: Font.bold, fontSize: 21, lineHeight: 29, color: Colors.n100 },
  concepts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  conceptTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.n20 },
  conceptText: { fontFamily: Font.semiBold, fontSize: 11.5, color: Colors.n70 },
  bottom: { borderTopWidth: 1, borderTopColor: Colors.n30, backgroundColor: Colors.white, padding: 14, gap: 10 },
  textAnswerWrap: { gap: 10 },
  textarea: { width: '100%', minHeight: 84, maxHeight: 120, borderWidth: 1, borderColor: Colors.n30, borderRadius: 10, padding: 11, fontFamily: Font.regular, fontSize: 15, lineHeight: 21, color: Colors.n100 },
  textBtns: { flexDirection: 'row', gap: 10 },
  analyzing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 84 },
  analyzingText: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.blue700 },
});
