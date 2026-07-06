const assert = require('node:assert/strict');
const test = require('node:test');

const { deriveDefaults } = require('../dist/prompts.js');
const {
  validateAndroidApplicationId,
  validateAppName,
  validateIosBundleId,
  validateProjectName,
} = require('../dist/validate.js');

test('derives starter defaults from a project name', () => {
  assert.deepEqual(deriveDefaults('my-app'), {
    projectName: 'my-app',
    appName: 'MyApp',
    displayName: 'MyApp',
    androidApplicationId: 'com.myapp.app',
    iosBundleId: 'com.myapp.app',
    packageManager: 'npm',
    installDependencies: false,
    installPods: false,
    initGit: true,
  });
});

test('validates project, module, Android, and iOS identifiers', () => {
  assert.equal(validateProjectName('my-app'), null);
  assert.match(validateProjectName('Bad Name'), /npm package/);

  assert.equal(validateAppName('MyApp'), null);
  assert.match(validateAppName('my-app'), /identifier/);

  assert.equal(validateAndroidApplicationId('com.example.myapp'), null);
  assert.match(validateAndroidApplicationId('com.1bad.app'), /Android/);

  assert.equal(validateIosBundleId('com.example.myapp'), null);
  assert.match(validateIosBundleId('com..bad'), /iOS/);
});
