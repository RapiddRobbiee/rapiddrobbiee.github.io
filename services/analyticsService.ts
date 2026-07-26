// Fix: Changed imports to use namespaces to resolve "no exported member" errors.
import * as analytics from 'firebase/analytics';
// Fix: Use a namespace import to correctly resolve the FirebaseApp type.
import type { FirebaseApp } from 'firebase/app';

let analyticsInstance: analytics.Analytics | undefined;

export const initializeAnalytics = (appInstance: FirebaseApp): void => {
  if (
    appInstance &&
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  ) {
    // Analytics relies on browser APIs that are unavailable in tests,
    // privacy-focused browsers, and some embedded webviews. Check support
    // before calling getAnalytics so auth and patch editing still work.
    void analytics.isSupported().then((supported) => {
      if (!supported) {
        analyticsInstance = undefined;
        return;
      }
      try {
        analyticsInstance = analytics.getAnalytics(appInstance);
        console.log('Firebase Analytics initialized successfully.');
      } catch (error) {
        console.error('Firebase Analytics initialization error:', error);
        analyticsInstance = undefined;
      }
    });
  } else {
    if (!appInstance) {
      console.warn(
        'Firebase App instance not provided to initialize Analytics. Analytics will be disabled.'
      );
    }
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      console.warn('Firebase API Key missing. Analytics will be disabled.');
    }
    if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      console.warn('Firebase Measurement ID missing. Analytics will be disabled.');
    }
    analyticsInstance = undefined;
  }
};

export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>): void => {
  if (analyticsInstance) {
    // Fix: Use namespace import for logEvent
    analytics.logEvent(analyticsInstance, eventName, eventParams);
  } else {
    // console.log(`Analytics disabled: Event '${eventName}' not logged. Params:`, eventParams);
  }
};

export const setAnalyticsUserId = (userId: string | null): void => {
  if (analyticsInstance) {
    // Fix: Use namespace import for setUserId
    analytics.setUserId(analyticsInstance, userId || ''); // Use empty string to clear
  }
};
