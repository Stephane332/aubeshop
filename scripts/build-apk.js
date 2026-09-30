/**
 * scripts/build-apk.js
 * ====================
 * Construit un APK Android installable, en local.
 *
 * Pourquoi un script plutôt qu'une ligne de commande : cette machine a
 * 7,7 Go de RAM, et les réglages Gradle par défaut d'Expo demandent plus
 * que ça. Les journaux de plantage trouvés à la racine du dépôt
 * (`hs_err_pid27020.log`) étaient précisément des échecs d'allocation de
 * la JVM. Le script écrit donc des réglages mémoire adaptés avant de
 * lancer la compilation.
 *
 * Usage : npm run apk
 *
 * L'APK produit est signé avec la clé de débogage, ce qui suffit pour
 * l'installer et le distribuer hors Play Store. Pour une publication sur
 * le Store, il faut une clé de production — voir la fin du fichier.
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');

function run(command, options = {}) {
  console.log(`\n$ ${command}\n`);
  execSync(command, { stdio: 'inherit', cwd: ROOT, ...options });
}

// ============================================
// 1. VÉRIFICATIONS
// ============================================

const totalGB = os.totalmem() / 1024 ** 3;
console.log(`Mémoire disponible : ${totalGB.toFixed(1)} Go`);

const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');

if (!fs.existsSync(sdk)) {
  console.error(
    `\nSDK Android introuvable (cherché dans ${sdk}).\n` +
      'Installez Android Studio, ou définissez ANDROID_HOME.'
  );
  process.exit(1);
}
console.log(`SDK Android : ${sdk}`);

// ============================================
// 2. GÉNÉRATION DU PROJET NATIF
// ============================================

// `prebuild` régénère /android à partir de app.json. Le dossier est
// gitignoré : c'est app.json qui fait foi.
run('npx expo prebuild --platform android --no-install');

// ============================================
// 3. RÉGLAGES MÉMOIRE
// ============================================

/**
 * Le tas de Gradle est calculé à partir de la RAM de la machine, en
 * laissant de la place au système et au démon Kotlin. Au-delà de 3 Go on
 * ne gagne rien pour un projet de cette taille.
 */
const heapMB = Math.min(3072, Math.max(1536, Math.floor((totalGB - 3) * 1024)));

const properties = `
# Réglages écrits par scripts/build-apk.js — adaptés à cette machine.
# Ne pas modifier à la main : le script les réécrit à chaque build.

org.gradle.jvmargs=-Xmx${heapMB}m -XX:MaxMetaspaceSize=768m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Un seul module compile à la fois : la compilation parallèle multiplie
# les JVM et c'est ce qui faisait tomber la machine.
org.gradle.parallel=false
org.gradle.workers.max=2
org.gradle.configureondemand=true
org.gradle.caching=true

# Le démon Kotlin partage la JVM de Gradle plutôt que d'en lancer une autre.
kotlin.compiler.execution.strategy=in-process
kotlin.incremental=true

android.useAndroidX=true
android.enableJetifier=false

# Une seule architecture par APK réduirait la taille, mais un APK
# universel s'installe sur n'importe quel téléphone — c'est ce qu'on veut
# pour une distribution directe.
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

newArchEnabled=true
hermesEnabled=true
expo.gif.enabled=true
expo.webp.enabled=true
expo.useLegacyPackaging=false
EXPO_USE_COMMUNITY_AUTOLINKING=false
`.trimStart();

fs.writeFileSync(path.join(ANDROID, 'gradle.properties'), properties);
console.log(`\nTas Gradle réglé à ${heapMB} Mo.`);

// `local.properties` indique à Gradle où trouver le SDK.
fs.writeFileSync(
  path.join(ANDROID, 'local.properties'),
  `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`
);

// ============================================
// 4. COMPILATION
// ============================================

// Chemin absolu : sous Windows, `gradlew.bat` seul n'est pas résolu
// puisque le répertoire courant n'est pas dans le PATH.
const gradlew = path.join(ANDROID, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

if (!fs.existsSync(gradlew)) {
  console.error(`\nWrapper Gradle introuvable : ${gradlew}`);
  process.exit(1);
}

try {
  run(`"${gradlew}" assembleRelease --no-daemon --max-workers=2`, { cwd: ANDROID });
} catch {
  console.error(
    '\nLa compilation a échoué.\n' +
      'Causes les plus fréquentes sur une machine limitée :\n' +
      '  - mémoire insuffisante : fermez les autres applications et relancez ;\n' +
      '  - SDK incomplet : ouvrez Android Studio > SDK Manager et installez\n' +
      '    les « Android SDK Build-Tools » et la plateforme Android 35.\n'
  );
  process.exit(1);
}

// ============================================
// 5. RÉCUPÉRATION DE L'APK
// ============================================

const built = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

if (!fs.existsSync(built)) {
  console.error(`\nAPK introuvable à l'emplacement attendu : ${built}`);
  process.exit(1);
}

const outDir = path.join(ROOT, 'build');
fs.mkdirSync(outDir, { recursive: true });

const version = require(path.join(ROOT, 'app.json')).expo.version;
const target = path.join(outDir, `aubeshop-${version}.apk`);
fs.copyFileSync(built, target);

const sizeMB = (fs.statSync(target).size / 1024 ** 2).toFixed(1);
console.log(`\nAPK prêt : build/aubeshop-${version}.apk  (${sizeMB} Mo)`);
console.log('\nInstallation sur un téléphone branché en USB :');
console.log(`  adb install -r "${target}"`);
console.log('\nOu transférez le fichier et ouvrez-le depuis le téléphone');
console.log('(il faut autoriser « Installer des applications inconnues »).');

console.log(
  '\nNote — cet APK est signé avec la clé de débogage : il s’installe\n' +
    'partout, mais ne peut pas être publié sur le Play Store. Pour une\n' +
    'publication, générez une clé de production puis renseignez-la dans\n' +
    'android/app/build.gradle :\n' +
    '  keytool -genkeypair -v -keystore aubeshop.keystore -alias aubeshop \\\n' +
    '    -keyalg RSA -keysize 2048 -validity 10000\n'
);
