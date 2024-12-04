import { StyleSheet } from 'react-native';
import Animated, { 
  Easing,
  interpolate,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  index: number;
  current: number;
}

export default function ScreenTransition({ children, index, current }: Props) {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = index === current;
    const translateX = interpolate(
      isActive ? 1 : 0,
      [0, 1],
      [100, 0]
    );
    
    const opacity = interpolate(
      isActive ? 1 : 0,
      [0, 1],
      [0, 1]
    );

    return {
      transform: [{ translateX }],
      opacity: withTiming(opacity, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 