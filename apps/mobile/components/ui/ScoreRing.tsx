import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: React.ReactNode;
  sub?: React.ReactNode;
  animate?: boolean;
}

export function ScoreRing({ value, max = 100, size = 132, stroke = 11, color, label, sub, animate = true }: ScoreRingProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ringColor = color ?? Colors.blue700;

  const progress = useRef(new Animated.Value(animate ? 0 : pct)).current;

  useEffect(() => {
    if (!animate) { progress.setValue(pct); return; }
    Animated.timing(progress, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct, animate]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }], position: 'absolute' }}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke}
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={ringColor} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View style={{ alignItems: 'center', gap: 2 }}>
        {label}
        {sub}
      </View>
    </View>
  );
}
