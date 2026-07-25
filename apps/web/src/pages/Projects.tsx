import React, { useState } from 'react';
import { useClawForgeStore, Project } from '../stores/clawforge-store.js';
import { FolderGit2, Plus, Edit3, Trash2, Check, X, Code2, Server } from 'lucide-react';

export const Projects: React.FC = () => {
  const { projects, activeProjectId, setActiveProjectId, addProject, updateProject, deleteProject } = useClawForgeStore();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit project local form state
  const [editForm, setEditForm] = useState<Partial<Project>>({});

  // Add project local form state
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    workspacePath: './workspace'
  });

  const handleStartEdit = (p: Project) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      description: p.description,
      workspacePath: p.workspacePath,
      aiModel: p.aiModel,
      agentMode: p.agentMode
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (id: string) => {
    await updateProject(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    await addProject(addForm.name, addForm.description, addForm.workspacePath);
    setAddForm({ name: '', description: '', workspacePath: './workspace' });
    setShowAddModal(false);
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Project Workspaces</h1>
          <p className="text-xs text-gray-500 mt-1">Configure active directory boundaries, assigned LLM providers, and agent modes.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter workspaces..."
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 w-full max-w-md focus-within:border-orange-500/50 outline-none"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-gray-500 bg-gray-900/40 rounded-xl border border-gray-800">
            <FolderGit2 className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-sm">No workspace projects index items found.</p>
          </div>
        ) : (
          filtered.map((p) => {
            const isEditing = editingId === p.id;
            const isActive = activeProjectId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-gray-900 border rounded-xl p-5 space-y-4 shadow-sm transition-all relative ${
                  isActive
                    ? 'border-orange-500/30 ring-1 ring-orange-500/10'
                    : 'border-gray-800 hover:border-gray-750'
                }`}
              >
                {/* Active Indicator Badge */}
                {isActive && (
                  <span className="absolute top-4 right-4 bg-orange-500/15 text-orange-400 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Active Workspace
                  </span>
                )}

                {isEditing ? (
                  /* Editing Mode Form */
                  <div className="space-y-3.5 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-semibold">Workspace Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-semibold">Description</label>
                      <input
                        type="text"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-semibold">Workspace Directory Path</label>
                      <input
                        type="text"
                        value={editForm.workspacePath || ''}
                        onChange={(e) => setEditForm({ ...editForm, workspacePath: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-gray-300 font-mono outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">AI Model</label>
                        <select
                          value={editForm.aiModel || 'mock'}
                          onChange={(e) => setEditForm({ ...editForm, aiModel: e.target.value })}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1 text-xs text-gray-300 outline-none focus:border-orange-500"
                        >
                          <option value="ollama/llama3">Ollama (Llama 3)</option>
                          <option value="openai/gpt-4o">OpenAI (GPT-4o)</option>
                          <option value="mock">Simulated Core Engine</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Agent Mode</label>
                        <select
                          value={editForm.agentMode || 'auto'}
                          onChange={(e) => setEditForm({ ...editForm, agentMode: e.target.value })}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1 text-xs text-gray-300 outline-none focus:border-orange-500"
                        >
                          <option value="auto">Autonomous (Auto)</option>
                          <option value="assisted">Assisted (Interactive)</option>
                        </select>
                      </div>
                    </div>

                    {/* Edit form actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-850">
                      <button
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-gray-200 text-[11px] font-semibold rounded flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={() => handleSaveEdit(p.id)}
                        className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold rounded flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Workspace</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Card Layout */
                  <div className="space-y-4">
                    <div className="space-y-1 pr-24">
                      <h3 className="font-semibold text-sm text-gray-100 flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-orange-500" />
                        <span>{p.name}</span>
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-1">{p.description || 'No description provided.'}</p>
                    </div>

                    {/* Meta information tags */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] pt-3 border-t border-gray-850">
                      <div className="space-y-0.5">
                        <span className="text-gray-500 font-medium uppercase tracking-wider block">Workspace Directory</span>
                        <span className="text-gray-300 font-mono block truncate">{p.workspacePath}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-gray-500 font-medium uppercase tracking-wider block">Target LLM Model</span>
                        <span className="text-gray-300 block font-mono truncate">{p.aiModel}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-gray-500 font-medium uppercase tracking-wider block">Agent Mode</span>
                        <span className="text-gray-300 block capitalize">{p.agentMode}</span>
                      </div>
                    </div>

                    {/* Card action toolbar */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-850 text-xs">
                      <button
                        onClick={() => setActiveProjectId(p.id)}
                        disabled={isActive}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          isActive
                            ? 'bg-orange-600/10 text-orange-400 cursor-default'
                            : 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                        }`}
                      >
                        {isActive ? 'Currently Active' : 'Switch Workspace'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-gray-100 rounded-lg transition-all"
                          title="Edit Workspace"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="p-1.5 bg-gray-800 hover:bg-red-950/20 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                          title="Delete Workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create project modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddProject}
            className="bg-gray-950 border border-gray-800 rounded-xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
          >
            <h3 className="font-semibold text-base text-gray-100 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-orange-500" />
              <span>Create Project Workspace</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Workspace Name</label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g. My Nextjs Dashboard"
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Description</label>
              <input
                type="text"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                placeholder="React layout with Tailwind CSS"
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Workspace Path</label>
              <input
                type="text"
                required
                value={addForm.workspacePath}
                onChange={(e) => setAddForm({ ...addForm, workspacePath: e.target.value })}
                placeholder="./workspace/dashboard"
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-200 font-mono outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded font-medium shadow-md"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
