import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';

export type IconName =
  | 'home' | 'chart' | 'history' | 'user' | 'bell' | 'search'
  | 'chevR' | 'chevL' | 'chevDown' | 'plus' | 'minus' | 'check'
  | 'x' | 'arrowUp' | 'arrowRight' | 'clock' | 'settings' | 'mic'
  | 'message' | 'zap' | 'code' | 'target' | 'flame' | 'sparkle'
  | 'play' | 'skip' | 'send' | 'book' | 'layers' | 'trend'
  | 'award' | 'edit' | 'moon' | 'logout' | 'refresh';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.75, fill = false }: IconProps) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: fill ? color : 'none',
    stroke: fill ? undefined : color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'home':
      return <Svg {...props}><Path d="M3 12l9-9 9 9"/><Path d="M5 10v10h14V10"/></Svg>;
    case 'chart':
      return <Svg {...props}><Line x1="6" y1="20" x2="6" y2="10" stroke={color} strokeWidth={strokeWidth}/><Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={strokeWidth}/><Line x1="18" y1="20" x2="18" y2="14" stroke={color} strokeWidth={strokeWidth}/></Svg>;
    case 'history':
      return <Svg {...props}><Path d="M3 3v5h5"/><Path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><Path d="M12 7v5l4 2"/></Svg>;
    case 'user':
      return <Svg {...props}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'bell':
      return <Svg {...props}><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.7 21a2 2 0 0 1-3.4 0"/></Svg>;
    case 'chevR':
      return <Svg {...props}><Polyline points="9 6 15 12 9 18" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'chevL':
      return <Svg {...props}><Polyline points="15 6 9 12 15 18" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'chevDown':
      return <Svg {...props}><Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'plus':
      return <Svg {...props}><Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={strokeWidth}/><Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth}/></Svg>;
    case 'minus':
      return <Svg {...props}><Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth}/></Svg>;
    case 'check':
      return <Svg {...props}><Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'x':
      return <Svg {...props}><Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={strokeWidth}/><Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={strokeWidth}/></Svg>;
    case 'arrowUp':
      return <Svg {...props}><Line x1="12" y1="19" x2="12" y2="5" stroke={color} strokeWidth={strokeWidth}/><Polyline points="5 12 12 5 19 12" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'arrowRight':
      return <Svg {...props}><Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth}/><Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'clock':
      return <Svg {...props}><Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="none"/><Path d="M12 7v5l3 2"/></Svg>;
    case 'mic':
      return <Svg {...props}><Rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth={strokeWidth} fill="none"/><Path d="M5 10a7 7 0 0 0 14 0"/><Line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth}/></Svg>;
    case 'message':
      return <Svg {...props}><Path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></Svg>;
    case 'zap':
      return <Svg {...props}><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={color} strokeWidth={strokeWidth} fill={fill ? color : 'none'}/></Svg>;
    case 'code':
      return <Svg {...props}><Polyline points="16 18 22 12 16 6" stroke={color} strokeWidth={strokeWidth} fill="none"/><Polyline points="8 6 2 12 8 18" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'target':
      return <Svg {...props}><Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="none"/><Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={strokeWidth} fill="none"/><Circle cx="12" cy="12" r="1" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'flame':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? color : 'none'} stroke={fill ? undefined : color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2c1 3-1.5 4.5-1.5 7A3.5 3.5 0 0 0 14 12c.5-1 .3-2.2-.2-3 2 1 3.2 3.1 3.2 5.5a5 5 0 1 1-10 0c0-3.2 2.4-4.8 3-7.5.3-1.3.2-2.8 0-5z" fill={fill ? color : 'none'}/></Svg>;
    case 'sparkle':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? color : 'none'} stroke={fill ? undefined : color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill={fill ? color : 'none'}/><Path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill={fill ? color : 'none'}/></Svg>;
    case 'play':
      return <Svg {...props}><Polygon points="6 4 20 12 6 20 6 4" stroke={color} strokeWidth={strokeWidth} fill={fill ? color : 'none'}/></Svg>;
    case 'skip':
      return <Svg {...props}><Polygon points="5 4 15 12 5 20 5 4" stroke={color} strokeWidth={strokeWidth} fill="none"/><Line x1="19" y1="5" x2="19" y2="19" stroke={color} strokeWidth={strokeWidth}/></Svg>;
    case 'send':
      return <Svg {...props}><Line x1="22" y1="2" x2="11" y2="13" stroke={color} strokeWidth={strokeWidth}/><Polygon points="22 2 15 22 11 13 2 9 22 2" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'book':
      return <Svg {...props}><Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Svg>;
    case 'layers':
      return <Svg {...props}><Polygon points="12 2 2 7 12 12 22 7 12 2" stroke={color} strokeWidth={strokeWidth} fill="none"/><Polyline points="2 17 12 22 22 17" stroke={color} strokeWidth={strokeWidth} fill="none"/><Polyline points="2 12 12 17 22 12" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'trend':
      return <Svg {...props}><Polyline points="3 17 9 11 13 15 21 7" stroke={color} strokeWidth={strokeWidth} fill="none"/><Polyline points="21 12 21 7 16 7" stroke={color} strokeWidth={strokeWidth} fill="none"/></Svg>;
    case 'award':
      return <Svg {...props}><Circle cx="12" cy="8" r="6" stroke={color} strokeWidth={strokeWidth} fill="none"/><Path d="M8.2 13.5L7 22l5-3 5 3-1.2-8.5"/></Svg>;
    case 'moon':
      return <Svg {...props}><Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Svg>;
    case 'logout':
      return <Svg {...props}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={strokeWidth} fill="none"/><Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={strokeWidth}/></Svg>;
    case 'refresh':
      return <Svg {...props}><Polyline points="23 4 23 10 17 10" stroke={color} strokeWidth={strokeWidth} fill="none"/><Path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/></Svg>;
    case 'settings':
      return <Svg {...props}><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} fill="none"/><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>;
    case 'edit':
      return <Svg {...props}><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></Svg>;
    case 'search':
      return <Svg {...props}><Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} fill="none"/><Path d="m21 21-4.3-4.3"/></Svg>;
    default:
      return null;
  }
}
