import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { scoreColor, scoreLabel } from '../../lib/score';
import { useAuthStore } from '../../stores/authStore';

// Mock data matching the design — replace with React Query hooks once backend is wired
const MOCK_PROFILE = { name: 'Alex Rivera', initials: 'AR', level: 'Middle', role: 'Frontend', streak: 12, readiness: 74, readinessDelta: 6, avgScore: 7.4 };
const MOCK_SESSIONS = [
  { id: 's1', topic: 'React', mode: 'text', score: 7.8, questions: 8, date: 'Today · 9:14 AM' },
  { id: 's2', topic: 'System Design', mode: 'voice', score: 4.9, questions: 6, date: 'Yesterday · 7:40 PM' },
  { id: 's3', topic: 'Behavioral', mode: 'text', score: 6.2, questions: 5, date: 'Yesterday · 8:05 AM' },
];
const MOCK_TOPICS = [
  { key: 'react', name: 'React', score: 8.1, count: 42, icon: 'code' },
  { key: 'system_design', name: 'System Design', score: 4.8, count: 18, icon: 'target' },
];

const MODE_ICON = { text: 'message', voice: 'mic', rapid: 'zap' } as const;

function SessionRow({ session, onPress, last }: { session: typeof MOCK_SESSIONS[0]; onPress: () => void; last: boolean }) {
  const col = scoreColor(session.score);
  const icon = MODE_ICON[session.mode as keyof typeof MODE_ICON] ?? 'message';
  return (
    <TouchableOpacity onPress={onPress} style={[styles.sessionRow, !last && styles.sessionBorder]}>
      <View style={styles.sessionIcon}><Icon name={icon} size={18} color={Colors.blue800} /></View>
      <View style={styles.sessionMid}>
        <Text style={styles.sessionTopic}>{session.topic}</Text>
        <Text style={styles.sessionMeta}>{session.mode[0].toUpperCase() + session.mode.slice(1)} · {session.questions} Q · {session.date}</Text>
      </View>
      <View style={[styles.scorePill, { backgroundColor: col + '22' }]}>
        <Text style={[styles.scoreNum, { color: col }]}>{session.score.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const p = MOCK_PROFILE;
  const weakest = [...MOCK_TOPICS].sort((a, b) => a.score - b.score)[0];

  return (
    <ScrollView style={styles.outer} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Navy hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{p.initials}</Text></View>
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <Text style={styles.name}>{p.name}</Text>
            </View>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.streakPill}>
              <Icon name="flame" size={16} color="#FFB454" fill />
              <Text style={styles.streakNum}>{p.streak}</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn}>
              <Icon name="bell" size={17} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.readinessRow}>
          <ScoreRing
            value={p.readiness} max={100} size={120} stroke={11} color="#5BC98A"
            label={<Text style={styles.ringNum}>{p.readiness}</Text>}
            sub={<Text style={styles.ringSub}>READY</Text>}
          />
          <View style={styles.readinessMeta}>
            <Text style={styles.readinessCaption}>Interview readiness</Text>
            <Text style={styles.readinessDesc}>You're getting there for{'\n'}<Text style={styles.readinessHighlight}>{p.level} {p.role}</Text> roles.</Text>
            <View style={styles.deltaRow}>
              <Icon name="arrowUp" size={14} color="#7BE5A5" />
              <Text style={styles.deltaText}>+{p.readinessDelta} this week</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Start CTA — overlaps hero */}
      <View style={styles.ctaWrap}>
        <Card padding={16} style={styles.ctaCard}>
          <View style={styles.ctaTop}>
            <View style={styles.ctaIcon}><Icon name="sparkle" size={22} color={Colors.blue700} fill /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Start a mock interview</Text>
              <Text style={styles.ctaSub}>AI picks questions for your level</Text>
            </View>
          </View>
          <View style={{ marginTop: 14 }}>
            <TouchableOpacity style={styles.beginBtn} onPress={() => router.push('/session/setup')}>
              <Icon name="play" size={18} color={Colors.white} />
              <Text style={styles.beginBtnText}>Begin Session</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* Today's focus */}
      <SectionHeader>Today's focus</SectionHeader>
      <View style={styles.section}>
        <Card padding={0} onPress={() => router.push('/(tabs)/analytics')}>
          <View style={styles.focusRow}>
            <View style={[styles.focusIcon, { backgroundColor: 'rgba(201,130,27,0.12)' }]}>
              <Icon name={weakest.icon as any} size={21} color={Colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.focusTopRow}>
                <Text style={styles.focusName}>{weakest.name}</Text>
                <Badge tone="amber">Weakest</Badge>
              </View>
              <Text style={styles.focusSub}>Avg {weakest.score.toFixed(1)} across {weakest.count} questions — drill this next</Text>
            </View>
            <Icon name="chevR" size={18} color={Colors.n70} />
          </View>
        </Card>
      </View>

      {/* Recent sessions */}
      <SectionHeader
        action={
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        }
      >
        Recent sessions
      </SectionHeader>
      <View style={styles.section}>
        <View style={styles.sessionList}>
          {MOCK_SESSIONS.map((s, i) => (
            <SessionRow key={s.id} session={s} last={i === MOCK_SESSIONS.length - 1} onPress={() => {}} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  content: { paddingBottom: 32 },
  hero: { backgroundColor: Colors.blue800, paddingTop: 56, paddingBottom: 56, paddingHorizontal: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 38, height: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.bold, fontSize: 14, color: Colors.white },
  greeting: { fontFamily: Font.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 16 },
  name: { fontFamily: Font.bold, fontSize: 16, color: Colors.white, marginTop: 2 },
  heroRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  streakNum: { fontFamily: Font.bold, fontSize: 14, color: Colors.white },
  bellBtn: { width: 34, height: 34, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringNum: { fontFamily: Font.extraBold, fontSize: 34, color: Colors.white, lineHeight: 36 },
  ringSub: { fontFamily: Font.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginTop: 3 },
  readinessMeta: { flex: 1 },
  readinessCaption: { fontFamily: Font.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },
  readinessDesc: { fontFamily: Font.bold, fontSize: 17, color: Colors.white, lineHeight: 24, marginTop: 6 },
  readinessHighlight: { color: '#9FD5FF' },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  deltaText: { fontFamily: Font.bold, fontSize: 13, color: '#7BE5A5' },
  ctaWrap: { paddingHorizontal: 16, marginTop: -36 },
  ctaCard: { shadowColor: '#1F2C37', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  ctaTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaIcon: { width: 44, height: 44, borderRadius: 11, backgroundColor: 'rgba(1,89,166,0.10)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ctaTitle: { fontFamily: Font.bold, fontSize: 15, color: Colors.n100 },
  ctaSub: { fontFamily: Font.regular, fontSize: 12.5, color: Colors.n70, marginTop: 2 },
  beginBtn: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.blue800, borderRadius: 8 },
  beginBtnText: { fontFamily: Font.semiBold, fontSize: 16, color: Colors.white },
  section: { marginHorizontal: 16 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  focusIcon: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  focusTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 },
  focusName: { fontFamily: Font.bold, fontSize: 15, color: Colors.n100 },
  focusSub: { fontFamily: Font.regular, fontSize: 12.5, color: Colors.n70, lineHeight: 17 },
  seeAll: { fontFamily: Font.semiBold, fontSize: 13, color: Colors.blue700 },
  sessionList: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.n30, overflow: 'hidden' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 14 },
  sessionBorder: { borderBottomWidth: 1, borderBottomColor: Colors.n30 },
  sessionIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: Colors.n20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sessionMid: { flex: 1, minWidth: 0 },
  sessionTopic: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.n100 },
  sessionMeta: { fontFamily: Font.regular, fontSize: 12.5, color: Colors.n70, marginTop: 2 },
  scorePill: { minWidth: 44, height: 30, paddingHorizontal: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontFamily: Font.extraBold, fontSize: 15 },
});
