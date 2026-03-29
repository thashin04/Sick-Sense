import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme';

export function useAppTheme() {
  const { isDark, themePref, setThemePref } = useTheme();

  return {
    isDark,
    themePref,
    setThemePref,

    // ── Backgrounds ──────────────────────────────────────────
    background:         isDark ? Colors.indigo        : Colors.cloudBlue,
    surface:            isDark ? 'rgba(255,255,255,0.15)' : Colors.white,
    surfaceSecondary:   isDark ? 'rgba(255,255,255,0.08)' : Colors.cloudBlue,
    surfaceModal:       isDark ? '#403E79'                : Colors.white,

    // ── Text ─────────────────────────────────────────────────
    heading:            isDark ? '#FFFFFF'            : Colors.indigo,
    subheading:         isDark ? '#FFFFFF'            : Colors.indigo,
    body:               isDark ? '#FFFFFF'            : '#374151',
    muted:              isDark ? '#A3C7FF'            : '#6B7280',
    caption:            isDark ? '#A3C7FF'            : '#9CA3AF',
    sectionLabel:       isDark ? '#A3C7FF'            : '#9CA3AF',
    labelText:          isDark ? '#FFFFFF'            : '#111827',

    // ── Borders / Dividers ───────────────────────────────────
    border:             isDark ? 'rgba(255,255,255,0.2)'  : Colors.lightMidBlue,
    divider:            isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB',

    // ── Tab bar ──────────────────────────────────────────────
    tabBar:             isDark ? Colors.indigo        : Colors.white,
    tabBarBorder:       isDark ? 'rgba(255,255,255,0.15)' : Colors.lightMidBlue,
    tabIconInactive:    isDark ? '#A3C7FF'            : '#9CA3AF',

    // ── Input fields ─────────────────────────────────────────
    inputBg:            isDark ? 'rgba(255,255,255,0.8)'  : '#FAFBFF',
    inputText:          '#111827',                          // always dark
    inputBorder:        isDark ? 'rgba(255,255,255,0.3)'  : Colors.lightMidBlue,
    placeholderColor:   isDark ? '#555577'                : '#B0B8C8',

    // ── Shadow ───────────────────────────────────────────────
    shadowColor:        isDark ? 'transparent'        : Colors.indigo,
    shadowOpacity:      isDark ? 0                    : 0.06,

    // ── Primary action color ─────────────────────────────────
    primary:            isDark ? Colors.sunlight      : Colors.indigo,
    primaryText:        isDark ? Colors.indigo        : Colors.white,

    // ── Status Colors ────────────────────────────────────────
    error:              Colors.coral,
    success:            '#22C55E',
    surfaceSuccess:     isDark ? 'rgba(34,197,94,0.12)' : '#F0FFF4',
    surfaceTertiary:    isDark ? 'rgba(255,255,255,0.08)' : Colors.cloudBlue,

    // ── Status bar ───────────────────────────────────────────
    statusBar:          (isDark ? 'light' : 'dark') as 'light' | 'dark',
  } as const;
}
