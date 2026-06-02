import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SectionList,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Chip } from '../../components/ui/Chip';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { scoreColor } from '../../lib/score';

const MOCK_SESSIONS = [
  { id: 's1', topic: 'React', mode: 'text', score: 7.8, questions: 8, date: 'Today · 9:14 AM', when: 'Today', duration: '14 min' },
  { id: 's2', topic: 'System Design', mode: 'voice', score: 4.9, questions: 6, date: 'Yesterday · 7:40 PM', when: 'Yesterday', duration: '22 min' },
  { id: 's3', topic: 'Behavioral', mode: 'text', score: 6.2, questions: 5, date: 'Yesterday · 8:05 AM', when: 'Yesterday', duration: '11 min' },
  { id: 's4', topic: 'JavaScript', mode: 'rapid', score: 8.4, questions: 12, date: 'Mon, May 30', when: 'Earlier', duration: '7 min' },
  { id: 's5', topic: 'React Native', mode: 'text', score: 6.6, questions: 8, date: 'Sun, May 29', when: 'Earlier', duration: '16 min' },
  { id: 's6', topic: 'Mixed', mode: 'voice', score: 7.1, questions: 10, date: 'Sat, May 28', when: 'Earlier', duration: '19 min' },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'text', label: 'Text' },
  { key: 'voice', label: 'Voice' },
  { key: 'rapid', label: 'Rapid' },
] as const;

const MODE_ICON = { text: 'message', voice: 'mic', rapid: 'zap' } as const;

function SessionRow({ session, last }: { session: typeof MOCK_SESSIONS[0]; last: boolean }) {
  const col = scoreColor(session.score);
  const icon = MODE_ICON[session.mode as keyof typeof MODE_ICON] ?? 'message';
  return (
    <TouchableOpacity style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}><Icon name={icon} size={18} color={Colors.blue800} /></View>
      <View style={styles.rowMid}>
        <Text style={styles.rowTopic}>{session.topic}</Text>
        <Text style={styles.rowMeta}>{session.mode[0].toUpperCase() + session.mode.slice(1)} · {session.questions} Q · {session.date}</Text>
      </View>
      <View style={[styles.scorePill, { backgroundColor: col + '22' }]}>
        <Text style={[styles.scoreNum, { color: col }]}>{session.score.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'text' | 'voice' | 'rapid'>('all');

  const filtered = filter === 'all' ? MOCK_SESSIONS : MOCK_SESSIONS.filter(s => s.mode === filter);
  const groups = ['Today', 'Yesterday', 'Earlier']
    .map(label => ({ label, data: filtered.filter(s => s.when === label) }))
    .filter(g => g.data.length > 0);

  return (
    <View style={styles.outer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTERS.map(f => (
            <Chip key={f.key} active={filter === f.key} onPress={() => setFilter(f.key)}>{f.label}</Chip>
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={groups}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeaderText}>{section.label}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={index === 0 ? styles.groupWrapStart : (index === section.data.length - 1 ? styles.groupWrapEnd : undefined)}>
            {index === 0 && <View style={styles.groupOuter} />}
            <SessionRow session={item} last={index === section.data.length - 1} />
            {index === section.data.length - 1 && <View style={styles.groupBottom} />}
          </View>
        )}
        renderSectionFooter={() => <View style={{ height: 8 }} />}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  header: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.n30, paddingTop: 56, paddingBottom: 12 },
  title: { fontFamily: Font.bold, fontSize: 22, color: Colors.n100, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 8 },
  filtersScroll: { paddingHorizontal: 16, gap: 7, paddingBottom: 2 },
  listContent: { paddingBottom: 24 },
  sectionHeaderWrap: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionHeaderText: { fontFamily: Font.semiBold, fontSize: 12, color: Colors.n70, textTransform: 'uppercase', letterSpacing: 0.72 },
  groupOuter: { marginHorizontal: 16, backgroundColor: Colors.white, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.n30 },
  groupWrapStart: {},
  groupWrapEnd: {},
  groupBottom: { marginHorizontal: 16, backgroundColor: Colors.white, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderTopWidth: 0, borderColor: Colors.n30, height: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 14, backgroundColor: Colors.white, marginHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.n30 },
  rowIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: Colors.n20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowMid: { flex: 1, minWidth: 0 },
  rowTopic: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.n100 },
  rowMeta: { fontFamily: Font.regular, fontSize: 12.5, color: Colors.n70, marginTop: 2 },
  scorePill: { minWidth: 44, height: 30, paddingHorizontal: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontFamily: Font.extraBold, fontSize: 15 },
});
