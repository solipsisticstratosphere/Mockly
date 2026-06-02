import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Card } from '../../components/ui/Card';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { scoreColor, scoreLabel } from '../../lib/score';

const MOCK = {
  readiness: 74, avgScore: 7.4, streak: 12, sessionsTotal: 38, questionsTotal: 214,
  trend: [5.8, 6.2, 6.0, 6.9, 7.1, 6.8, 7.6, 7.4],
  topics: [
    { key: 'react', name: 'React', score: 8.1, count: 42, icon: 'code' },
    { key: 'javascript', name: 'JavaScript', score: 7.6, count: 38, icon: 'zap' },
    { key: 'react_native', name: 'React Native', score: 6.4, count: 24, icon: 'layers' },
    { key: 'system_design', name: 'System Design', score: 4.8, count: 18, icon: 'target' },
    { key: 'behavioral', name: 'Behavioral', score: 5.6, count: 22, icon: 'message' },
  ],
};

function HeroStat({ value, label }: { value: string | number; label: string }) {
  return (
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TrendChart({ data }: { data: number[] }) {
  const W = 300, H = 110, pad = 8;
  const min = 0, max = 10;
  const xs = data.map((_, i) => pad + (i * (W - pad * 2)) / (data.length - 1));
  const ys = data.map(v => pad + (1 - (v - min) / (max - min)) * (H - pad * 2));
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${H - pad} L${xs[0].toFixed(1)},${H - pad} Z`;
  const last = data[data.length - 1];
  const lx = xs[xs.length - 1];
  const ly = ys[ys.length - 1];

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {[2.5, 5, 7.5].map(g => {
        const y = pad + (1 - g / 10) * (H - pad * 2);
        return <Line key={g} x1={pad} y1={y} x2={W - pad} y2={y} stroke={Colors.n30} strokeWidth="1" strokeDasharray="3 4" />;
      })}
      <Path d={area} fill="rgba(1,89,166,0.10)" />
      <Path d={line} fill="none" stroke={Colors.blue700} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <Circle key={i} cx={x} cy={ys[i]} r={i === data.length - 1 ? 4.5 : 3}
          fill={i === data.length - 1 ? Colors.blue700 : Colors.white}
          stroke={Colors.blue700} strokeWidth="2" />
      ))}
      <Rect x={lx - 18} y={ly - 26} width="36" height="19" rx="5" fill={Colors.blue800} />
      <SvgText x={lx} y={ly - 13} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{last.toFixed(1)}</SvgText>
    </Svg>
  );
}

export default function AnalyticsScreen() {
  const m = MOCK;

  return (
    <ScrollView style={styles.outer} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Navy hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Progress</Text>
        <View style={styles.heroBody}>
          <ScoreRing
            value={m.readiness} max={100} size={104} stroke={10} color="#5BC98A"
            label={<Text style={styles.ringNum}>{m.readiness}</Text>}
            sub={<Text style={styles.ringSub}>READY</Text>}
          />
          <View style={styles.statsGrid}>
            <HeroStat value={m.avgScore.toFixed(1)} label="Avg score" />
            <HeroStat value={m.streak} label="Day streak" />
            <HeroStat value={m.sessionsTotal} label="Sessions" />
            <HeroStat value={m.questionsTotal} label="Questions" />
          </View>
        </View>
      </View>

      <SectionHeader>Score over time</SectionHeader>
      <View style={styles.chartSection}>
        <Card padding={16}>
          <TrendChart data={m.trend} />
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>8 sessions ago</Text>
            <Text style={styles.chartLabel}>Latest</Text>
          </View>
        </Card>
      </View>

      <SectionHeader>Topic mastery</SectionHeader>
      <View style={styles.topicsSection}>
        {m.topics.map(t => {
          const col = scoreColor(t.score);
          return (
            <Card key={t.key} padding={14} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View style={[styles.topicIcon, { backgroundColor: col + '22' }]}>
                  <Icon name={t.icon as any} size={18} color={col} />
                </View>
                <View style={styles.topicMid}>
                  <Text style={styles.topicName}>{t.name}</Text>
                  <Text style={styles.topicMeta}>{t.count} questions · {scoreLabel(t.score)}</Text>
                </View>
                <Text style={[styles.topicScore, { color: col }]}>{t.score.toFixed(1)}</Text>
              </View>
              <View style={styles.topicTrack}>
                <View style={[styles.topicFill, { width: `${t.score * 10}%` as any, backgroundColor: col }]} />
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  content: { paddingBottom: 32 },
  hero: { backgroundColor: Colors.blue800, paddingTop: 56, paddingBottom: 22, paddingHorizontal: 20 },
  heroTitle: { fontFamily: Font.bold, fontSize: 22, color: Colors.white, marginBottom: 18 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringNum: { fontFamily: Font.extraBold, fontSize: 30, color: Colors.white, lineHeight: 32 },
  ringSub: { fontFamily: Font.semiBold, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginTop: 2 },
  statsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 14, rowGap: 14 },
  statValue: { fontFamily: Font.extraBold, fontSize: 20, color: Colors.white, lineHeight: 22 },
  statLabel: { fontFamily: Font.regular, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  chartSection: { paddingHorizontal: 16 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  chartLabel: { fontFamily: Font.regular, fontSize: 11, color: Colors.n70 },
  topicsSection: { paddingHorizontal: 16, gap: 10 },
  topicCard: {},
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  topicIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  topicMid: { flex: 1 },
  topicName: { fontFamily: Font.bold, fontSize: 15, color: Colors.n100 },
  topicMeta: { fontFamily: Font.regular, fontSize: 12, color: Colors.n70, marginTop: 1 },
  topicScore: { fontFamily: Font.extraBold, fontSize: 18 },
  topicTrack: { height: 7, borderRadius: 999, backgroundColor: Colors.n20, overflow: 'hidden' },
  topicFill: { height: '100%', borderRadius: 999 },
});
