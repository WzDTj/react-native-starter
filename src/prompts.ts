import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { ResolvedOptions } from './types';

export type PromptInput = Partial<ResolvedOptions> & {
  yes?: boolean;
};

export function deriveDefaults(projectName: string): ResolvedOptions {
  const words = projectName
    .replace(/^@[^/]+\//, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const pascal = words.map(toPascalPart).join('') || 'App';
  const idSegment = words.join('').toLowerCase() || 'app';

  return {
    projectName,
    appName: pascal,
    displayName: pascal,
    androidApplicationId: `com.${idSegment}.app`,
    iosBundleId: `com.${idSegment}.app`,
    packageManager: 'npm',
    installDependencies: false,
    installPods: false,
    initGit: true,
  };
}

export async function resolveOptions(inputOptions: PromptInput): Promise<ResolvedOptions> {
  if (!inputOptions.projectName) {
    throw new Error('projectName is required.');
  }

  const defaults = deriveDefaults(inputOptions.projectName);
  const merged: ResolvedOptions = {
    ...defaults,
    ...definedOnly(inputOptions),
    packageManager: 'npm',
  };

  if (inputOptions.yes) {
    return merged;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const appName = await ask(rl, '应用模块名', merged.appName);
    return {
      projectName: merged.projectName,
      appName,
      displayName: appName,
      androidApplicationId: merged.androidApplicationId,
      iosBundleId: merged.iosBundleId,
      packageManager: merged.packageManager,
      installDependencies: false,
      installPods: false,
      initGit: true,
    };
  } finally {
    rl.close();
  }
}

function toPascalPart(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

async function ask(rl: readline.Interface, label: string, defaultValue: string): Promise<string> {
  const answer = await rl.question(`${label}: ${defaultValue} `);
  return answer.trim() || defaultValue;
}

function definedOnly<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}
