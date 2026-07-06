import path from 'node:path';
import { generateProject } from './generate';
import { resolveOptions } from './prompts';
import type { PromptInput } from './prompts';
import { projectNameFromTarget } from './validate';

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseArgs(argv);
  if (!parsed.target) {
    throw new Error('Usage: create-react-native-app <project-name-or-path> [options]');
  }

  const targetDir = path.resolve(process.cwd(), parsed.target);
  const projectName = projectNameFromTarget(parsed.target);
  const options = await resolveOptions({
    projectName,
    yes: parsed.yes,
    appName: parsed.appName,
    androidApplicationId: parsed.androidApplicationId,
    iosBundleId: parsed.iosBundleId,
  });

  if (options.packageManager !== 'npm') {
    throw new Error('Version 1 only supports npm.');
  }

  await generateProject({
    ...options,
    targetDir,
  });

  console.log(`Created ${options.displayName} at ${targetDir}`);
  console.log('');
  console.log(`cd ${path.relative(process.cwd(), targetDir) || targetDir}`);
  console.log('npm run ios');
  console.log('npm run android');
}

type ParsedArgs = {
  target?: string;
  yes?: boolean;
  appName?: string;
  androidApplicationId?: string;
  iosBundleId?: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('-') && !parsed.target) {
      parsed.target = arg;
      continue;
    }

    switch (arg) {
      case '--yes':
      case '-y':
        parsed.yes = true;
        break;
      case '--app-name':
        parsed.appName = readValue(argv, (index += 1), arg);
        break;
      case '--android-application-id':
        parsed.androidApplicationId = readValue(argv, (index += 1), arg);
        break;
      case '--ios-bundle-id':
        parsed.iosBundleId = readValue(argv, (index += 1), arg);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function readValue(argv: string[], index: number, option: string): string {
  const value = argv[index];
  if (!value || value.startsWith('-')) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}
