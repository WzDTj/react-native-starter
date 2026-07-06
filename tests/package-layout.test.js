const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('root package exposes the create-react-native-app CLI package layout', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

  assert.equal(pkg.name, 'create-react-native-app');
  assert.equal(pkg.private, false);
  assert.equal(pkg.bin['create-react-native-app'], './bin/create-react-native-app.js');
  assert.equal(fs.existsSync(path.join(process.cwd(), 'bin/create-react-native-app.js')), true);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'template/package.json')), true);
});
