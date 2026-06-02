import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon, IconName } from '../../components/ui/Icon';
import { Badge } from '../../components/ui/Badge';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useAuthStore } from '../../stores/authStore';

const MOCK = {
  name: 'Alex Rivera', initials: 'AR', email: 'alex.rivera@gmail.com',
  role: 'Frontend', level: 'Middle', streak: 12, bestStreak: 21, avgScore: 7.4,
};

function MiniStat({ icon, tone, value, label }: { icon: IconName; tone: 'amber' | 'success' | 'accent'; value: string | number; label: string }) {
  const col = tone === 'amber' ? Colors.amber : tone === 'success' ? Colors.green : Colors.blue700;
  const bg = tone === 'amber' ? 'rgba(201,130,27,0.12)' : tone === 'success' ? Colors.greenSoft : 'rgba(1,89,166,0.10)';
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniIcon, { backgroundColor: bg }]}><Icon name={icon} size={17} color={col} fill={icon === 'flame'} /></View>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function ToggleRow({ label, sub, initial }: { label: string; sub?: string; initial?: boolean }) {
  const [on, setOn] = useState(initial ?? false);
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub && <Text style={styles.toggleSub}>{sub}</Text>}
      </View>
      <Switch
        value={on} onValueChange={setOn}
        trackColor={{ false: Colors.n40, true: Colors.green }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { signOut } = useAuthStore();
  const p = MOCK;

  return (
    <ScrollView style={styles.outer} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Navy hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Profile</Text>
        <View style={styles.heroBody}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{p.initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{p.name}</Text>
            <Text style={styles.heroEmail}>{p.email}</Text>
            <View style={styles.badgeRow}>
              <Badge tone="onDark">{p.role}</Badge>
              <Badge tone="onDark">{p.level}</Badge>
            </View>
          </View>
        </View>
      </View>

      {/* Mini stats */}
      <View style={styles.miniStats}>
        <MiniStat icon="flame" tone="amber" value={p.streak} label="Day streak" />
        <MiniStat icon="award" tone="accent" value={p.bestStreak} label="Best streak" />
        <MiniStat icon="trend" tone="success" value={p.avgScore.toFixed(1)} label="Avg score" />
      </View>

      <SectionHeader>Interview target</SectionHeader>
      <View style={styles.group}>
        <ListRow icon="user" iconTone="accent" title="Role" meta={p.role} metaTone="muted" onPress={() => {}} />
        <ListRow icon="layers" iconTone="accent" title="Level" meta={p.level} metaTone="muted" onPress={() => {}} last />
      </View>

      <SectionHeader>Practice</SectionHeader>
      <View style={styles.group}>
        <ToggleRow label="Daily reminder" sub="Every day at 9:00 AM" initial />
        <View style={styles.divider} />
        <ListRow icon="book" title="Question bank" sub="Browse 600+ questions" onPress={() => {}} />
        <ToggleRow label="Dark mode" />
      </View>

      <SectionHeader>Account</SectionHeader>
      <View style={styles.group}>
        <ListRow icon="settings" title="Settings" onPress={() => {}} />
        <ListRow icon="logout" title="Sign out" onPress={signOut} last />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  content: { paddingBottom: 32 },
  hero: { backgroundColor: Colors.blue800, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  heroTitle: { fontFamily: Font.bold, fontSize: 22, color: Colors.white, marginBottom: 18 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.bold, fontSize: 22, color: Colors.white },
  heroName: { fontFamily: Font.bold, fontSize: 18, color: Colors.white },
  heroEmail: { fontFamily: Font.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  miniStats: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  miniStat: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.n30, padding: 14, alignItems: 'center', gap: 6 },
  miniIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  miniValue: { fontFamily: Font.extraBold, fontSize: 18, color: Colors.n100 },
  miniLabel: { fontFamily: Font.regular, fontSize: 11, color: Colors.n70, textAlign: 'center' },
  group: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.n30, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: Colors.n30 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 13, paddingHorizontal: 14, backgroundColor: Colors.white },
  toggleLabel: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.n100 },
  toggleSub: { fontFamily: Font.regular, fontSize: 13, color: Colors.n70, marginTop: 2 },
});
