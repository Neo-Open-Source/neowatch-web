export interface VersionManifest {
  build: string;
  generatedAt: string;
}

export function manifest(build: string): VersionManifest {
  return { build, generatedAt: new Date().toISOString() };
}

export function hasUpdate(manifestBuild: string, servedBuild: string): boolean {
  return manifestBuild !== "" && servedBuild !== "" && manifestBuild !== servedBuild;
}
