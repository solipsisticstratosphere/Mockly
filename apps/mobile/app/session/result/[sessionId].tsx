import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Font } from '../../../constants/typography';
import { Icon } from '../../../components/ui/Icon';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ScoreRing } from '../../../components/ui/ScoreRing';
import { scoreColor, scoreLabel } from '../../../utils/score';
import { useTheme } from '../../../lib/theme';

const TOPIC_LABELS: Record<string, string> = {
  react: 'React',
  javascript: 'JavaScript',
  react_native: 'React Native',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  mixed: 'Mixed',
};

export default function ResultScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    avg,
    scores: scoresRaw,
    seconds,
    topic,
    answered,
    delta: deltaRaw,
  } = useLocalSearchParams<{
    avg: string;
    scores: string;
    seconds: string;
    topic: string;
    answered: string;
    delta: string;
  }>();

  const avgScore = parseFloat(avg ?? '0');
  const scores: (number | null)[] = (() => {
    try {
      return JSON.parse(scoresRaw ?? '[]');
    } catch {
      return [];
    }
  })();
  const totalSecs = Number(seconds ?? 0);
  const mm = Math.floor(totalSecs / 60);
  const topicName = TOPIC_LABELS[topic ?? ''] ?? 'Mixed';
  const delta = parseFloat(deltaRaw ?? '0') || +((avgScore / 10) * 2 + 0.4).toFixed(1);

  return (
    <View style={[styles.outer, { backgroundColor: theme.bg }]}>
      {/* Navy header — same in both modes */}
      <View style={styles.header}>
        <Text style={styles.headerCaption}>Session complete</Text>
        <ScoreRing
          value={avgScore}
          max={10}
          size={148}
          stroke={13}
          color={avgScore >= 7.5 ? '#5BC98A' : avgScore >= 5 ? '#E6B450' : '#E88888'}
          label={<Text style={styles.ringNum}>{avgScore.toFixed(1)}</Text>}
          sub={<Text style={styles.ringSub}>out of 10</Text>}
        />
        <Text style={styles.headerLabel}>{scoreLabel(avgScore)} session</Text>
        <Text style={styles.headerMeta}>
          {topicName} · {answered} answered · {mm} min
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Readiness delta */}
        <Card
          padding={16}
          style={[
            styles.deltaCard,
            { backgroundColor: theme.greenSoft, borderColor: 'transparent' },
          ]}
        >
          <View style={styles.deltaRow}>
            <View style={[styles.deltaIcon, { backgroundColor: theme.surface }]}>
              <Icon name="trend" size={22} color={theme.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deltaTitle, { color: theme.fg }]}>Readiness +{delta}</Text>
              <Text style={[styles.deltaSub, { color: theme.fgMuted }]}>
                Keep your streak going 🔥
              </Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.breakdownLabel, { color: theme.fgMuted }]}>PER QUESTION</Text>
        <View
          style={[
            styles.breakdownList,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {scores.map((s, i) => {
            const c = s != null ? scoreColor(s) : theme.fgMuted;
            return (
              <View
                key={i}
                style={[
                  styles.breakdownRow,
                  i < scores.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.qNum, { backgroundColor: theme.elevated }]}>
                  <Text style={[styles.qNumText, { color: theme.fgMuted }]}>{i + 1}</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.elevated }]}>
                  {s != null && (
                    <View
                      style={[styles.barFill, { width: `${s * 10}%` as any, backgroundColor: c }]}
                    />
                  )}
                </View>
                <Text style={[styles.qScore, { color: c }]}>
                  {s == null ? 'Skip' : s.toFixed(1)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}
      >
        <Button full size="lg" onPress={() => router.replace('/(tabs)')}>
          Done
        </Button>
        <Button
          full
          variant="ghost"
          leadingIcon="refresh"
          onPress={() => router.replace('/session/setup')}
        >
          Practice again
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  header: {
    backgroundColor: '#1B448B',
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerCaption: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.72,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  ringNum: { fontFamily: Font.extraBold, fontSize: 46, color: '#FFFFFF', lineHeight: 48 },
  ringSub: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerLabel: { fontFamily: Font.bold, fontSize: 22, color: '#FFFFFF', marginTop: 14 },
  headerMeta: {
    fontFamily: Font.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  deltaCard: { marginBottom: 14 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  deltaIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deltaTitle: { fontFamily: Font.bold, fontSize: 15 },
  deltaSub: { fontFamily: Font.regular, fontSize: 12.5, marginTop: 1 },
  breakdownLabel: {
    fontFamily: Font.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.66,
    marginBottom: 10,
    marginTop: 6,
  },
  breakdownList: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  qNum: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qNumText: { fontFamily: Font.bold, fontSize: 12 },
  barTrack: { flex: 1, height: 7, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  qScore: { fontFamily: Font.bold, fontSize: 14, minWidth: 30, textAlign: 'right' },
  footer: { padding: 16, borderTopWidth: 1, gap: 10 },
});
