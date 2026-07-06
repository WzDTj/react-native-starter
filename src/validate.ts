import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export function validateProjectName(value: string): string | null {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
    return 'projectName must be a valid npm package name using lowercase letters, numbers, dots, underscores, or hyphens.';
  }

  if (value.startsWith('.') || value.endsWith('.') || value.includes('..')) {
    return 'projectName must be a valid npm package name without leading, trailing, or repeated dots.';
  }

  return null;
}

export function validateAppName(value: string): string | null {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(value)) {
    return 'appName must be a PascalCase JavaScript identifier, for example MyApp.';
  }

  return null;
}

export function validateAndroidApplicationId(value: string): string | null {
  if (!isPackageLike(value)) {
    return 'Android applicationId must use Java/Kotlin package syntax, for example com.example.myapp.';
  }

  return null;
}

export function validateIosBundleId(value: string): string | null {
  if (!isPackageLike(value)) {
    return 'iOS bundleId must use reverse-DNS syntax, for example com.example.myapp.';
  }

  return null;
}

export async function validateTargetDirectory(targetDir: string): Promise<string | null> {
  try {
    const targetStat = await stat(targetDir);
    if (!targetStat.isDirectory()) {
      return `Target path already exists and is not a directory: ${targetDir}`;
    }

    const entries = await readdir(targetDir);
    if (entries.length > 0) {
      return `Target directory already exists and is not empty: ${targetDir}`;
    }
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  return null;
}

export function assertValidProjectConfig(config: {
  projectName: string;
  appName: string;
  androidApplicationId: string;
  iosBundleId: string;
}): void {
  const errors = [
    validateProjectName(config.projectName),
    validateAppName(config.appName),
    validateAndroidApplicationId(config.androidApplicationId),
    validateIosBundleId(config.iosBundleId),
  ].filter((error): error is string => error !== null);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

export function projectNameFromTarget(target: string): string {
  return path.basename(path.resolve(target));
}

function isPackageLike(value: string): boolean {
  const segments = value.split('.');
  return (
    segments.length >= 2 &&
    segments.every(segment => /^[A-Za-z_][A-Za-z0-9_]*$/.test(segment)) &&
    segments.every(segment => !reservedJavaWords.has(segment))
  );
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

const reservedJavaWords = new Set([
  'class',
  'enum',
  'extends',
  'import',
  'package',
  'public',
  'return',
  'static',
  'void',
]);
