const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { generateProject } = require('../dist/generate.js');

async function read(projectDir, relativePath) {
  return fs.readFile(path.join(projectDir, relativePath), 'utf8');
}

test('generates a renamed React Native project from the bundled template', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'create-react-native-app-'));
  const target = path.join(root, 'my-app');

  try {
    await generateProject({
      targetDir: target,
      projectName: 'my-app',
      appName: 'MyApp',
      displayName: 'MyApp',
      androidApplicationId: 'com.example.myapp',
      iosBundleId: 'com.example.myapp',
      packageManager: 'npm',
      installDependencies: false,
      installPods: false,
      initGit: false,
    });

    assert.equal(JSON.parse(await read(target, 'package.json')).name, 'my-app');
    assert.deepEqual(JSON.parse(await read(target, 'app.json')), {
      name: 'MyApp',
      displayName: 'MyApp',
    });
    assert.match(await read(target, 'src/navigation/RootNavigator.tsx'), /title: 'MyApp'/);
    assert.match(await read(target, 'src/screens/HomeScreen.tsx'), />MyApp</);
    assert.match(await read(target, 'android/settings.gradle'), /rootProject.name = 'MyApp'/);
    assert.match(await read(target, 'android/app/build.gradle'), /namespace "com.example.myapp"/);
    assert.match(await read(target, 'android/app/build.gradle'), /applicationId "com.example.myapp"/);
    assert.match(
      await read(target, 'android/app/src/main/java/com/example/myapp/MainActivity.kt'),
      /getMainComponentName\(\): String = "MyApp"/,
    );
    assert.match(
      await read(target, 'android/app/src/main/java/com/example/myapp/MainApplication.kt'),
      /^package com\.example\.myapp/m,
    );
    assert.match(await read(target, 'android/app/src/main/res/values/strings.xml'), /MyApp/);
    assert.match(await read(target, 'ios/Podfile'), /target 'MyApp' do/);
    assert.match(await read(target, 'ios/MyApp/AppDelegate.swift'), /withModuleName: "MyApp"/);
    assert.match(await read(target, 'ios/MyApp/Info.plist'), /<string>MyApp<\/string>/);
    assert.match(await read(target, 'ios/MyApp/LaunchScreen.storyboard'), /text="MyApp"/);
    assert.match(
      await read(target, 'ios/MyApp.xcodeproj/project.pbxproj'),
      /PRODUCT_BUNDLE_IDENTIFIER = com.example.myapp;/,
    );
    assert.match(
      await read(target, 'ios/MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme'),
      /BuildableName = "MyApp.app"/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('fails before copying when target directory already has files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'create-react-native-app-'));
  const target = path.join(root, 'my-app');

  try {
    await fs.mkdir(target);
    await fs.writeFile(path.join(target, 'keep.txt'), 'user file');

    await assert.rejects(
      () =>
        generateProject({
          targetDir: target,
          projectName: 'my-app',
          appName: 'MyApp',
          displayName: 'MyApp',
          androidApplicationId: 'com.example.myapp',
          iosBundleId: 'com.example.myapp',
          packageManager: 'npm',
          installDependencies: false,
          installPods: false,
          initGit: false,
        }),
      /already exists and is not empty/,
    );

    assert.equal(await read(target, 'keep.txt'), 'user file');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('generates Android package paths when target package extends template package', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'create-react-native-app-'));
  const target = path.join(root, 'nested-app');

  try {
    await generateProject({
      targetDir: target,
      projectName: 'nested-app',
      appName: 'NestedApp',
      displayName: 'NestedApp',
      androidApplicationId: 'com.starter.nested',
      iosBundleId: 'com.example.nested',
      packageManager: 'npm',
      installDependencies: false,
      installPods: false,
      initGit: false,
    });

    assert.match(
      await read(target, 'android/app/src/main/java/com/starter/nested/MainActivity.kt'),
      /^package com\.starter\.nested/m,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
