import { useEffect, useState } from 'react';
import { Image as RNImage } from 'react-native';
import { Skia } from '@shopify/react-native-skia';
import { DESK_SURFACE, PEN_IMAGES } from './images';

/**
 * Process-wide cache of decoded Skia images.
 *
 * Skia's own `useImage` re-reads and re-decodes the file on every mount and
 * keeps nothing, so opening the game screen used to sit on an empty desk for
 * about a second while the surface PNG decoded — every single time. These
 * helpers decode once, keep the SkImage, and hand it back synchronously
 * afterwards, so the board is on screen the moment the screen mounts.
 */
const decoded = new Map(); // source -> SkImage
const inFlight = new Map(); // source -> Promise<SkImage | null>

/** Decode `source` (a require()'d asset or a URI) into the cache. */
export function preloadSkImage(source) {
  if (!source) return Promise.resolve(null);
  if (decoded.has(source)) return Promise.resolve(decoded.get(source));
  if (inFlight.has(source)) return inFlight.get(source);

  const uri =
    typeof source === 'string' ? source : RNImage.resolveAssetSource(source)?.uri;
  if (!uri) return Promise.resolve(null);

  const task = Skia.Data.fromURI(uri)
    .then(data => Skia.Image.MakeImageFromEncoded(data))
    .then(image => {
      if (image) decoded.set(source, image);
      inFlight.delete(source);
      return image ?? null;
    })
    .catch(() => {
      inFlight.delete(source);
      return null;
    });

  inFlight.set(source, task);
  return task;
}

/** The decoded image if it's already cached, else null. Never suspends. */
export function getSkImage(source) {
  return source ? decoded.get(source) ?? null : null;
}

/**
 * Drop-in replacement for Skia's `useImage` that reads the cache first, so a
 * preloaded asset is available on the very first render — no empty frame.
 */
export function useSkImage(source) {
  const [image, setImage] = useState(() => getSkImage(source));

  useEffect(() => {
    const cached = getSkImage(source);
    if (cached) {
      setImage(cached);
      return undefined;
    }
    let alive = true;
    preloadSkImage(source).then(result => {
      if (alive) setImage(result);
    });
    return () => {
      alive = false;
    };
  }, [source]);

  return image;
}

/**
 * Warm the desk + every pen sprite. Called once at app start so the decode
 * happens behind the splash instead of in front of the player.
 */
export function preloadGameImages() {
  return Promise.all([
    preloadSkImage(DESK_SURFACE),
    ...Object.values(PEN_IMAGES).map(preloadSkImage),
  ]);
}
