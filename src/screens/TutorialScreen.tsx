import { useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TutorialLayout from '../components/TutorialLayout';
import { Colors, FontFamily, FontSize } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Tutorial'>;
};

interface Step {
  subtitle: string;
  // Replace each require() with the actual tutorial screenshot asset
  image: ImageSourcePropType | null;
}

const STEPS: Step[] = [
  {
    subtitle: 'Dashboard Features',
    image: null, // TODO: replace with require('../assets/tutorial-dashboard.png')
  },
  {
    subtitle: 'Map & Risk Levels',
    image: null, // TODO: replace with require('../assets/tutorial-map.png')
  },
  {
    subtitle: 'Health Reports',
    image: null, // TODO: replace with require('../assets/tutorial-reports.png')
  },
  {
    subtitle: 'Self Reporting',
    image: null, // TODO: replace with require('../assets/tutorial-self-report.png')
  },
];

export default function TutorialScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // TODO: navigate to the main app (Dashboard) once that screen exists
      navigation.navigate('Landing');
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  }

  function handleSkip() {
    // TODO: navigate to the main app (Dashboard) once that screen exists
    navigation.navigate('Landing');
  }

  return (
    <TutorialLayout
      title="Tutorial"
      subtitle={current.subtitle}
      currentStep={step + 1}
      totalSteps={STEPS.length}
      onBack={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      cardContent={
        current.image ? (
          <Image source={current.image} style={styles.cardImage} resizeMode="contain" />
        ) : (
          // Placeholder until real assets are added
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTxt}>{current.subtitle}</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.lightMidBlue,
    textAlign: 'center',
  },
});
