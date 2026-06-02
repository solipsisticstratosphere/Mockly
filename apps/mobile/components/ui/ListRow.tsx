import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon, IconName } from './Icon';

type IconTone = 'neutral' | 'success' | 'accent' | 'amber';

interface ListRowProps {
  icon?: IconName;
  iconTone?: IconTone;
  title: string;
  sub?: string;
  meta?: string;
  metaTone?: 'fg' | 'muted' | 'success' | 'amber';
  onPress?: () => void;
  last?: boolean;
  trailing?: React.ReactNode;
}

const ICON_STYLES: Record<IconTone, { bg: string; color: string }> = {
  neutral: { bg: Colors.n20, color: Colors.blue800 },
  success: { bg: Colors.greenSoft, color: Colors.green },
  accent:  { bg: 'rgba(1,89,166,0.10)', color: Colors.blue700 },
  amber:   { bg: 'rgba(201,130,27,0.12)', color: Colors.amber },
};

export function ListRow({ icon, iconTone = 'neutral', title, sub, meta, metaTone = 'fg', onPress, last, trailing }: ListRowProps) {
  const ic = ICON_STYLES[iconTone];
  const metaColor = metaTone === 'muted' ? Colors.n70 : metaTone === 'success' ? Colors.green : metaTone === 'amber' ? Colors.amber : Colors.n100;

  const inner = (
    <View style={[styles.row, !last && styles.border]}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: ic.bg }]}>
          <Icon name={icon} size={19} color={ic.color} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
      {trailing != null ? trailing : (
        meta != null
          ? <Text style={[styles.meta, { color: metaColor }]}>{meta}</Text>
          : onPress ? <Icon name="chevR" size={16} color={Colors.n70} /> : null
      )}
    </View>
  );

  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity> : inner;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 14, backgroundColor: Colors.white },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.n30 },
  iconWrap: { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1, minWidth: 0 },
  title: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.n100, lineHeight: 20 },
  sub: { fontFamily: Font.regular, fontSize: 13, color: Colors.n70, marginTop: 2, lineHeight: 18 },
  meta: { fontFamily: Font.bold, fontSize: 14 },
});
