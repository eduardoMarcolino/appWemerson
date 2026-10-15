const { withAndroidManifest } = require('expo/config-plugins');

module.exports = ({ config }) => withAndroidManifest(config, (modConfig) => {
  if (process.env.EAS_BUILD_PROFILE === 'preview') {
    const application = modConfig.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('Android manifest is missing the application element.');
    }

    application.$['android:usesCleartextTraffic'] = 'true';
  }

  return modConfig;
});
