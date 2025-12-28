# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Android 16 KB page-size readiness

Google Play requires all apps targeting Android 15 (API 35) or higher to ship native libraries that support 16 KB memory pages starting **November 1, 2025**. This project is configured with:

- Android Gradle Plugin **8.7.2** and Gradle **8.9**, which automatically zip-align uncompressed native libraries on 16 KB boundaries.
- Android NDK **r28** (28.0.12433566) to compile shared libraries with 16 KB ELF alignment by default.
- `expo.useLegacyPackaging=false`, so bundled `.so` files remain uncompressed and eligible for page-aligned loading.

### Build & verify checklist

1. Install Android SDK Build-Tools **35.0.0** and Android NDK **r28** (or newer) through Android Studio's SDK Manager.
2. Produce a release build (APK or AAB) and capture the output path:
   ```powershell
   cd android
   .\gradlew bundleRelease
   ```
3. Validate the ZIP alignment of native libraries at 16 KB:
   ```powershell
   & "$Env:ANDROID_HOME\build-tools\35.0.0\zipalign" -c -P 16 -v 4 path\to\app-release.apk
   ```
   The final line should report `Verification successful`.
4. Optionally confirm ELF segment alignment (requires the NDK toolchain):
   ```powershell
   & "$Env:ANDROID_HOME\ndk\28.0.12433566\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-objdump" -p path\to\lib\arm64-v8a\*.so | Select-String "align 2**14"
   ```
5. Test on a 16 KB environment. Either boot a Pixel device with the “Boot with 16KB page size” developer option (Android 15 QPR1+) or create the Android Emulator image labelled **“16 KB Page Size”**. Confirm with:
   ```powershell
   adb shell getconf PAGE_SIZE
   ```
   The output must be `16384` before installing the build.

For deeper guidance, see the official [Support 16 KB page sizes](https://developer.android.com/guide/practices/page-sizes) documentation.
