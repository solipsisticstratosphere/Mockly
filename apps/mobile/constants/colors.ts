export const Colors = {
  blue700: '#0159A6',
  blue800: '#1B448B',
  blue900: '#122F61',
  green:   '#1E8A4C',
  greenSoft: 'rgba(30,138,76,0.12)',
  amber:   '#C9821B',
  red:     '#C0312B',
  white:   '#FFFFFF',
  n10:     '#FDFDFD',
  n20:     '#ECF1F6',
  n30:     '#E3E9ED',
  n40:     '#D1D8DD',
  n70:     '#78828A',
  n100:    '#1F2C37',
} as const;

export type Color = typeof Colors[keyof typeof Colors];
