import { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CloudHeader from './CloudHeader';
import { Colors, FontFamily, FontSize } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface Props {
  title: string;
  subtitle: string;
  cardContent: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
}

export default function TutorialLayout({
  title,
  subtitle,
  cardContent,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const { height } = useWindowDimensions();
  const theme = useAppTheme();
  const cardHeight = height * 0.42;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom']}>
      <StatusBar style={theme.statusBar} />

      {/* Header + content scroll together */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <CloudHeader />

        <View style={styles.body}>
          {onSkip && (
            <TouchableOpacity style={styles.skipWrap} onPress={onSkip} hitSlop={12}>
              <Text style={[styles.skipTxt, { color: theme.primary }]}>Skip  ›</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.title, { color: theme.heading }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.body }]}>{subtitle}</Text>

          <View style={[styles.card, { height: cardHeight }]}>{cardContent}</View>

          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentStep - 1 ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Back / Next stay fixed at bottom */}
      <View style={[styles.btnRow, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[styles.btnBack, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onBack}
          activeOpacity={0.8}
          disabled={!onBack}
        >
          <Text style={[styles.btnBackTxt, { color: theme.heading }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnNext, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={onNext} activeOpacity={0.85}>
          <Text style={[styles.btnNextTxt, { color: theme.primaryText }]}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 8 },
  body: { paddingHorizontal: 20, paddingTop: 20 },

  skipWrap: { alignSelf: 'flex-end', paddingVertical: 4, marginBottom: 8 },
  skipTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.indigo,
  },

  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xxxl,
    color: Colors.darkBlue,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.indigo,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: { height: 6, borderRadius: 3, width: 60 },
  dotActive: {},
  dotInactive: {},

  btnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  btnBack: {
    flex: 2,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  btnBackTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
  },
  btnNext: {
    flex: 3,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnNextTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
  },
});
