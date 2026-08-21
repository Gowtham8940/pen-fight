import React from 'react';
import { Text as RNText } from 'react-native';
import { scale } from '../lib/responsive';

/**
 * Emoji rendered with the SYSTEM font and a generous lineHeight.
 * Our themed <Text> forces a custom font + includeFontPadding:false, which
 * vertically clips emoji glyphs (the "half flame" bug) — use this instead.
 */
export function Emoji({ size = 20, style, children }) {
  return (
    <RNText
      allowFontScaling={false}
      style={[{ fontSize: scale(size), lineHeight: scale(size * 1.3), textAlign: 'center' }, style]}>
      {children}
    </RNText>
  );
}
