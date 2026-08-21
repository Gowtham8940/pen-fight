import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Emoji } from './Emoji';
import { PEN_IMAGES } from '../assets/images';

// 'screen' (not 'window') so we cover the full device incl. status/nav bars.
const { width, height } = Dimensions.get('screen');

const SPLASH_BG = '#38C2E8';
const PEN_W = Math.min(width * 0.26, 118);
const PEN_H = PEN_W * 2.9;

/**
 * Animated splash: two big pens fly in from the top corners and clash with a
 * spark + flash + shake, then the title springs in. Fades out and calls onDone.
 * Pure JS/Reanimated.
 */
export function AnimatedSplash({ onDone }) {
  const leftX = useSharedValue(-width);
  const leftY = useSharedValue(-height * 0.5);
  const rightX = useSharedValue(width);
  const rightY = useSharedValue(-height * 0.5);
  const spark = useSharedValue(0);
  const flash = useSharedValue(0);
  const shake = useSharedValue(0);
  const titleS = useSharedValue(0.6);
  const titleO = useSharedValue(0);
  const rootO = useSharedValue(1);

  useEffect(() => {
    const IN = { duration: 620, easing: Easing.out(Easing.back(1.8)) };
    leftX.value = withDelay(150, withTiming(0, IN));
    leftY.value = withDelay(150, withTiming(0, IN));
    rightX.value = withDelay(150, withTiming(0, IN));
    rightY.value = withDelay(150, withTiming(0, IN));

    // Clash ~770ms in: spark pop, white flash, quick shake.
    spark.value = withDelay(
      770,
      withSequence(withTiming(1.4, { duration: 170 }), withTiming(1, { duration: 160 })),
    );
    flash.value = withDelay(
      770,
      withSequence(withTiming(0.65, { duration: 90 }), withTiming(0, { duration: 260 })),
    );
    shake.value = withDelay(
      770,
      withSequence(
        withTiming(-10, { duration: 45 }),
        withRepeat(withTiming(10, { duration: 70 }), 4, true),
        withTiming(0, { duration: 60 }),
      ),
    );

    // Title springs in after the clash.
    titleO.value = withDelay(950, withTiming(1, { duration: 360 }));
    titleS.value = withDelay(950, withSpring(1, { damping: 9, stiffness: 150 }));

    rootO.value = withDelay(
      2350,
      withTiming(0, { duration: 480 }, finished => {
        if (finished) runOnJS(onDone)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootO.value }));
  const stageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }, { translateY: leftY.value }, { rotate: '-16deg' }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }, { translateY: rightY.value }, { rotate: '16deg' }],
  }));
  const sparkStyle = useAnimatedStyle(() => ({
    opacity: spark.value > 0 ? 1 : 0,
    transform: [{ scale: spark.value }, { rotate: `${spark.value * 40}deg` }],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: 0.6 + flash.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleO.value,
    transform: [{ scale: titleS.value }],
  }));

  return (
    <Animated.View style={[styles.root, { width, height }, rootStyle]}>
      <Animated.View style={styles.sunburst} />
      <Animated.View style={[styles.stage, stageStyle]}>
        <Animated.Image source={PEN_IMAGES.classic} style={[styles.pen, styles.penLeft, leftStyle]} resizeMode="contain" />
        <Animated.Image source={PEN_IMAGES.ruby} style={[styles.pen, styles.penRight, rightStyle]} resizeMode="contain" />
        <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
        <Animated.View style={[styles.spark, sparkStyle]} pointerEvents="none">
          <Emoji size={96}>💥</Emoji>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.titleWrap, titleStyle]}>
        <Text family="display" variant="title" color="#FFFFFF" style={styles.title}>
          Pen Fight
        </Text>
        <Text family="hand" variant="body" color="rgba(255,255,255,0.92)" style={styles.tagline}>
          the unofficial sport of the last bench
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  sunburst: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  stage: { width: PEN_W * 2.2, height: PEN_H + 40, alignItems: 'center', justifyContent: 'center' },
  pen: { width: PEN_W, height: PEN_H, position: 'absolute' },
  penLeft: { right: '50%', marginRight: -PEN_W * 0.28 },
  penRight: { left: '50%', marginLeft: -PEN_W * 0.28 },
  flash: {
    position: 'absolute',
    width: PEN_W * 1.6,
    height: PEN_W * 1.6,
    borderRadius: PEN_W * 0.8,
    backgroundColor: '#FFF7D6',
  },
  spark: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { position: 'absolute', bottom: height * 0.16, alignItems: 'center' },
  title: { textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } },
  tagline: { marginTop: 4 },
});
