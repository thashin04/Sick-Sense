import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  PanResponder,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

// ─── Speed Slider ─────────────────────────────────────────────────────────────

const SPEED_MIN = 0.5;
const SPEED_MAX = 2.0;
const SPEED_STEP = 0.1;
const THUMB_SIZE = 22;

function SpeedSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const startXRef = useRef(0);
  const startValRef = useRef(value);

  const clamp = (v: number) => Math.max(SPEED_MIN, Math.min(SPEED_MAX, v));
  const snap = (v: number) => Math.round(v / SPEED_STEP) * SPEED_STEP;
  const progress = (value - SPEED_MIN) / (SPEED_MAX - SPEED_MIN);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      startXRef.current = e.nativeEvent.pageX;
      startValRef.current = value;
      trackRef.current?.measure((_x, _y, w, _h, px) => {
        const rel = e.nativeEvent.pageX - px;
        onChange(snap(clamp(SPEED_MIN + (rel / w) * (SPEED_MAX - SPEED_MIN))));
      });
    },
    onPanResponderMove: (e) => {
      if (!trackWidth) return;
      const dx = e.nativeEvent.pageX - startXRef.current;
      const dv = (dx / trackWidth) * (SPEED_MAX - SPEED_MIN);
      onChange(snap(clamp(startValRef.current + dv)));
    },
  });

  return (
    <View style={sliderStyles.wrap}>
      <View
        ref={trackRef}
        style={sliderStyles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Filled portion */}
        <View style={[sliderStyles.fill, { width: `${progress * 100}%` }]} />
        {/* Thumb */}
        {trackWidth > 0 && (
          <View
            style={[sliderStyles.thumb, { left: progress * trackWidth - THUMB_SIZE / 2 }]}
          />
        )}
      </View>
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.labelEdge}>{SPEED_MIN.toFixed(1)}x</Text>
        <Text style={sliderStyles.labelCenter}>{value.toFixed(1)}x</Text>
        <Text style={sliderStyles.labelEdge}>{SPEED_MAX.toFixed(1)}x</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { marginTop: 16 },
  track: {
    height: 6,
    backgroundColor: Colors.lightMidBlue,
    borderRadius: 3,
    justifyContent: 'center',
  },
  fill: {
    height: 6,
    backgroundColor: Colors.indigo,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.indigo,
    top: -(THUMB_SIZE / 2 - 3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  labelEdge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#9CA3AF',
  },
  labelCenter: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.indigo,
  },
});

// ─── Row components ───────────────────────────────────────────────────────────

function SettingToggleRow({
  icon,
  iconBg = Colors.cloudBlue,
  iconColor = Colors.indigo,
  label,
  subtitle,
  value,
  onToggle,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg?: string;
  iconColor?: string;
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={rowStyles.text}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.lightMidBlue, true: Colors.indigo }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.lightMidBlue}
      />
    </View>
  );
}

function SettingActionRow({
  icon,
  iconBg = Colors.cloudBlue,
  iconColor = Colors.indigo,
  label,
  subtitle,
  actionLabel,
  actionColor = Colors.babyBlue,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg?: string;
  iconColor?: string;
  label: string;
  subtitle: string;
  actionLabel: string;
  actionColor?: string;
  onPress: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={rowStyles.text}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.subtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={onPress} hitSlop={12}>
        <Text style={[rowStyles.action, { color: actionColor }]}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.black, marginBottom: 2 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: '#6B7280', lineHeight: 16 },
  action: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.label}>{label}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.lightMidBlue, marginVertical: 2 }} />;
}

