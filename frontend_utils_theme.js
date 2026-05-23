// src/utils/theme.js
export const Colors = {
  primary:    '#0A1628',
  secondary:  '#1A3A5C',
  accent:     '#00C8DC',
  accentDark: '#007A8C',
  success:    '#22C55E',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  white:      '#FFFFFF',
  offWhite:   '#F0F4F8',
  gray100:    '#F1F5F9',
  gray200:    '#E2E8F0',
  gray400:    '#94A3B8',
  gray600:    '#475569',
  gray800:    '#1E293B',
  cardBg:     '#0F2240',
  overlay:    'rgba(0,0,0,0.65)',
};

export const Fonts = {
  regular:    'System',
  bold:       'System',
  sizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 36,
  },
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const Radius = {
  sm: 8, md: 12, lg: 18, xl: 24, full: 999,
};

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
};
