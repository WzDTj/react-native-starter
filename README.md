# create-react-native-app

Create a React Native CLI project from this starter template.

```sh
npx create-react-native-app my-app
```

The initializer copies the bundled `template/` project, then renames the JavaScript, Android, and iOS app identifiers.

## Options

```sh
create-react-native-app <project-name-or-path> [options]
```

| Option | Description |
| --- | --- |
| `--yes` | Use derived defaults for missing values. |
| `--app-name <name>` | React Native module name, for example `MyApp`. |
| `--android-application-id <id>` | Optional override for the default Android namespace and applicationId. |
| `--ios-bundle-id <id>` | Optional override for the default iOS bundle identifier. |

For `my-app`, defaults are:

```txt
appName: MyApp
displayName: MyApp
androidApplicationId: com.myapp.app
iosBundleId: com.myapp.app
```

The CLI only prompts for the module name. The display name uses the same value. It does not prompt for Android/iOS identifiers, using the defaults above unless explicit override flags are passed. It also skips JavaScript dependency installation and CocoaPods installation by default, then initializes git automatically.

After generation:

```sh
cd my-app
mise install
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
npm run android
```

Version 1 supports the bundled template and npm only. It does not create Firebase projects, app icons, flavors, or extra iOS schemes.
