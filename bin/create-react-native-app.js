#!/usr/bin/env node

const { runCli } = require('../dist/cli.js');

runCli().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`create-react-native-app: ${message}`);
  process.exitCode = 1;
});
