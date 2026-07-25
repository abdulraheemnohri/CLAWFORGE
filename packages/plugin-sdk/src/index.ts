export interface IClawForgePlugin {
  name: string;
  version: string;
  onActivate(): void;
  onDeactivate(): void;
}

export class PluginRegistry {
  private static plugins: Map<string, IClawForgePlugin> = new Map();

  static register(plugin: IClawForgePlugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.onActivate();
    console.log(`Plugin '${plugin.name}' successfully activated.`);
  }

  static getActivePlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
