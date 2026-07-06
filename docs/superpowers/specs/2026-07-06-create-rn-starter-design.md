# create-rn-starter 设计方案

## 背景

当前仓库是一个 React Native CLI starter 项目。每次新建项目都通过复制仓库来复用模板，容易遗漏修改点，因为项目名和应用标识分散在 JavaScript、Android、iOS 多处文件中。

目标是提供一个类似 Expo 的初始化体验：先满足个人使用，同时保留未来公开发布到 npm 的结构空间。

## 推荐方案

构建一个自定义 `create-*` CLI：复制当前仓库的完整模板，然后执行明确的后处理。

第一版不包装 `@react-native-community/cli init --template`。当前 starter 已经包含 iOS 和 Android 原生工程、Firebase/Sentry 相关原生配置，以及 Xcode/Gradle 中的项目名引用。完整复制模板可以让初始化器直接控制这些文件，避免过早受 React Native template 机制限制。

## 使用体验

目标命令：

```sh
npx create-rn-starter my-app
```

CLI 对缺失信息进行交互式提示：

```txt
项目名: my-app
应用显示名: My App
Android applicationId: com.example.myapp
iOS bundleId: com.example.myapp
包管理器: npm
是否安装依赖: yes
是否执行 pod install: yes
是否初始化 git: yes
```

生成完成后，用户可以直接运行：

```sh
cd my-app
npm run ios
npm run android
```

## 仓库结构

仓库根目录改为初始化工具包，现有 React Native 应用移动到 `template/` 下。

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

这样可以把 CLI 实现和生成出来的应用模板分开，也方便以后公开发布到 npm。

## 生成流程

初始化器按以下阶段执行：

1. 解析 CLI 参数。
2. 对缺失选项进行交互式提示。
3. 校验项目名、目标目录、Android applicationId、iOS bundleId。
4. 将 `template/` 复制到目标目录。
5. 替换通用应用名称。
6. 重命名 Android package 声明和源码目录。
7. 重命名 iOS project、workspace、scheme、target 引用和 bundle identifier。
8. 按需清理模板专用文件或临时生成文件。
9. 如果用户选择安装依赖，则安装 JavaScript 依赖。
10. 如果用户选择安装 iOS 依赖，则执行 `bundle install` 和 `bundle exec pod install`。
11. 如果用户选择初始化 git，则执行 `git init`。
12. 输出后续运行命令。

每个阶段失败时都应该给出清晰错误信息。第一版不需要自动回滚，失败后生成目录可以手动删除。

## 输入项

必填或可推导的值：

| 输入 | 示例 | 说明 |
| --- | --- | --- |
| `projectName` | `my-app` | 目标目录名和 npm package name。 |
| `appName` | `MyApp` | React Native module name，应该是 PascalCase 且可作为标识符。 |
| `displayName` | `My App` | 用户可见的应用名称。 |
| `androidApplicationId` | `com.example.myapp` | 默认同时用于 Android namespace。 |
| `iosBundleId` | `com.example.myapp` | 用于 `PRODUCT_BUNDLE_IDENTIFIER`。 |
| `packageManager` | `npm` | 第一版只支持 npm，其他包管理器后续再加。 |

如果用户只提供 `projectName`，CLI 默认推导：

```txt
projectName: my-app
appName: MyApp
displayName: My App
androidApplicationId: com.myapp.app
iosBundleId: com.myapp.app
```

推导出来的 ID 会在生成前通过提示允许用户修改。

## 模板替换策略

第一版可以直接替换当前模板中的具体值：

```txt
Starter
starter
com.starter
org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)
```

后续可以逐步把模板整理成显式占位符：

```txt
__APP_NAME__
__DISPLAY_NAME__
__ANDROID_PACKAGE__
__IOS_BUNDLE_ID__
```

第一版实现时，能用结构化或定向编辑的地方优先使用；对已知模板文件，使用普通文本替换是可以接受的。

## Android 修改点

初始化器需要更新：

```txt
android/settings.gradle
android/app/build.gradle
android/app/src/main/res/values/strings.xml
android/app/src/main/java/com/starter/MainActivity.kt
android/app/src/main/java/com/starter/MainApplication.kt
```

需要达成的结果：

```txt
rootProject.name = '<AppName>'
namespace "<androidApplicationId>"
applicationId "<androidApplicationId>"
package <androidApplicationId>
getMainComponentName() = "<AppName>"
app_name = <displayName>
```

同时把目录：

```txt
android/app/src/main/java/com/starter
```

移动到由 `androidApplicationId` 推导出来的 package 路径，例如：

```txt
android/app/src/main/java/com/example/myapp
```

## iOS 修改点

初始化器需要更新并重命名：

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

需要达成的结果：

```txt
Podfile target 改为 <AppName>
workspace 和 xcodeproj 名称改为 <AppName>
scheme 名称改为 <AppName>
PRODUCT_NAME 改为 <AppName>
PRODUCT_BUNDLE_IDENTIFIER 改为 <iosBundleId>
CFBundleDisplayName 改为 <displayName>
AppDelegate module name 改为 <AppName>
LaunchScreen label 改为 <displayName>
```

第一版使用定向字符串替换和文件重命名。除非字符串替换被验证为不可靠，否则不引入 Xcode project 解析库。

## JavaScript 修改点

初始化器需要更新：

```txt
package.json
package-lock.json
app.json
index.js
src/navigation/RootNavigator.tsx
src/screens/HomeScreen.tsx
README.md
```

需要达成的结果：

```txt
package name 改为 projectName
app.json name 改为 appName
app.json displayName 改为 displayName
注册的组件名改为 appName
可见的 starter UI 文案按场景改为 displayName 或 appName
README 反映生成后的项目
```

## 第一版不做的事

Version 1 不包含：

```txt
多模板选择
远程模板下载
插件架构
包装 React Native CLI template
自动生成 Firebase 项目配置文件
自动生成 app icon 或 splash
Android flavors
按环境生成 iOS schemes
自动发布 npm
```

这些功能可以等基础初始化器稳定后再添加。

## 错误处理

以下情况应该在复制模板前失败：

```txt
目标目录已存在且非空
projectName 不是合法 npm package name
appName 不是合法 React Native module identifier
androidApplicationId 不是合法 Java/Kotlin package 风格 ID
iosBundleId 不是合法 reverse-DNS 风格 bundle ID
```

生成过程中失败时，CLI 应该给出阶段性错误，例如：

```txt
iOS project 文件重命名失败。
```

第一版不需要自动回滚部分生成的项目。

## 验证方式

对生成出来的测试应用执行：

```sh
npm install
npm test
npm run lint
cd ios && bundle exec pod install
cd ../android && ./gradlew tasks
```

如果本机模拟器或设备环境可用，再执行：

```sh
npm run ios
npm run android
```

当生成项目中没有非预期残留的 `Starter` 或 `com.starter` 引用，并且验证命令通过时，初始化器视为成功。

## 实施顺序

1. 将当前 React Native 应用移动到 `template/`。
2. 创建 CLI package 入口和命令解析。
3. 添加交互式提示和输入校验。
4. 实现模板复制。
5. 实现 JavaScript 和通用文本替换。
6. 实现 Android package 重命名。
7. 实现 iOS project 重命名。
8. 添加本地生成项目的验证流程。
9. 更新 README，说明使用方式和开发方式。

## 后续方向

自定义 CLI 稳定后，再评估是否把部分模板转成 React Native CLI template。只有当 starter 足够接近标准 React Native 项目结构，并且官方 `init --template` 能降低维护成本而不是增加后处理复杂度时，这个迁移才值得做。
