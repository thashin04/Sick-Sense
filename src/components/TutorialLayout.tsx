import { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloudHeader from './CloudHeader';
import { Colors, FontFamily, FontSize } from '../theme';

interface Props {
  title: string;
  subtitle: string;
  /** Content rendered inside the dark navy card (e.g. an Image or mockup) */
  cardContent: ReactNode;
  currentStep: number; // 1-indexed
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
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <CloudHeader height={130} />

      <View style={styles.container}>
        {/* Skip */}
        {onSkip && (
          <TouchableOpacity style={styles.skipWrap} onPress={onSkip} hitSlop={12}>
            <Text style={styles.skipTxt}>Skip  ›</Text>
          </TouchableOpacity>
        )}

        {/* Heading */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Feature card */}
        <View style={styles.card}>{cardContent}</View>

        {/* Progress indicators */}
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep - 1 ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </View>

      {/* Back / Next buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.btnBack}
          onPress={onBack}
          activeOpacity={0.8}
          disabled={!onBack}
        >
          <Text style={styles.btnBackTxt}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnNext} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnNextTxt}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cloudBlue,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  /* Skip */
  skipWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    marginBottom: 8,
  },
  skipTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.indigo,
  },

  /* Heading */
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

  /* Feature card */
  card: {
    flex: 1,
    backgroundColor: Colors.indigo,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  /* Progress dots */
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    width: 60,
  },
  dotActive: {
    backgroundColor: Colors.indigo,
  },
  dotInactive: {
    backgroundColor: Colors.lightMidBlue,
  },

  /* Buttons */
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: Colors.cloudBlue,
  },
  btnBack: {
    flex: 2,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.lightMidBlue,
  },
  btnBackTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.indigo,
  },
  btnNext: {
    flex: 3,
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: Colors.indigo,
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnNextTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
});
