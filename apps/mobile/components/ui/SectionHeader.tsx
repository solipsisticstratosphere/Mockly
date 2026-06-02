import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';

interface SectionHeaderProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({ children, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{children}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
  },
  text: {
    fontFamily: Font.semiBold, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 0.72, color: Colors.n70,
  },
});
