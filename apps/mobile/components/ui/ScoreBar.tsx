import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { scoreColor } from '../../lib/score';

interface ScoreBarProps {
  label: string;
  value: number;
  animate?: boolean;
}

export function ScoreBar({ label, value, animate = true }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(1, value / 10));
  const width = useRef(new Animated.Value(animate ? 0 : pct)).current;

  useEffect(() => {
    if (!animate) { width.setValue(pct); return; }
    const t = setTimeout(() => Animated.timing(width, { toValue: pct, duration: 800, useNativeDriver: false }).start(), 60);
    return () => clearTimeout(t);
  }, [pct, animate]);

  const col = scoreColor(value);
  const barWidth = width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: col }]}>{value.toFixed(1)}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: barWidth, backgroundColor: col }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: Font.semiBold, fontSize: 13, color: Colors.n100 },
  value: { fontFamily: Font.bold, fontSize: 13 },
  track: { height: 7, borderRadius: 999, backgroundColor: Colors.n20, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
