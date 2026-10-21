const { withAndroidManifest } = require('expo/config-plugins');

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const googleServicesFile = process.env.GOOGLE_SERVICES_FILE;

  if (process.env.EAS_BUILD && process.env.EAS_BUILD_PLATFORM === 'android' && !googleMapsApiKey) {
    throw new Error('Set GOOGLE_MAPS_API_KEY in the EAS environment before building the Android app.');
  }

  const plugins = [
    ...(config.plugins || []),
    ...(googleMapsApiKey
      ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
      : []),
    'expo-location',
  ];

  const appConfig = {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    plugins,
  };

  return withAndroidManifest(appConfig, (modConfig) => {
    if (process.env.EAS_BUILD_PROFILE === 'preview') {
      const application = modConfig.modResults.manifest.application?.[0];
      if (!application) {
        throw new Error('Android manifest is missing the application element.');
      }

      application.$['android:usesCleartextTraffic'] = 'true';
    }

    return modConfig;
  });
};
