import { RiskLevel } from '@clawforge/shared';
import { db } from '../database/index.js';
import { approvals, auditLogs } from '../database/schema.js';

export class PermissionService {
  private static instance: PermissionService;

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  public getRiskLevel(toolName: string): RiskLevel {
    if (toolName === 'filesystem.delete' || toolName === 'git.push') {
      return 'HIGH';
    }
    if (toolName === 'terminal.run' || toolName === 'filesystem.rename' || toolName === 'filesystem.move' || toolName === 'git.checkout' || toolName === 'git.commit') {
      return 'MEDIUM';
    }
    if (toolName === 'filesystem.write' || toolName === 'filesystem.edit' || toolName === 'filesystem.copy' || toolName === 'browser.open' || toolName === 'browser.click' || toolName === 'browser.type') {
      return 'LOW';
    }
    return 'SAFE';
  }

  public async checkPermission(projectId: string, toolName: string, params: any, taskId?: string): Promise<{ allowed: boolean; approvalId?: string }> {
    const risk = this.getRiskLevel(toolName);

    // If SAFE or LOW, we execute immediately
    if (risk === 'SAFE' || risk === 'LOW') {
      await this.logAudit(projectId, toolName, 'EXECUTE', JSON.stringify(params), 'SUCCESS');
      return { allowed: true };
    }

    // For MEDIUM and HIGH (e.g. terminal.run, filesystem.delete, git.push), we need user approval!
    // We create a pending approval record in the database
    const approvalId = 'appr-' + Math.random().toString(36).substring(7);
    await db.insert(approvals).values({
      id: approvalId,
      taskId: taskId || null,
      toolName,
      params: JSON.stringify(params),
      status: 'pending',
      createdAt: new Date()
    });

    await this.logAudit(projectId, toolName, 'REQUEST_APPROVAL', JSON.stringify(params), 'PENDING', approvalId);

    return { allowed: false, approvalId };
  }

  public async logAudit(projectId: string, toolName: string, action: string, target: string, result: string, approvalId?: string) {
    await db.insert(auditLogs).values({
      id: 'audit-' + Math.random().toString(36).substring(7),
      projectId,
      toolName,
      action,
      target,
      result,
      approvalId: approvalId || null,
      createdAt: new Date()
    });
  }
}
