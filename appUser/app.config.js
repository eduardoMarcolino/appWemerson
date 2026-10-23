const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const googleServicesFile = process.env.GOOGLE_SERVICES_FILE;
  const googleServicesPath = googleServicesFile
    ? path.resolve(__dirname, googleServicesFile)
    : null;
  const hasGoogleServicesFile = Boolean(googleServicesPath && fs.existsSync(googleServicesPath));
  const isAndroidEasBuild =
    process.env.EAS_BUILD === '1' && process.env.EAS_BUILD_PLATFORM === 'android';
  const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (googleServicesFile && !hasGoogleServicesFile) {
    console.warn(
      `Firebase config nao encontrado em ${googleServicesPath}; prebuild continuara sem Google Services/FCM.`,
    );
  }

  if (isAndroidEasBuild && !googleMapsApiKey) {
    throw new Error('Defina GOOGLE_MAPS_API_KEY no ambiente EAS antes do build Android.');
  }

  if (isAndroidEasBuild && isProductionBuild && !/^https:\/\/.+/.test(apiUrl || '')) {
    throw new Error(
      'O perfil production exige EXPO_PUBLIC_API_URL com uma URL HTTPS permanente da API.',
    );
  }

  return {
    ...config,
    android: {
      ...config.android,
      ...(hasGoogleServicesFile ? { googleServicesFile } : {}),
    },
    plugins: [
      ...(config.plugins || []),
      'expo-location',
      './plugins/withLocalAndroidSigning',
      ...(googleMapsApiKey
        ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
        : []),
    ],
  };
};
