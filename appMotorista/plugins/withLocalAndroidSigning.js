const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// InteriorGo: assinatura local configurada por config plugin';

module.exports = function withLocalAndroidSigning(config) {
  return withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    if (contents.includes(MARKER)) {
      return modConfig;
    }

    if (!contents.includes('android {')) {
      throw new Error('Nao foi possivel localizar o bloco android no build.gradle.');
    }

    const propertiesBlock = `${MARKER}
def interiorGoKeystorePropertiesFile = rootProject.file('keystore.properties')
def interiorGoKeystoreProperties = new Properties()
if (interiorGoKeystorePropertiesFile.exists()) {
    interiorGoKeystoreProperties.load(new FileInputStream(interiorGoKeystorePropertiesFile))
}
`;

    contents = contents.replace('android {', `${propertiesBlock}\nandroid {`);
    contents = contents.replace(
      /signingConfigs\s*\{\r?\n\s*debug\s*\{/,
      `signingConfigs {
        release {
            if (interiorGoKeystorePropertiesFile.exists()) {
                storeFile file(interiorGoKeystoreProperties['storeFile'])
                storePassword interiorGoKeystoreProperties['storePassword']
                keyAlias interiorGoKeystoreProperties['keyAlias']
                keyPassword interiorGoKeystoreProperties['keyPassword']
            }
        }
        debug {`,
    );
    contents = contents.replace(
      /signingConfig signingConfigs\.debug\r?\n(\s*)def enableShrinkResources/,
      'signingConfig interiorGoKeystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug\n$1def enableShrinkResources',
    );

    modConfig.modResults.contents = contents;
    return modConfig;
  });
};