const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 18,
    gap: 2,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props) {
  const [haptic, setHaptic] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.2);
  const [healthAlerts, setHealthAlerts] = useState(true);

  function confirmDeleteData() {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete your account data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: call backend delete endpoint, then navigate to Landing
            navigation.navigate('Landing');
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.cloudBlue }}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ACCESSIBILITY */}
        <Section label="ACCESSIBILITY">
          <View style={{ paddingVertical: 14 }}>
            <SettingToggleRow
              icon="phone-portrait-outline"
              label="Haptic Health Alerts"
              subtitle="Vibration feedback for important health updates"
              value={haptic}
              onToggle={() => setHaptic((v) => !v)}
            />
          </View>
          <Divider />
          <View style={{ paddingVertical: 14 }}>
            <SettingToggleRow
              icon="contrast-outline"
              label="High-Contrast Map"
              subtitle="Enhanced visibility for map risk zones"
              value={highContrast}
              onToggle={() => setHighContrast((v) => !v)}
            />
          </View>
          <Divider />
          <View style={{ paddingVertical: 14 }}>
            <SettingActionRow
              icon="volume-medium-outline"
              label="Audio Speed"
              subtitle="Adjust playback speed for voice reports"
              actionLabel=""
              onPress={() => {}}
            />
            <SpeedSlider value={audioSpeed} onChange={setAudioSpeed} />
          </View>
        </Section>

        {/* NOTIFICATIONS */}
        <Section label="NOTIFICATIONS">
          <View style={{ paddingVertical: 14 }}>
            <SettingToggleRow
              icon="notifications-outline"
              label="Health Alerts"
              subtitle="Get notified about local health risks"
              value={healthAlerts}
              onToggle={() => setHealthAlerts((v) => !v)}
            />
          </View>
        </Section>

        {/* LANGUAGE & REGION */}
        <Section label="LANGUAGE & REGION">
          <View style={{ paddingVertical: 14 }}>
            <SettingActionRow
              icon="globe-outline"
              label="Language"
              subtitle="English"
              actionLabel="Change"
              onPress={() => {
                // TODO: open language picker
                navigation.navigate('Language');
              }}
            />
          </View>
        </Section>

        {/* PRIVACY & SECURITY */}
        <Section label="PRIVACY & SECURITY">
          <View style={{ paddingVertical: 14 }}>
            <SettingActionRow
              icon="shield-outline"
              label="Data Privacy"
              subtitle="Manage your permissions"
              actionLabel="View"
              onPress={() => {
                // TODO: open data privacy modal
              }}
            />
          </View>
          <Divider />
          <View style={{ paddingVertical: 14 }}>
            <SettingActionRow
              icon="trash-outline"
              iconBg="#FDECEA"
              iconColor={Colors.coral}
              label="Delete All Data"
              subtitle="Purge all account data"
              actionLabel="Delete"
              actionColor={Colors.coral}
              onPress={confirmDeleteData}
            />
          </View>
        </Section>

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Tab Bar */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {[
            { icon: 'home-outline' as const, label: 'Home', active: false },
            { icon: 'map-outline' as const, label: 'Map', active: false },
            { icon: 'trending-up-outline' as const, label: 'Advice', active: false },
            { icon: 'settings' as const, label: 'Settings', active: true },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.active) {
                  if (tab.label === 'Home') navigation.navigate('Dashboard');
                  if (tab.label === 'Map') navigation.navigate('Map');
                  if (tab.label === 'Advice') navigation.navigate('Advice');
                }
              }}
            >
              <View style={tab.active ? styles.tabIconActive : styles.tabIconInactive}>
                <Ionicons name={tab.icon} size={22} color={tab.active ? Colors.white : '#9CA3AF'} />
              </View>
              <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cloudBlue },
  titleRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: FontFamily.extraBold, fontSize: 34, color: Colors.indigo },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Tab bar
  tabBarSafe: { backgroundColor: Colors.white },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightMidBlue,
    backgroundColor: Colors.white,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabIconActive: {
    width: 48, height: 32, borderRadius: 16,
    backgroundColor: Colors.indigo, alignItems: 'center', justifyContent: 'center',
  },
  tabIconInactive: { width: 48, height: 32, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: FontFamily.regular, fontSize: 11, color: '#9CA3AF' },
  tabLabelActive: { fontFamily: FontFamily.semiBold, color: Colors.indigo },
});
