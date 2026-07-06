import { spawn } from 'node:child_process';
import path from 'node:path';
import type { GenerateOptions } from './types';

export async function runOptionalCommands(options: GenerateOptions): Promise<void> {
  if (options.installDependencies) {
    await run('npm', ['install'], options.targetDir);
  }

  if (options.installPods) {
    const iosDir = path.join(options.targetDir, 'ios');
    await run('bundle', ['install'], iosDir);
    await run('bundle', ['exec', 'pod', 'install'], iosDir);
  }

  if (options.initGit) {
    await run('git', ['init', '--quiet'], options.targetDir);
    await run('git', ['add', '--all'], options.targetDir);
    await run(
      'git',
      [
        '-c',
        'user.name=Create React Native App',
        '-c',
        'user.email=create-react-native-app@example.invalid',
        'commit',
        '--quiet',
        '-m',
        'feat: first commit',
      ],
      options.targetDir,
    );
  }
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}
