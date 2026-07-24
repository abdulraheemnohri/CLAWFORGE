import * as path from 'path';

export function assertInWorkspace(targetPath: string, workspacePath: string) {
  const resolvedWorkspace = path.resolve(workspacePath);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedWorkspace)) {
    throw new Error(`Security Violation: Path '${targetPath}' is outside the workspace '${workspacePath}'`);
  }
}
