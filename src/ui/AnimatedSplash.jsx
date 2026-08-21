import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Emoji } from './Emoji';
import { PEN_IMAGES } from '../assets/images';

const { width } = Dimensions.get('window');

// Bright sky-blue to match the app icon (kept independent of light/dark theme).
const SPLASH_BG = '#38C2E8';

/**
 * Animated splash shown over the app on cold start: two pens slide in and clash
 * with a spark, then the title rises in; the whole thing fades out and calls
 * onDone. Pure JS/Reanimated — no native build needed.
 */
export function AnimatedSplash({ onDone }) {
  const leftX = useSharedValue(-width);
  const rightX = useSharedValue(width);
  const spark = useSharedValue(0);
  const titleO = useSharedValue(0);
  const titleY = useSharedValue(24);
  const rootO = useSharedValue(1);

  useEffect(() => {
    const easeBack = Easing.out(Easing.back(1.5));
    leftX.value = withDelay(150, withTiming(0, { duration: 650, easing: easeBack }));
    rightX.value = withDelay(150, withTiming(0, { duration: 650, easing: easeBack }));
    spark.value = withDelay(
      720,
      withSequence(
        withTiming(1.35, { duration: 180 }),
        withTiming(1, { duration: 160 }),
      ),
    );
    titleO.value = withDelay(900, withTiming(1, { duration: 420 }));
    titleY.value = withDelay(900, withTiming(0, { duration: 420 }));
    rootO.value = withDelay(
      2000,
      withTiming(0, { duration: 450 }, finished => {
        if (finished) runOnJS(onDone)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootO.value }));
  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }, { rotate: '-16deg' }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }, { rotate: '16deg' }],
  }));
  const sparkStyle = useAnimatedStyle(() => ({
    opacity: spark.value > 0 ? 1 : 0,
    transform: [{ scale: spark.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleO.value,
    transform: [{ translateY: titleY.value }],
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <Animated.View style={styles.sunburst} />
      <Animated.View style={styles.stage}>
        <Animated.Image source={PEN_IMAGES.classic} style={[styles.pen, leftStyle]} resizeMode="contain" />
        <Animated.Image source={PEN_IMAGES.ruby} style={[styles.pen, rightStyle]} resizeMode="contain" />
        <Animated.View style={[styles.spark, sparkStyle]} pointerEvents="none">
          <Emoji size={72}>💥</Emoji>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.titleWrap, titleStyle]}>
        <Text family="display" variant="title" color="#FFFFFF" style={styles.title}>
          Pen Fight
        </Text>
        <Text family="hand" variant="body" color="rgba(255,255,255,0.9)" style={styles.tagline}>
          the unofficial sport of the last bench
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  sunburst: {
    position: 'absolute',
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: '18%',
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  pen: { width: 70, height: 190, marginHorizontal: -6 },
  spark: { position: 'absolute', alignSelf: 'center' },
  titleWrap: { alignItems: 'center', marginTop: 24 },
  title: { textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } },
  tagline: { marginTop: 4 },
});
