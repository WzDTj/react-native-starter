# Create RN Starter CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `create-react-native-app` so it copies the bundled React Native template, renames app identifiers, and optionally installs dependencies, Pods, and git.

**Architecture:** The repository root becomes a small TypeScript CLI package. The existing React Native app moves intact under `template/`, and generation code performs explicit validation, copy, targeted text replacement, Android package directory relocation, iOS project renaming, and optional command execution.

**Tech Stack:** Node.js >=20, TypeScript, Node `readline/promises`, Node `fs`/`child_process`, Node built-in `node:test`.

---

### Task 1: Root Package And Template Layout

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `jest.config.js`
- Move: existing React Native project files into `template/`
- Create: `bin/create-react-native-app.js`

- [ ] **Step 1: Write tests that expect a root CLI build**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';

test('root package exposes the create-react-native-app bin', async () => {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
  assert.equal(pkg.name, 'create-react-native-app');
  assert.equal(pkg.bin['create-react-native-app'], './bin/create-react-native-app.js');
  assert.equal(existsSync('template/package.json'), true);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`

Expected: FAIL because the root package is still the React Native app.

- [ ] **Step 3: Move the React Native app to `template/` and rewrite root package metadata**

Root package scripts:

```json
{
  "build": "tsc -p tsconfig.json",
  "test": "npm run build && node --test tests/*.test.js"
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`

Expected: PASS for package layout checks after build is available.

### Task 2: Validation And Defaults

**Files:**
- Create: `src/validate.ts`
- Create: `src/prompts.ts`
- Test: `tests/validate.test.js`

- [ ] **Step 1: Write failing tests for derived defaults and validators**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveDefaults } from '../dist/prompts.js';
import {
  validateAndroidApplicationId,
  validateAppName,
  validateIosBundleId,
  validateProjectName,
} from '../dist/validate.js';

test('derives names and ids from a kebab project name', () => {
  assert.deepEqual(deriveDefaults('my-app'), {
    projectName: 'my-app',
    appName: 'MyApp',
    displayName: 'My App',
    androidApplicationId: 'com.myapp.app',
    iosBundleId: 'com.myapp.app',
    packageManager: 'npm',
    installDependencies: true,
    installPods: true,
    initGit: true,
  });
});

test('validates user inputs before copying', () => {
  assert.equal(validateProjectName('my-app'), null);
  assert.equal(validateProjectName('Bad Name')?.includes('npm package'), true);
  assert.equal(validateAppName('MyApp'), null);
  assert.equal(validateAppName('my-app')?.includes('identifier'), true);
  assert.equal(validateAndroidApplicationId('com.example.myapp'), null);
  assert.equal(validateAndroidApplicationId('com.1bad.app')?.includes('Android'), true);
  assert.equal(validateIosBundleId('com.example.myapp'), null);
  assert.equal(validateIosBundleId('com..bad')?.includes('iOS'), true);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test`

Expected: FAIL because `dist/prompts.js` and `dist/validate.js` do not exist.

- [ ] **Step 3: Implement minimal validators and default derivation**

Implement strict enough rules for v1: npm-style lowercase names, PascalCase app names, Java/Kotlin package segments, reverse-DNS iOS bundle IDs.

- [ ] **Step 4: Run and verify pass**

Run: `npm test`

Expected: PASS for validation/default tests.

### Task 3: Template Generation

**Files:**
- Create: `src/generate.ts`
- Create: `src/rename.ts`
- Test: `tests/generate.test.js`

- [ ] **Step 1: Write failing generation test**

```js
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { generateProject } from '../dist/generate.js';

test('generates a renamed React Native project from template', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'create-react-native-app-'));
  const target = path.join(root, 'my-app');
  try {
    await generateProject({
      targetDir: target,
      projectName: 'my-app',
      appName: 'MyApp',
      displayName: 'My App',
      androidApplicationId: 'com.example.myapp',
      iosBundleId: 'com.example.myapp',
      packageManager: 'npm',
      installDependencies: false,
      installPods: false,
      initGit: false,
    });

    assert.equal(JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8')).name, 'my-app');
    assert.equal(JSON.parse(await readFile(path.join(target, 'app.json'), 'utf8')).name, 'MyApp');
    assert.match(await readFile(path.join(target, 'android/app/build.gradle'), 'utf8'), /applicationId "com.example.myapp"/);
    assert.match(await readFile(path.join(target, 'android/app/src/main/java/com/example/myapp/MainActivity.kt'), 'utf8'), /getMainComponentName\(\): String = "MyApp"/);
    assert.match(await readFile(path.join(target, 'ios/MyApp/AppDelegate.swift'), 'utf8'), /withModuleName: "MyApp"/);
    assert.match(await readFile(path.join(target, 'ios/MyApp.xcodeproj/project.pbxproj'), 'utf8'), /PRODUCT_BUNDLE_IDENTIFIER = com.example.myapp;/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test`

Expected: FAIL because generator modules do not exist.

- [ ] **Step 3: Implement copy, replacements, Android package move, iOS renames**

Use `fs.cp`, targeted text replacement, and `fs.rename`. Fail before copying when the target directory exists and is non-empty.

- [ ] **Step 4: Run and verify pass**

Run: `npm test`

Expected: PASS and temp generated project contains renamed Android/iOS/JS files.

### Task 4: CLI Flow And Optional Commands

**Files:**
- Create: `src/cli.ts`
- Create: `src/install.ts`
- Modify: `bin/create-react-native-app.js`
- Test: `tests/cli.test.js`

- [ ] **Step 1: Write tests for CLI argument parsing and dry generation options**

Test that `npx create-react-native-app my-app --no-install --no-pods --no-git --yes` creates a project without running optional commands.

- [ ] **Step 2: Run and verify failure**

Run: `npm test`

Expected: FAIL because CLI entry implementation is absent.

- [ ] **Step 3: Implement CLI parsing, prompts, option forwarding, and final output**

Support v1 options: positional `projectName`, `--yes`, `--app-name`, `--display-name`, `--android-application-id`, `--ios-bundle-id`, `--no-install`, `--no-pods`, `--no-git`.

- [ ] **Step 4: Run and verify pass**

Run: `npm test`

Expected: PASS for CLI integration tests.

### Task 5: Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README for `npx create-react-native-app my-app`**

Document v1 behavior, flags, generated app commands, and first-version limitations.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
node bin/create-react-native-app.js /tmp/create-react-native-app-smoke --yes --no-install --no-pods --no-git
```

Expected: all commands exit 0, and smoke project contains renamed JS, Android, and iOS files.
