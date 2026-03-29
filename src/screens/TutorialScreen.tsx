import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TutorialLayout from '../components/TutorialLayout';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Tutorial'>;
};

interface Step {
  subtitle: string;
  body: string;
  video: number;
}

const STEPS: Step[] = [
  {
    subtitle: 'Dashboard Features',
    body: 'Get a real-time snapshot of health activity in your area. See outbreak risk levels, active alerts, and a summary of local signals — all in one place.',
    video: require('../assets/tutorial/home.MOV'),
  },
  {
    subtitle: 'Map & Risk Levels',
    body: 'Explore an interactive map showing risk zones near you. Color-coded areas help you quickly spot high-risk neighborhoods before heading out.',
    video: require('../assets/tutorial/map.MOV'),
  },
  {
    subtitle: 'Health Reports',
    body: 'Read AI-generated health advisories tailored to your location. Get plain-language guidance on what to watch for and how to stay safe.',
    video: require('../assets/tutorial/advice.MOV'),
  },
];

function TutorialVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.videoWrap}>
      <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} />
    </View>
  );
}

export default function TutorialScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      navigation.navigate('Dashboard');
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
      body={current.body}
      cardContent={<TutorialVideo key={step} source={current.video} />}
    />
  );
}

const styles = StyleSheet.create({
  videoWrap: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
