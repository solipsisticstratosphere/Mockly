import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Icon } from '../../components/ui/Icon';
import { apiPost } from '../../lib/api';
import type { UserRole, DifficultyLevel } from '@mockly/shared';

const ROLES: { key: UserRole; label: string }[] = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'react_native', label: 'React Native' },
  { key: 'general', label: 'General' },
];

const LEVELS: { key: DifficultyLevel; label: string }[] = [
  { key: 'junior', label: 'Junior' },
  { key: 'middle', label: 'Middle' },
  { key: 'senior', label: 'Senior' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('frontend');
  const [level, setLevel] = useState<DifficultyLevel>('junior');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setLoading(true);
    setError('');
    try {
      await apiPost('/api/auth/profile', { role, level });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outer}>
      {/* Navy header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="target" size={28} color={Colors.white} />
        </View>
        <Text style={styles.title}>Set your target</Text>
        <Text style={styles.subtitle}>We'll tune question difficulty and topic mix to your level.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>YOUR ROLE</Text>
        <View style={styles.chips}>
          {ROLES.map(r => (
            <Chip key={r.key} active={role === r.key} onPress={() => setRole(r.key)}>{r.label}</Chip>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EXPERIENCE LEVEL</Text>
        <View style={styles.chips}>
          {LEVELS.map(l => (
            <Chip key={l.key} active={level === l.key} onPress={() => setLevel(l.key)}>{l.label}</Chip>
          ))}
        </View>

        <View style={styles.previewCard}>
          <Icon name="sparkle" size={16} color={Colors.blue700} fill />
          <Text style={styles.previewText}>
            AI will generate <Text style={styles.previewBold}>{level} {role}</Text> questions with adaptive difficulty
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {loading
          ? <ActivityIndicator color={Colors.blue800} />
          : <Button full size="lg" trailingIcon="arrowRight" onPress={handleContinue}>Continue</Button>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.n10 },
  header: {
    backgroundColor: Colors.blue800, paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontFamily: Font.extraBold, fontSize: 26, color: Colors.white, marginBottom: 8 },
  subtitle: { fontFamily: Font.regular, fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20 },
  body: { padding: 20, paddingBottom: 8 },
  sectionLabel: {
    fontFamily: Font.bold, fontSize: 11, color: Colors.n70,
    letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewCard: {
    marginTop: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, backgroundColor: 'rgba(1,89,166,0.07)', borderRadius: 10,
  },
  previewText: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Colors.n100, lineHeight: 20 },
  previewBold: { fontFamily: Font.bold },
  error: { marginTop: 12, fontFamily: Font.regular, fontSize: 13, color: Colors.red, textAlign: 'center' },
  footer: {
    padding: 16, borderTopWidth: 1, borderTopColor: Colors.n30, backgroundColor: Colors.white,
  },
});
