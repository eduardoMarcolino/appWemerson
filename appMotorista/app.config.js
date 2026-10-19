const { withAndroidManifest } = require('expo/config-plugins');

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const isAndroidEasBuild = process.env.EAS_BUILD && process.env.EAS_BUILD_PLATFORM === 'android';

  if (isAndroidEasBuild && !googleMapsApiKey) {
    throw new Error('Set GOOGLE_MAPS_API_KEY in the EAS environment before building the Android app.');
  }

  const plugins = [
    ...(config.plugins || []),
    'expo-location',
  ];

  return withAndroidManifest({ ...config, plugins }, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('Android manifest is missing the application element.');
    }

    application['meta-data'] ||= [];
    let mapsMetadata = application['meta-data'].find(
      (metadata) => metadata.$?.['android:name'] === 'com.google.android.geo.API_KEY',
    );

    if (!mapsMetadata) {
      mapsMetadata = { $: { 'android:name': 'com.google.android.geo.API_KEY' } };
      application['meta-data'].push(mapsMetadata);
    }

    if (googleMapsApiKey) {
      mapsMetadata.$['android:value'] = googleMapsApiKey;
    } else {
      mapsMetadata.$['android:value'] ||= '${googleMapsApiKey}';
    }

    if (process.env.EAS_BUILD_PROFILE === 'preview') {
      application.$['android:usesCleartextTraffic'] = 'true';
    }

    return modConfig;
  });
};
