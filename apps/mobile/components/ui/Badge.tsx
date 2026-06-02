import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';

type BadgeTone = 'neutral' | 'info' | 'success' | 'amber' | 'red' | 'outline' | 'onDark';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
}

const TONES: Record<BadgeTone, { bg: string; fg: string; border?: string }> = {
  neutral: { bg: Colors.n30, fg: Colors.n100 },
  info:    { bg: Colors.n20, fg: Colors.blue800 },
  success: { bg: Colors.greenSoft, fg: Colors.green },
  amber:   { bg: 'rgba(201,130,27,0.14)', fg: Colors.amber },
  red:     { bg: 'rgba(192,49,43,0.12)', fg: Colors.red },
  outline: { bg: 'transparent', fg: Colors.n100, border: Colors.n40 },
  onDark:  { bg: 'rgba(255,255,255,0.16)', fg: Colors.white },
};

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.base, { backgroundColor: t.bg, borderColor: t.border ?? 'transparent', borderWidth: t.border ? 1 : 0 }]}>
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 22, paddingHorizontal: 10, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 0.2 },
});
