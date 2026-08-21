import { Platform } from 'react-native';

/**
 * App status flags. Local placeholders for now — later wire these to Firebase
 * Remote Config (fetch on launch and merge over these defaults) so you can flip
 * maintenance / force an update without shipping a build.
 *
 * - maintenance: when true, the app shows the full-screen maintenance notice.
 * - update.available: when true, an "Update available" popup shows on launch.
 * - update.required: when true, the popup can't be skipped (force update).
 * - update.version: the offered version; a skipped version is remembered so the
 *   popup doesn't nag again until a newer version is offered.
 */
export const APP_STATUS = {
  maintenance: false,

  update: {
    available: false,
    required: false,
    version: '1.1.0',
    storeUrl: Platform.select({
      ios: 'https://apps.apple.com/app/id0000000000',
      android: 'https://play.google.com/store/apps/details?id=com.penfight',
      default: 'https://play.google.com/store/apps/details?id=com.penfight',
    }),
  },
};
