import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';

interface ChipProps {
  active?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

export function Chip({ active, onPress, children }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? Colors.blue800 : Colors.white, borderColor: active ? Colors.blue800 : Colors.n40 },
      ]}
    >
      <Text style={[styles.text, { color: active ? Colors.white : Colors.n100 }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontFamily: Font.semiBold, fontSize: 13 },
});
