# create-rn-starter Design

## Background

The current repository is a React Native CLI starter project. Reusing it for new apps by copying the repository is error-prone because the project name and app identifiers are scattered across JavaScript, Android, and iOS files.

The goal is to provide an Expo-like initialization experience for personal use first, while keeping the structure suitable for future public npm release.

## Recommendation

Build a custom `create-*` CLI that copies this repository's full template and then runs explicit post-processing.

The first version should not wrap `@react-native-community/cli init --template`. This starter already includes native iOS and Android projects, Firebase/Sentry-related native settings, and project-name references in Xcode and Gradle files. A full-template copy gives the initializer direct control over those files and avoids fighting the React Native template mechanism too early.

## User Experience

The target command is:

```sh
npx create-rn-starter my-app
```

The CLI prompts for missing values:

```txt
Project name: my-app
Display name: My App
Android applicationId: com.example.myapp
iOS bundleId: com.example.myapp
Package manager: npm
Install dependencies? yes
Run pod install? yes
Initialize git? yes
```

After generation, the user should be able to run:

```sh
cd my-app
npm run ios
npm run android
```

## Repository Structure

The root repository becomes the initializer package. The existing React Native app moves under `template/`.

```txt
react-native-starter/
  package.json
  README.md
  bin/
    create-rn-starter.js
  src/
    cli.ts
    prompts.ts
    generate.ts
    rename.ts
    install.ts
    validate.ts
  template/
    package.json
    app.json
    App.tsx
    index.js
    src/
    ios/
    android/
    ...
```

This keeps the CLI implementation separate from the generated app and makes future npm publishing straightforward.

## Generation Flow

The initializer runs these stages in order:

1. Parse CLI arguments.
2. Prompt for missing options.
3. Validate project name, target directory, Android application ID, and iOS bundle ID.
4. Copy `template/` to the target directory.
5. Replace shared app-name values.
6. Rename Android package declarations and source directories.
7. Rename iOS project, workspace, scheme, target references, and bundle identifiers.
8. Remove template-only files or generated transient files when needed.
9. Install JavaScript dependencies if selected.
10. Run `bundle install` and `bundle exec pod install` if selected.
11. Initialize git if selected.
12. Print next-step commands.

Each stage should fail with a clear message. The first version does not need rollback; failed generated directories can be removed manually.

## Inputs

Required or derived values:

| Input | Example | Notes |
| --- | --- | --- |
| `projectName` | `my-app` | Directory and npm package name. |
| `appName` | `MyApp` | React Native module name; should be PascalCase and identifier-safe. |
| `displayName` | `My App` | User-visible app name. |
| `androidApplicationId` | `com.example.myapp` | Also used for Android namespace by default. |
| `iosBundleId` | `com.example.myapp` | Used for `PRODUCT_BUNDLE_IDENTIFIER`. |
| `packageManager` | `npm` | First version supports npm; other managers can be added later. |

If only `projectName` is provided, the CLI derives:

```txt
projectName: my-app
appName: MyApp
displayName: My App
androidApplicationId: com.myapp.app
iosBundleId: com.myapp.app
```

Derived IDs are editable in prompts before generation.

## Template Replacement Strategy

The first version can replace the current concrete template values:

```txt
Starter
starter
com.starter
org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)
```

Later, the template can be cleaned up to use explicit placeholders:

```txt
__APP_NAME__
__DISPLAY_NAME__
__ANDROID_PACKAGE__
__IOS_BUNDLE_ID__
```

The first implementation should prefer structured or targeted edits where practical, but plain file replacement is acceptable for known template files.

## Android Changes

The initializer updates:

```txt
android/settings.gradle
android/app/build.gradle
android/app/src/main/res/values/strings.xml
android/app/src/main/java/com/starter/MainActivity.kt
android/app/src/main/java/com/starter/MainApplication.kt
```

Required behavior:

```txt
rootProject.name = '<AppName>'
namespace "<androidApplicationId>"
applicationId "<androidApplicationId>"
package <androidApplicationId>
getMainComponentName() = "<AppName>"
app_name = <displayName>
```

It also moves:

```txt
android/app/src/main/java/com/starter
```

to the package path derived from `androidApplicationId`, for example:

```txt
android/app/src/main/java/com/example/myapp
```

## iOS Changes

The initializer updates and renames:

```txt
ios/Starter
ios/Starter.xcodeproj
ios/Starter.xcworkspace
ios/Starter.xcodeproj/xcshareddata/xcschemes/Starter.xcscheme
ios/Podfile
ios/Starter/Info.plist
ios/Starter/AppDelegate.swift
ios/Starter/LaunchScreen.storyboard
ios/Starter.xcodeproj/project.pbxproj
```

Required behavior:

```txt
Podfile target becomes <AppName>
workspace and xcodeproj names become <AppName>
scheme name becomes <AppName>
PRODUCT_NAME becomes <AppName>
PRODUCT_BUNDLE_IDENTIFIER becomes <iosBundleId>
CFBundleDisplayName becomes <displayName>
AppDelegate module name becomes <AppName>
LaunchScreen label becomes <displayName>
```

The first version uses targeted string replacement and file renames. It does not introduce an Xcode project parser unless string replacement proves unreliable.

## JavaScript Changes

The initializer updates:

```txt
package.json
package-lock.json
app.json
index.js
src/navigation/RootNavigator.tsx
src/screens/HomeScreen.tsx
README.md
```

Required behavior:

```txt
package name becomes projectName
app.json name becomes appName
app.json displayName becomes displayName
registered component name becomes appName
visible starter UI copy becomes displayName or appName as appropriate
README reflects the generated project
```

## Out Of Scope For Version 1

Version 1 does not include:

```txt
multiple templates
remote template downloads
plugin architecture
React Native CLI template wrapping
automatic Firebase project file generation
automatic app icon or splash generation
Android flavors
environment-specific iOS schemes
automatic npm publishing
```

These can be added after the basic initializer is reliable.

## Error Handling

The CLI should fail before copying when:

```txt
the target directory already exists and is not empty
projectName is not a valid npm package name
appName is not a valid React Native module identifier
androidApplicationId is not a valid Java/Kotlin package style ID
iosBundleId is not a valid reverse-DNS style bundle ID
```

The CLI should fail during generation with a stage-specific message, for example:

```txt
Failed while renaming iOS project files.
```

The first version does not need to automatically revert partially generated projects.

## Verification

For a generated test app, run:

```sh
npm install
npm test
npm run lint
cd ios && bundle exec pod install
cd ../android && ./gradlew tasks
```

When simulator/device setup is available, also run:

```sh
npm run ios
npm run android
```

The initializer is considered successful when the generated project has no remaining unintended `Starter` or `com.starter` references and the verification commands pass.

## Implementation Order

1. Move the current React Native app into `template/`.
2. Create the CLI package entry point and command parser.
3. Add prompts and input validation.
4. Implement template copying.
5. Implement JavaScript and shared text replacements.
6. Implement Android package renaming.
7. Implement iOS project renaming.
8. Add a local generated-project verification workflow.
9. Update README with usage and development instructions.

## Future Direction

After the custom CLI is stable, evaluate whether part of the template should become a React Native CLI template. That migration is useful only if the starter stays close enough to the standard React Native project structure that official `init --template` reduces maintenance instead of increasing post-processing work.
