/** URL de Play Store cuando la app TWA esté publicada. */
export const ANDROID_APP_URL =
  import.meta.env.VITE_ANDROID_APP_URL ||
  'https://play.google.com/store/apps/details?id=com.ososound.app';

export const ANDROID_APP_PACKAGE = 'com.ososound.app';

/** Solo true cuando la app ya está publicada en Play Store. */
export const ANDROID_APP_PUBLISHED = import.meta.env.VITE_ANDROID_APP_PUBLISHED === 'true';

export const ANDROID_BANNER_DISMISS_KEY = 'ososound_android_banner_dismissed_until';
