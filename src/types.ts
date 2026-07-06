export type PackageManager = 'npm';

export type ResolvedOptions = {
  projectName: string;
  appName: string;
  displayName: string;
  androidApplicationId: string;
  iosBundleId: string;
  packageManager: PackageManager;
  installDependencies: boolean;
  installPods: boolean;
  initGit: boolean;
};

export type GenerateOptions = ResolvedOptions & {
  targetDir: string;
};
