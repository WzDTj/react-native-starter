import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GenerateOptions } from './types';

const TEMPLATE_APP_NAME = 'Starter';
const TEMPLATE_ANDROID_PACKAGE = 'com.starter';
const TEMPLATE_IOS_BUNDLE_ID = 'org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)';

export async function renameTemplate(targetDir: string, options: GenerateOptions): Promise<void> {
  await updateJson(path.join(targetDir, 'package.json'), json => {
    json.name = options.projectName;
  });
  await updateJson(path.join(targetDir, 'package-lock.json'), json => {
    json.name = options.projectName;
    if (json.packages?.['']) {
      json.packages[''].name = options.projectName;
    }
  });
  await updateJson(path.join(targetDir, 'app.json'), json => {
    json.name = options.appName;
    json.displayName = options.displayName;
  });

  await replaceInFiles(targetDir, [
    ['README.md', TEMPLATE_APP_NAME, options.displayName],
    ['src/navigation/RootNavigator.tsx', TEMPLATE_APP_NAME, options.displayName],
    ['src/screens/HomeScreen.tsx', TEMPLATE_APP_NAME, options.displayName],
    ['android/settings.gradle', TEMPLATE_APP_NAME, options.appName],
    ['android/app/build.gradle', TEMPLATE_ANDROID_PACKAGE, options.androidApplicationId],
    ['android/app/src/main/res/values/strings.xml', TEMPLATE_APP_NAME, options.displayName],
    ['android/app/src/main/java/com/starter/MainActivity.kt', TEMPLATE_ANDROID_PACKAGE, options.androidApplicationId],
    ['android/app/src/main/java/com/starter/MainActivity.kt', TEMPLATE_APP_NAME, options.appName],
    ['android/app/src/main/java/com/starter/MainApplication.kt', TEMPLATE_ANDROID_PACKAGE, options.androidApplicationId],
  ]);

  await moveAndroidPackage(targetDir, options.androidApplicationId);
  await renameIosProject(targetDir, options);
}

async function renameIosProject(targetDir: string, options: GenerateOptions): Promise<void> {
  const iosDir = path.join(targetDir, 'ios');

  await rename(path.join(iosDir, 'Starter'), path.join(iosDir, options.appName));
  await rename(path.join(iosDir, 'Starter.xcodeproj'), path.join(iosDir, `${options.appName}.xcodeproj`));
  await rename(path.join(iosDir, 'Starter.xcworkspace'), path.join(iosDir, `${options.appName}.xcworkspace`));
  await rename(
    path.join(iosDir, `${options.appName}.xcodeproj/xcshareddata/xcschemes/Starter.xcscheme`),
    path.join(iosDir, `${options.appName}.xcodeproj/xcshareddata/xcschemes/${options.appName}.xcscheme`),
  );

  await replaceInFiles(targetDir, [
    ['ios/Podfile', TEMPLATE_APP_NAME, options.appName],
    [`ios/${options.appName}/Info.plist`, TEMPLATE_APP_NAME, options.displayName],
    [`ios/${options.appName}/AppDelegate.swift`, TEMPLATE_APP_NAME, options.appName],
    [`ios/${options.appName}/LaunchScreen.storyboard`, TEMPLATE_APP_NAME, options.displayName],
    [`ios/${options.appName}.xcworkspace/contents.xcworkspacedata`, TEMPLATE_APP_NAME, options.appName],
    [`ios/${options.appName}.xcodeproj/xcshareddata/xcschemes/${options.appName}.xcscheme`, TEMPLATE_APP_NAME, options.appName],
  ]);

  const projectPath = path.join(iosDir, `${options.appName}.xcodeproj/project.pbxproj`);
  let project = await readFile(projectPath, 'utf8');
  project = project
    .replaceAll(TEMPLATE_IOS_BUNDLE_ID, options.iosBundleId)
    .replaceAll(TEMPLATE_APP_NAME, options.appName)
    .replace(/PRODUCT_BUNDLE_IDENTIFIER = "([^"]+)";/g, 'PRODUCT_BUNDLE_IDENTIFIER = $1;');
  await writeFile(projectPath, project);
}

async function moveAndroidPackage(targetDir: string, androidApplicationId: string): Promise<void> {
  const javaRoot = path.join(targetDir, 'android/app/src/main/java');
  const from = path.join(javaRoot, 'com/starter');
  const to = path.join(javaRoot, ...androidApplicationId.split('.'));
  const staging = path.join(javaRoot, `.__starter-package-${process.pid}-${Date.now()}`);

  await rename(from, staging);
  await mkdir(path.dirname(to), { recursive: true });
  await rename(staging, to);
}

async function replaceInFiles(targetDir: string, replacements: Array<[string, string, string]>): Promise<void> {
  for (const [relativePath, from, to] of replacements) {
    const filePath = path.join(targetDir, relativePath);
    const content = await readFile(filePath, 'utf8');
    await writeFile(filePath, content.replaceAll(from, to));
  }
}

async function updateJson(filePath: string, update: (json: Record<string, any>) => void): Promise<void> {
  const json = JSON.parse(await readFile(filePath, 'utf8'));
  update(json);
  await writeFile(filePath, `${JSON.stringify(json, null, 2)}\n`);
}
