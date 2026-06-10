import React, { useState, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Chip } from '../../components/ui/Chip';
import { scoreColor } from '../../utils/score';
import { useSessionsInfinite } from '../../hooks';
import { useTheme } from '../../lib/theme';
import type { Session } from '@mockly/shared';

const TOPIC_LABELS: Record<string, string> = {
  react: 'React',
  javascript: 'JavaScript',
  react_native: 'React Native',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  mixed: 'Mixed',
};
const MODE_ICON = { text: 'message', voice: 'mic', rapid: 'zap' } as const;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'text', label: 'Text' },
  { key: 'voice', label: 'Voice' },
  { key: 'rapid', label: 'Rapid' },
] as const;

function getDayGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return 'Earlier';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const group = getDayGroup(iso);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (group === 'Today') return `Today · ${time}`;
  if (group === 'Yesterday') return `Yesterday · ${time}`;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

const SessionRow = memo(function SessionRow({
  session,
  last,
}: {
  session: Session;
  last: boolean;
}) {
  const theme = useTheme();
  const col = scoreColor(session.total_score ?? 0);
  const icon = MODE_ICON[session.mode as keyof typeof MODE_ICON] ?? 'message';
  const durationMin = session.duration_seconds ? Math.ceil(session.duration_seconds / 60) : null;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: theme.surface },
        !last && { borderBottomWidth: 1, borderBottomColor: theme.border },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: theme.elevated }]}>
        <Icon name={icon} size={18} color={theme.blue700} />
      </View>
      <View style={styles.rowMid}>
        <Text style={[styles.rowTopic, { color: theme.fg }]}>
          {TOPIC_LABELS[session.topic] ?? session.topic}
        </Text>
        <Text style={[styles.rowMeta, { color: theme.fgMuted }]}>
          {session.mode[0].toUpperCase() + session.mode.slice(1)} · {session.question_count} Q
          {durationMin ? ` · ${durationMin} min` : ''} · {formatDate(session.started_at)}
        </Text>
      </View>
      {session.total_score != null && (
        <View style={[styles.scorePill, { backgroundColor: col + '22' }]}>
          <Text style={[styles.scoreNum, { color: col }]}>{session.total_score.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function HistoryScreen() {
  const theme = useTheme();
  const [filter, setFilter] = useState<'all' | 'text' | 'voice' | 'rapid'>('all');
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useSessionsInfinite();

  const sessions = (data?.pages ?? []).flatMap(p => p.sessions);
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.mode === filter);
  const groups = ['Today', 'Yesterday', 'Earlier']
    .map(label => ({ label, data: filtered.filter(s => getDayGroup(s.started_at) === label) }))
    .filter(g => g.data.length > 0);

  return (
    <View style={[styles.outer, { backgroundColor: theme.bg }]}>
      <View
        style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
      >
        <Text style={[styles.title, { color: theme.fg }]}>History</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map(f => (
            <Chip key={f.key} active={filter === f.key} onPress={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.blue700} style={{ marginTop: 40 }} size="large" />
      ) : groups.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Icon name="clock" size={36} color={theme.borderMuted} />
          <Text style={[styles.emptyTitle, { color: theme.fgMuted }]}>No sessions yet</Text>
          <Text style={[styles.emptySub, { color: theme.fgMuted }]}>
            Your completed interviews will appear here
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groups}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionHeaderText, { color: theme.fgMuted }]}>
                {section.label}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View
              style={
                index === 0
                  ? styles.groupWrapStart
                  : index === section.data.length - 1
                    ? styles.groupWrapEnd
                    : undefined
              }
            >
              {index === 0 && (
                <View
                  style={[
                    styles.groupOuter,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                />
              )}
              <SessionRow session={item} last={index === section.data.length - 1} />
              {index === section.data.length - 1 && (
                <View
                  style={[
                    styles.groupBottom,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                />
              )}
            </View>
          )}
          renderSectionFooter={() => <View style={{ height: 8 }} />}
          stickySectionHeadersEnabled={false}
          ListFooterComponent={
            hasNextPage ? (
              <TouchableOpacity
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                style={[styles.loadMore, { borderColor: theme.border }]}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color={theme.blue700} />
                ) : (
                  <Text style={[styles.loadMoreText, { color: theme.blue700 }]}>Load more</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  header: { borderBottomWidth: 1, paddingTop: 56, paddingBottom: 12 },
  title: {
    fontFamily: Font.bold,
    fontSize: 22,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  filtersScroll: { paddingHorizontal: 16, gap: 7, paddingBottom: 2 },
  listContent: { paddingBottom: 24 },
  sectionHeaderWrap: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionHeaderText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.72,
  },
  groupOuter: {
    marginHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  groupWrapStart: {},
  groupWrapEnd: {},
  groupBottom: {
    marginHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    height: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    paddingHorizontal: 14,
    marginHorizontal: 16,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowMid: { flex: 1, minWidth: 0 },
  rowTopic: { fontFamily: Font.semiBold, fontSize: 15 },
  rowMeta: { fontFamily: Font.regular, fontSize: 12.5, marginTop: 2 },
  scorePill: {
    minWidth: 44,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontFamily: Font.extraBold, fontSize: 15 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontFamily: Font.bold, fontSize: 17 },
  emptySub: { fontFamily: Font.regular, fontSize: 13.5 },
  loadMore: {
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: { fontFamily: Font.semiBold, fontSize: 14 },
});
