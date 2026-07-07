const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const test = require('node:test');

const execFileAsync = promisify(execFile);

test('CLI creates a project with yes-mode, skips installs, and initializes git', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'create-react-native-app-cli-'));
  const target = path.join(root, 'demo-app');

  try {
    const result = await execFileAsync('node', [
      'bin/create-react-native-app.js',
      target,
      '--yes',
      '--app-name',
      'DemoApp',
      '--android-application-id',
      'com.example.demo',
      '--ios-bundle-id',
      'com.example.demo',
    ]);

    assert.match(result.stdout, /Created DemoApp/);
    assert.match(result.stdout, /mise install/);
    assert.doesNotMatch(result.stdout, /mise trust/);
    assert.doesNotMatch(result.stdout, /mise run/);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(target, 'app.json'), 'utf8')), {
      name: 'DemoApp',
      displayName: 'DemoApp',
    });
    await fs.access(path.join(target, '.git'));
    const status = await execFileAsync('git', ['status', '--short'], { cwd: target });
    assert.equal(status.stdout, '');
    const log = await execFileAsync('git', ['log', '--oneline', '--decorate=no'], { cwd: target });
    assert.deepEqual(
      log.stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => line.replace(/^[0-9a-f]+ /, '')),
      ['feat: first commit'],
    );
    await assert.rejects(() => fs.access(path.join(target, 'node_modules')), /ENOENT/);
    await assert.rejects(() => fs.access(path.join(target, 'ios/Pods')), /ENOENT/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('CLI rejects unknown arguments', async () => {
  const result = await execFileAsync('node', ['bin/create-react-native-app.js', 'demo-app', '--unknown-option']).catch(
    error => error,
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown argument: --unknown-option/);
});
