import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { runOptionalCommands } from './install';
import { renameTemplate } from './rename';
import type { GenerateOptions } from './types';
import { assertValidProjectConfig, validateTargetDirectory } from './validate';

export async function generateProject(options: GenerateOptions): Promise<void> {
  assertValidProjectConfig(options);

  const targetError = await validateTargetDirectory(options.targetDir);
  if (targetError) {
    throw new Error(targetError);
  }

  await mkdir(path.dirname(options.targetDir), { recursive: true });
  await cp(templateDir(), options.targetDir, {
    recursive: true,
    force: false,
    errorOnExist: true,
  });
  await renameTemplate(options.targetDir, options);
  await runOptionalCommands(options);
}

export function templateDir(): string {
  return path.resolve(__dirname, '../template');
}
