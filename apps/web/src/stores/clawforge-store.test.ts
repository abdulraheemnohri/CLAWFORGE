import { describe, it, expect } from 'vitest';
import { useClawForgeStore } from './clawforge-store.js';

describe('Zustand store', () => {
  it('should initialize with default states and change active tab', () => {
    const state = useClawForgeStore.getState();
    expect(state.activeTab).toBe('dashboard');

    state.setActiveTab('settings');
    expect(useClawForgeStore.getState().activeTab).toBe('settings');
  });

  it('should support adding projects', () => {
    const state = useClawForgeStore.getState();
    const countBefore = state.projects.length;

    state.addProject('Test Suite Project', 'Description', './path');
    expect(useClawForgeStore.getState().projects.length).toBe(countBefore + 1);
  });
});
