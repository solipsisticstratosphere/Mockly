import React from 'react';
import { View, ViewStyle, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  padding?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, padding = 16, style, onPress }: CardProps) {
  const content = (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.n30,
  },
});
