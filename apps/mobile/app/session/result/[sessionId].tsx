import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Font } from '../../../constants/typography';
import { Icon } from '../../../components/ui/Icon';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ScoreRing } from '../../../components/ui/ScoreRing';
import { scoreColor, scoreLabel } from '../../../lib/score';

const TOPIC_LABELS: Record<string, string> = {
  react: 'React', javascript: 'JavaScript', react_native: 'React Native',
  system_design: 'System Design', behavioral: 'Behavioral', mixed: 'Mixed',
};

export default function ResultScreen() {
  const router = useRouter();
  const { avg, scores: scoresRaw, seconds, topic, answered } = useLocalSearchParams<{
    avg: string; scores: string; seconds: string; topic: string; answered: string;
  }>();

  const avgScore = parseFloat(avg ?? '0');
  const scores: (number | null)[] = JSON.parse(scoresRaw ?? '[]');
  const totalSecs = Number(seconds ?? 0);
  const mm = Math.floor(totalSecs / 60);
  const col = scoreColor(avgScore);
  const topicName = TOPIC_LABELS[topic ?? ''] ?? 'Mixed';
  const delta = +(avgScore / 10 * 2 + 0.4).toFixed(1);

  return (
    <View style={styles.outer}>
      {/* Navy header */}
      <View style={styles.header}>
        <Text style={styles.headerCaption}>Session complete</Text>
        <ScoreRing
          value={avgScore} max={10} size={148} stroke={13}
          color={avgScore >= 7.5 ? '#5BC98A' : avgScore >= 5 ? '#E6B450' : '#E88888'}
          label={<Text style={styles.ringNum}>{avgScore.toFixed(1)}</Text>}
          sub={<Text style={styles.ringSub}>out of 10</Text>}
        />
        <Text style={styles.headerLabel}>{scoreLabel(avgScore)} session</Text>
        <Text style={styles.headerMeta}>{topicName} · {answered} answered · {mm} min</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Readiness delta */}
        <Card padding={16} style={styles.deltaCard}>
          <View style={styles.deltaRow}>
            <View style={styles.deltaIcon}><Icon name="trend" size={22} color={Colors.green} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deltaTitle}>Readiness +{delta}</Text>
              <Text style={styles.deltaSub}>Keep your streak going 🔥</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.breakdownLabel}>PER QUESTION</Text>
        <View style={styles.breakdownList}>
          {scores.map((s, i) => {
            const c = s != null ? scoreColor(s) : Colors.n70;
            return (
              <View key={i} style={[styles.breakdownRow, i < scores.length - 1 && styles.breakdownBorder]}>
                <View style={styles.qNum}><Text style={styles.qNumText}>{i + 1}</Text></View>
                <View style={styles.barTrack}>
                  {s != null && <View style={[styles.barFill, { width: `${s * 10}%` as any, backgroundColor: c }]} />}
                </View>
                <Text style={[styles.qScore, { color: c }]}>
                  {s == null ? 'Skip' : s.toFixed(1)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button full size="lg" onPress={() => router.replace('/(tabs)')}>Done</Button>
        <Button full variant="ghost" leadingIcon="refresh" onPress={() => router.replace('/session/setup')}>
          Practice again
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  header: { backgroundColor: Colors.blue800, paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center' },
  headerCaption: { fontFamily: Font.semiBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.72, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  ringNum: { fontFamily: Font.extraBold, fontSize: 46, color: Colors.white, lineHeight: 48 },
  ringSub: { fontFamily: Font.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerLabel: { fontFamily: Font.bold, fontSize: 22, color: Colors.white, marginTop: 14 },
  headerMeta: { fontFamily: Font.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  deltaCard: { backgroundColor: Colors.greenSoft, borderColor: 'transparent', marginBottom: 14 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  deltaIcon: { width: 44, height: 44, borderRadius: 11, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  deltaTitle: { fontFamily: Font.bold, fontSize: 15, color: Colors.n100 },
  deltaSub: { fontFamily: Font.regular, fontSize: 12.5, color: Colors.n70, marginTop: 1 },
  breakdownLabel: { fontFamily: Font.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.66, color: Colors.n70, marginBottom: 10, marginTop: 6 },
  breakdownList: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.n30, overflow: 'hidden' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  breakdownBorder: { borderBottomWidth: 1, borderBottomColor: Colors.n30 },
  qNum: { width: 26, height: 26, borderRadius: 7, backgroundColor: Colors.n20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  qNumText: { fontFamily: Font.bold, fontSize: 12, color: Colors.n70 },
  barTrack: { flex: 1, height: 7, borderRadius: 999, backgroundColor: Colors.n20, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  qScore: { fontFamily: Font.bold, fontSize: 14, minWidth: 30, textAlign: 'right' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.n30, backgroundColor: Colors.white, gap: 10 },
});
