import { ToolRegistry } from './registry.js';
import * as fsTools from './filesystem.js';
import * as terminalTools from './terminal.js';
import * as gitTools from './git.js';
import * as browserTools from './browser.js';

export function initTools() {
  const registry = ToolRegistry.getInstance();

  // Filesystem
  registry.registerTool(fsTools.listTool);
  registry.registerTool(fsTools.searchTool);
  registry.registerTool(fsTools.readTool);
  registry.registerTool(fsTools.writeTool);
  registry.registerTool(fsTools.editTool);
  registry.registerTool(fsTools.renameTool);
  registry.registerTool(fsTools.copyTool);
  registry.registerTool(fsTools.moveTool);
  registry.registerTool(fsTools.deleteTool);

  // Terminal
  registry.registerTool(terminalTools.terminalRunTool);

  // Git
  registry.registerTool(gitTools.gitStatusTool);
  registry.registerTool(gitTools.gitDiffTool);
  registry.registerTool(gitTools.gitLogTool);
  registry.registerTool(gitTools.gitBranchTool);
  registry.registerTool(gitTools.gitCheckoutTool);
  registry.registerTool(gitTools.gitCommitTool);
  registry.registerTool(gitTools.gitPushTool);

  // Browser
  registry.registerTool(browserTools.browserOpenTool);
  registry.registerTool(browserTools.browserNavigateTool);
  registry.registerTool(browserTools.browserClickTool);
  registry.registerTool(browserTools.browserTypeTool);
  registry.registerTool(browserTools.browserScrollTool);
  registry.registerTool(browserTools.browserScreenshotTool);
  registry.registerTool(browserTools.browserExtractTool);
}
export { shutdownBrowser } from './browser.js';
export { ToolRegistry } from './registry.js';
export { assertInWorkspace } from './filesystem-helper.js';
