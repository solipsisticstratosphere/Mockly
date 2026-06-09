import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoreBar } from '../../components/ui/ScoreBar';
import { scoreColor, scoreLabel } from '../../utils/score';
import { useQueryClient } from '@tanstack/react-query';
// TODO: switch back to expo-av once dev build is set up (expo-av requires native rebuild, not in Expo Go)
import { useAudioRecorder, useAudioRecorderState, requestRecordingPermissionsAsync, setAudioModeAsync, RecordingPresets } from 'expo-audio';
import * as Speech from 'expo-speech';
import { apiPost, apiPatch, apiPostFormData } from '../../lib/api';
import { useTheme } from '../../lib/theme';
import { useSessionStore } from '../../stores/sessionStore';
import type { Question, AnswerFeedback, SessionMode, TopicKey } from '@mockly/shared';

type Phase = 'answering' | 'analyzing' | 'feedback';

export default function InterviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { id: sessionId, mode, topic, count, firstQuestion: firstQuestionRaw } = useLocalSearchParams<{
    id: string; mode: string; topic: string; count: string; firstQuestion: string;
  }>();
  const totalCount = Number(count ?? 8);

  const {
    currentQuestion, setCurrentQuestion: storeSetQuestion,
    questionIndex, timerSeconds, tickTimer,
    setSession, resetSession, activeSessionId,
  } = useSessionStore();

  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('answering');
  const [scores, setScores] = useState<(number | null)[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedToBank, setSavedToBank] = useState(false);
  const [isSavingToBank, setIsSavingToBank] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isVoice = mode === 'voice';

  useEffect(() => {
    if (activeSessionId !== sessionId) {
      const parsed = (() => { try { return JSON.parse(firstQuestionRaw ?? '{}'); } catch { return null; } })();
      setSession(sessionId!, mode as SessionMode, topic as TopicKey, totalCount);
      if (parsed?.id) storeSetQuestion(parsed);
    }
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: true }); }, [questionIndex, phase]);

  useEffect(() => {
    if (!isVoice || !currentQuestion || phase !== 'answering') return;
    Speech.speak(currentQuestion.text, { language: 'en-US' });
    return () => { Speech.stop(); };
  }, [currentQuestion?.id, isVoice, phase]);

  async function submitAnswer() {
    if (!currentQuestion || !sessionId) return;
    setIsSubmitting(true);
    setPhase('analyzing');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await apiPost<{ answer: { id: string }; feedback: AnswerFeedback }>(
        '/api/answers',
        { session_id: sessionId, question_id: currentQuestion.id, text: answer },
        controller.signal,
      );
      setFeedback(res.feedback);
      setPhase('feedback');
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        Alert.alert('Timeout', 'Request took too long. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to submit answer. Please try again.');
      }
      setPhase('answering');
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  }

  async function advance(score: number | null) {
    const nextScores = score == null ? scores : [...scores, score];
    setScores(nextScores);

    const isLast = questionIndex >= totalCount;
    if (isLast) {
      await endSession(nextScores);
      return;
    }

    try {
      const res = await apiPost<{ question: Question }>('/api/questions/next', {
        session_id: sessionId,
        ...(score != null ? { previous_answer_score: score } : {}),
      });
      storeSetQuestion(res.question);
      setAnswer('');
      setFeedback(null);
      setPhase('answering');
      setSavedToBank(false);
      setIsSavingToBank(false);
    } catch {
      Alert.alert('Error', 'Failed to load next question.');
    }
  }

  async function endSession(finalScores: (number | null)[]) {
    try {
      const res = await apiPatch<{ session: { readiness_delta: number | null; total_score: number | null } }>(
        `/api/sessions/${sessionId}/end`,
        { duration_seconds: timerSeconds }
      );
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      const valid = finalScores.filter(s => s != null) as number[];
      const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : (res.session.total_score ?? 0);
      resetSession();
      router.replace({
        pathname: '/session/result/[sessionId]',
        params: {
          sessionId: sessionId ?? 'done',
          avg: avg.toFixed(2),
          scores: JSON.stringify(finalScores),
          seconds: String(timerSeconds),
          topic: topic ?? 'react',
          answered: String(valid.length),
          delta: String(res.session.readiness_delta ?? 0),
        },
      });
    } catch {
      const valid = finalScores.filter(s => s != null) as number[];
      const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      resetSession();
      router.replace({
        pathname: '/session/result/[sessionId]',
        params: {
          sessionId: sessionId ?? 'done',
          avg: avg.toFixed(2),
          scores: JSON.stringify(finalScores),
          seconds: String(timerSeconds),
          topic: topic ?? 'react',
          answered: String(valid.length),
          delta: '0',
        },
      });
    }
  }

  function skip() { advance(null); }

  async function toggleBank() {
    if (!currentQuestion || isSavingToBank) return;
    setIsSavingToBank(true);
    try {
      const res = await apiPatch<{ is_template: boolean }>(`/api/questions/${currentQuestion.id}/save-to-bank`);
      setSavedToBank(res.is_template);
    } catch {
      Alert.alert('Error', 'Could not update question. Please try again.');
    } finally {
      setIsSavingToBank(false);
    }
  }

  if (!currentQuestion) {
    return (
      <View style={[styles.outer, { backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.blue700} size="large" />
      </View>
    );
  }

  const q = currentQuestion;
  const mm = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const ss = String(timerSeconds % 60).padStart(2, '0');

  return (
    <View style={[styles.outer, { backgroundColor: theme.bg }]}>
      {/* Navy session bar — same in both modes */}
      <View style={styles.sessionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="x" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.timerRow}>
          <Icon name="clock" size={15} color="rgba(255,255,255,0.7)" />
          <Text style={styles.timer}>{mm}:{ss}</Text>
        </View>
        <Text style={styles.progress}>{questionIndex}/{totalCount}</Text>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: totalCount }).map((_, i) => (
          <View key={i} style={[styles.dot, i < questionIndex && styles.dotActive]} />
        ))}
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.categoryRow}>
          <Badge tone={q.category === 'behavioral' ? 'info' : q.category === 'system_design' ? 'amber' : 'success'}>
            {q.category === 'system_design' ? 'System Design' : q.category.charAt(0).toUpperCase() + q.category.slice(1)}
          </Badge>
          {q.estimated_answer_minutes && (
            <Text style={[styles.duration, { color: theme.fgMuted }]}>~{q.estimated_answer_minutes} min</Text>
          )}
        </View>
        <Text style={[styles.questionText, { color: theme.fg }]}>{q.text}</Text>
        {(q.key_concepts ?? []).length > 0 && (
          <View style={styles.concepts}>
            {(q.key_concepts ?? []).map((c: string) => (
              <View key={c} style={[styles.conceptTag, { backgroundColor: theme.elevated }]}>
                <Text style={[styles.conceptText, { color: theme.fgMuted }]}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {phase === 'feedback' && feedback && <FeedbackCard fb={feedback} />}
      </ScrollView>

      <View style={[styles.bottom, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
        {phase === 'answering' && !isVoice && (
          <View style={styles.textAnswerWrap}>
            <TextInput
              value={answer} onChangeText={setAnswer}
              placeholder="Type your answer…" placeholderTextColor={theme.fgMuted}
              multiline
              style={[styles.textarea, { borderColor: theme.border, backgroundColor: theme.elevated, color: theme.fg }]}
            />
            <View style={styles.textBtns}>
              <Button variant="secondary" leadingIcon="skip" onPress={skip} style={{ flex: 0 }}>Skip</Button>
              <Button leadingIcon="send" disabled={!answer.trim()} onPress={submitAnswer} style={{ flex: 1 }}>Submit Answer</Button>
            </View>
          </View>
        )}
        {phase === 'answering' && isVoice && (
          <VoicePanel onSkip={skip} sessionId={sessionId ?? ''} questionId={q.id} onFeedback={(fb) => { setFeedback(fb); setPhase('feedback'); }} />
        )}
        {phase === 'analyzing' && (
          <View style={styles.analyzing}>
            <ActivityIndicator color={theme.blue700} size="small" />
            <Text style={[styles.analyzingText, { color: theme.blue700 }]}>Analyzing your answer…</Text>
          </View>
        )}
        {phase === 'feedback' && feedback && (
          <>
            <TouchableOpacity
              onPress={toggleBank}
              disabled={isSavingToBank}
              style={[bkStyles.btn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              {isSavingToBank
                ? <ActivityIndicator size="small" color={theme.blue700} />
                : <Icon name={savedToBank ? 'bookmarkFilled' : 'bookmark'} size={18} color={savedToBank ? theme.blue700 : theme.fgMuted} />
              }
              <Text style={[bkStyles.label, { color: savedToBank ? theme.blue700 : theme.fgMuted }]}>
                {savedToBank ? 'Saved to Bank' : 'Save to Question Bank'}
              </Text>
            </TouchableOpacity>
            <Button full trailingIcon={questionIndex >= totalCount ? 'check' : 'arrowRight'} onPress={() => advance(feedback.score)}>
              {questionIndex >= totalCount ? 'See Results' : 'Next Question'}
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

function VoicePanel({ onSkip, sessionId, questionId, onFeedback }: {
  onSkip: () => void;
  sessionId: string;
  questionId: string;
  onFeedback: (fb: AnswerFeedback) => void;
}) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { isRecording } = useAudioRecorderState(recorder);
  const [t, setT] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const uriRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    const timerId = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(timerId);
  }, [isRecording]);

  async function startRecording() {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Microphone access is required to record your answer. Please enable it in Settings.');
      return;
    }
    Speech.stop();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setT(0);
  }

  async function stopRecording(): Promise<string | null> {
    await recorder.stop();
    const uri = recorder.uri ?? null;
    uriRef.current = uri;
    await setAudioModeAsync({ allowsRecording: false });
    return uri;
  }

  async function handleMicPress() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function handleSkip() {
    if (isRecording) await stopRecording().catch(() => {});
    onSkip();
  }

  async function handleSubmit() {
    if (submitting) return;
    const uri = isRecording ? await stopRecording() : uriRef.current;
    if (!uri) {
      Alert.alert('No recording', 'Please record your answer before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('audio', { uri, name: 'answer.m4a', type: 'audio/m4a' } as any);
      formData.append('session_id', sessionId);
      formData.append('question_id', questionId);
      const result = await apiPostFormData<{ feedback: AnswerFeedback; transcript: string }>(
        '/api/answers/voice', formData,
      );
      onFeedback(result.feedback);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  return (
    <View style={vStyles.wrap}>
      {isRecording && (
        <View style={vStyles.recRow}>
          <View style={[vStyles.recDot, { backgroundColor: theme.red }]} />
          <Text style={[vStyles.recTimer, { color: theme.fg }]}>{mm}:{ss}</Text>
        </View>
      )}
      {!isRecording && t === 0 && <Text style={[vStyles.hint, { color: theme.fgMuted }]}>Tap to record your spoken answer</Text>}
      <View style={vStyles.btns}>
        {(isRecording || t > 0) && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[vStyles.skipText, { color: theme.fgMuted }]}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleMicPress}
          style={[vStyles.micBtn, isRecording && { backgroundColor: theme.red }]}
        >
          {isRecording
            ? <View style={vStyles.stopSquare} />
            : <Icon name="mic" size={26} color="#FFFFFF" />
          }
        </TouchableOpacity>
        {(t > 0 && !isRecording) && (
          <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator size="small" color={theme.blue700} />
              : <Text style={[vStyles.submitText, { color: theme.blue700 }]}>Submit</Text>
            }
          </TouchableOpacity>
        )}
        {isRecording && <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const vStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 9, height: 9, borderRadius: 999 },
  recTimer: { fontFamily: Font.bold, fontSize: 15 },
  hint: { fontFamily: Font.regular, fontSize: 13 },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skipText: { fontFamily: Font.semiBold, fontSize: 14 },
  micBtn: { width: 64, height: 64, borderRadius: 999, backgroundColor: '#1B448B', alignItems: 'center', justifyContent: 'center' },
  stopSquare: { width: 22, height: 22, borderRadius: 5, backgroundColor: '#FFFFFF' },
  submitText: { fontFamily: Font.bold, fontSize: 14 },
});

function FeedbackCard({ fb }: { fb: AnswerFeedback }) {
  const theme = useTheme();
  const col = scoreColor(fb.score);
  return (
    <View style={fbStyles.wrap}>
      <View style={fbStyles.header}>
        <Icon name="sparkle" size={16} color={theme.blue700} fill />
        <Text style={[fbStyles.headerText, { color: theme.fgMuted }]}>AI Feedback</Text>
        <View style={[fbStyles.headerLine, { backgroundColor: theme.border }]} />
      </View>
      <Card padding={16}>
        <View style={fbStyles.scoreRow}>
          <View style={[fbStyles.scoreTile, { backgroundColor: col + '22' }]}>
            <Text style={[fbStyles.scoreNum, { color: col }]}>{fb.score.toFixed(1)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[fbStyles.scoreLabel, { color: col }]}>{scoreLabel(fb.score)}</Text>
            <Text style={[fbStyles.summary, { color: theme.fgMuted }]}>{fb.feedback_summary}</Text>
          </View>
        </View>
        <View style={[fbStyles.bars, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
          <ScoreBar label="Structure" value={fb.score_structure} />
          <ScoreBar label="Technical" value={fb.score_technical} />
          <ScoreBar label="Clarity" value={fb.score_clarity} />
        </View>
        {fb.feedback_strengths.length > 0 && <FbList tone="success" title="Strengths" items={fb.feedback_strengths} />}
        {fb.feedback_weaknesses.length > 0 && <FbList tone="amber" title="To improve" items={fb.feedback_weaknesses} />}
        {fb.ai_recommendation && (
          <View style={[fbStyles.rec, { backgroundColor: theme.accentSoft }]}>
            <Icon name="sparkle" size={16} color={theme.blue700} fill />
            <Text style={[fbStyles.recText, { color: theme.fg }]}>{fb.ai_recommendation}</Text>
          </View>
        )}
      </Card>
    </View>
  );
}

function FbList({ tone, title, items }: { tone: 'success' | 'amber'; title: string; items: string[] }) {
  const theme = useTheme();
  const col = tone === 'success' ? theme.green : theme.amber;
  return (
    <View style={fbStyles.listWrap}>
      <Text style={[fbStyles.listTitle, { color: theme.fg }]}>{title}</Text>
      {items.map((it, i) => (
        <View key={i} style={fbStyles.listRow}>
          <View style={[fbStyles.listDot, { backgroundColor: col + '33' }]}>
            <Icon name={tone === 'success' ? 'check' : 'target'} size={11} color={col} strokeWidth={2.6} />
          </View>
          <Text style={[fbStyles.listText, { color: theme.fg }]}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

const fbStyles = StyleSheet.create({
  wrap: { marginTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  headerText: { fontFamily: Font.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.66 },
  headerLine: { flex: 1, height: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  scoreTile: { width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scoreNum: { fontFamily: Font.extraBold, fontSize: 24 },
  scoreLabel: { fontFamily: Font.bold, fontSize: 15 },
  summary: { fontFamily: Font.regular, fontSize: 13, marginTop: 2, lineHeight: 18 },
  bars: { gap: 10, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 4 },
  listWrap: { marginTop: 12 },
  listTitle: { fontFamily: Font.bold, fontSize: 13, marginBottom: 7 },
  listRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginBottom: 7 },
  listDot: { width: 18, height: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  listText: { flex: 1, fontFamily: Font.regular, fontSize: 13.5, lineHeight: 19 },
  rec: { flexDirection: 'row', gap: 9, marginTop: 12, padding: 12, borderRadius: 10, alignItems: 'flex-start' },
  recText: { flex: 1, fontFamily: Font.regular, fontSize: 13, lineHeight: 19 },
});

const styles = StyleSheet.create({
  outer: { flex: 1 },
  sessionBar: { backgroundColor: '#1B448B', paddingTop: 56, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timer: { fontFamily: Font.semiBold, fontSize: 14, color: '#FFFFFF' },
  progress: { fontFamily: Font.bold, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  dots: { backgroundColor: '#1B448B', flexDirection: 'row', gap: 5, paddingHorizontal: 16, paddingBottom: 14 },
  dot: { flex: 1, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
  dotActive: { backgroundColor: '#5BC98A' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  duration: { fontFamily: Font.regular, fontSize: 12 },
  questionText: { fontFamily: Font.bold, fontSize: 21, lineHeight: 29 },
  concepts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  conceptTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  conceptText: { fontFamily: Font.semiBold, fontSize: 11.5 },
  bottom: { borderTopWidth: 1, padding: 14, gap: 10 },
  textAnswerWrap: { gap: 10 },
  textarea: { width: '100%', minHeight: 84, maxHeight: 120, borderWidth: 1, borderRadius: 10, padding: 11, fontFamily: Font.regular, fontSize: 15, lineHeight: 21 },
  textBtns: { flexDirection: 'row', gap: 10 },
  analyzing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 84 },
  analyzingText: { fontFamily: Font.semiBold, fontSize: 15 },
});

const bkStyles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 8, borderWidth: 1.5, width: '100%' },
  label: { fontFamily: Font.semiBold, fontSize: 14 },
});
