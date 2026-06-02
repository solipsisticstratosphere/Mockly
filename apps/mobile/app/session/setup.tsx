import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon, IconName } from '../../components/ui/Icon';
import { Chip } from '../../components/ui/Chip';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const MODES = [
  { key: 'text', name: 'Text', icon: 'message' as IconName, desc: 'Type your answers at your own pace', meta: '8 questions · ~15 min' },
  { key: 'voice', name: 'Voice', icon: 'mic' as IconName, desc: 'Speak answers aloud, AI transcribes', meta: '6 questions · ~20 min' },
  { key: 'rapid', name: 'Rapid Drill', icon: 'zap' as IconName, desc: 'Fast-fire concepts, short answers', meta: '12 questions · ~7 min' },
];

const TOPICS = [
  { key: 'react', label: 'React' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'react_native', label: 'React Native' },
  { key: 'system_design', label: 'System Design' },
  { key: 'behavioral', label: 'Behavioral' },
  { key: 'mixed', label: 'Mixed' },
];

export default function SetupScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('text');
  const [topic, setTopic] = useState('react');
  const [count, setCount] = useState(8);

  return (
    <View style={styles.outer}>
      {/* White header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="x" size={20} color={Colors.n100} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Session</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Target banner */}
        <View style={styles.targetBanner}>
          <Icon name="target" size={17} color={Colors.blue700} />
          <Text style={styles.targetText}>Tuned for <Text style={styles.targetBold}>Middle Frontend</Text> — difficulty adapts to your answers</Text>
        </View>

        {/* Mode */}
        <Text style={styles.sectionLabel}>MODE</Text>
        <View style={styles.modeList}>
          {MODES.map(m => {
            const on = mode === m.key;
            return (
              <TouchableOpacity key={m.key} onPress={() => setMode(m.key)} style={[styles.modeCard, on && styles.modeCardActive]}>
                <View style={[styles.modeIcon, { backgroundColor: on ? Colors.blue800 : Colors.n20 }]}>
                  <Icon name={m.icon} size={21} color={on ? Colors.white : Colors.blue800} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeName}>{m.name}</Text>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioActive]}>
                  {on && <Icon name="check" size={13} color={Colors.white} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Topic */}
        <Text style={styles.sectionLabel}>TOPIC</Text>
        <View style={styles.chipRow}>
          {TOPICS.map(t => <Chip key={t.key} active={topic === t.key} onPress={() => setTopic(t.key)}>{t.label}</Chip>)}
        </View>

        {/* Question count */}
        <Text style={styles.sectionLabel}>QUESTIONS</Text>
        <Card padding={14}>
          <View style={styles.countRow}>
            <View>
              <Text style={styles.countNum}>{count}</Text>
              <Text style={styles.countEst}>≈ {Math.round(count * 1.8)} min</Text>
            </View>
            <View style={styles.steppers}>
              <TouchableOpacity
                style={[styles.stepBtn, count <= 5 && styles.stepBtnDisabled]}
                onPress={() => setCount(c => Math.max(5, c - 1))}
                disabled={count <= 5}
              >
                <Icon name="minus" size={20} color={Colors.blue800} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, count >= 15 && styles.stepBtnDisabled]}
                onPress={() => setCount(c => Math.min(15, c + 1))}
                disabled={count >= 15}
              >
                <Icon name="plus" size={20} color={Colors.blue800} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button full size="lg" leadingIcon="play" onPress={() => router.push({ pathname: '/session/[id]', params: { id: 'new', mode, topic, count: String(count) } })}>
          Start Interview
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  header: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.n30, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  closeBtn: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: Font.bold, fontSize: 17, color: Colors.n100 },
  body: { padding: 16, gap: 0, paddingBottom: 8 },
  targetBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, paddingHorizontal: 12, backgroundColor: 'rgba(1,89,166,0.07)', borderRadius: 10, marginBottom: 18 },
  targetText: { flex: 1, fontFamily: Font.regular, fontSize: 13, color: Colors.n100 },
  targetBold: { fontFamily: Font.bold },
  sectionLabel: { fontFamily: Font.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.66, color: Colors.n70, marginBottom: 10, marginTop: 6 },
  modeList: { gap: 10, marginBottom: 22 },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.n30 },
  modeCardActive: { borderColor: Colors.blue700, shadowColor: Colors.blue700, shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  modeIcon: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modeName: { fontFamily: Font.bold, fontSize: 15, color: Colors.n100 },
  modeDesc: { fontFamily: Font.regular, fontSize: 12.5, color: Colors.n70, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: Colors.n40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioActive: { backgroundColor: Colors.blue700, borderColor: Colors.blue700 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countNum: { fontFamily: Font.extraBold, fontSize: 26, color: Colors.n100 },
  countEst: { fontFamily: Font.regular, fontSize: 12, color: Colors.n70 },
  steppers: { flexDirection: 'row', gap: 8 },
  stepBtn: { width: 44, height: 44, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.n40, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  stepBtnDisabled: { opacity: 0.4 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.n30, backgroundColor: Colors.white },
});
