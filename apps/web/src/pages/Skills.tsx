import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Award, Plus, Check, Star, Trash2, Power, BookOpen, Terminal, Sparkles } from 'lucide-react';

export const Skills: React.FC = () => {
  const { skills, fetchSkills, addSkill, toggleSkill, deleteSkill } = useClawForgeStore();
  const [title, setTitle] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [desc, setDesc] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pkgName) return;
    await addSkill(title, pkgName, desc, '1.0.0');
    setTitle('');
    setPkgName('');
    setDesc('');
    setInstructions('');
  };

  const selectedSkill = skills.find(s => s.id === selectedSkillId) || skills[0];

  const marketplaceSkills = [
    { title: 'Security Analyst', pkg: '@clawforge/skill-security-analyst', desc: 'Runs vulnerability scans, package audits, and security checklist compliance audits.', ver: '2.0.0' },
    { title: 'DevOps Engineer', pkg: '@clawforge/skill-devops-eng', desc: 'Drafts Dockerfiles, configures GitHub Actions files, and monitors server build deployments.', ver: '1.4.1' },
    { title: 'Android Developer', pkg: '@clawforge/skill-android-dev', desc: 'Expertise in Kotlin, Android SDK build environments, Gradle scripts, and Espresso tests.', ver: '1.0.0' },
    { title: 'Research Assistant', pkg: '@clawforge/skill-research-assistant', desc: 'Collects literature, parses documents, and generates comprehensive scientific summaries.', ver: '1.1.0' }
  ];

  const installMarketplace = async (item: typeof marketplaceSkills[0]) => {
    if (skills.some(s => s.packageName === item.pkg)) return;
    await addSkill(item.title, item.pkg, item.desc, item.ver);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            Skill Packages Store
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Install and enable specialized system prompts and package toolsets to upgrade ClawForge capability.
          </p>
        </div>
        <div className="px-3 py-1 bg-orange-600/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
          <span>Extensible Runtime v2</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Installed Skills */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-md font-semibold text-gray-200 mb-4 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-orange-500" />
              Installed Skills ({skills.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => {
                const tools = skill.skillJson ? JSON.parse(skill.skillJson).tools || [] : [];
                const isSelected = selectedSkill && selectedSkill.id === skill.id;

                return (
                  <div
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gray-800/60 border-orange-500/50 shadow-md'
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-gray-100 block">{skill.title}</span>
                        <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{skill.packageName}</span>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Power Switch */}
                        <button
                          onClick={() => toggleSkill(skill.id, !skill.enabled)}
                          className={`p-1 rounded transition-all border ${
                            skill.enabled
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                              : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                          }`}
                          title={skill.enabled ? 'Disable Skill' : 'Enable Skill'}
                        >
                          <Power className="w-3 h-3" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => deleteSkill(skill.id)}
                          className="p-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded transition-all"
                          title="Uninstall"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 h-8">{skill.description}</p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-900 text-[10px]">
                      <span className="text-gray-500 font-mono">v{skill.version}</span>
                      <span className="text-orange-400 font-semibold bg-orange-600/5 px-2 py-0.5 rounded border border-orange-500/10">
                        {tools.length} Tools Loaded
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Details panel */}
          {selectedSkill && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 pb-2 border-b border-gray-800 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-orange-400" />
                Prompt Instructions & System Tools
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-gray-500 block mb-1">Package Name:</span>
                  <span className="font-mono text-gray-300">{selectedSkill.packageName}</span>
                </div>

                <div>
                  <span className="text-gray-500 block mb-1">System Instructions Supplement:</span>
                  <div className="bg-gray-950 border border-gray-800 rounded p-3 font-mono text-gray-300 whitespace-pre-wrap">
                    {selectedSkill.instructions || 'No supplementary system prompt specified for this skill. Default instructions will apply.'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 block mb-1.5">Registered Skill Actions:</span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const tools = selectedSkill.skillJson ? JSON.parse(selectedSkill.skillJson).tools || [] : [];
                      if (tools.length === 0) return <span className="text-gray-500">None</span>;
                      return tools.map((tool: string, idx: number) => (
                        <span key={idx} className="flex items-center gap-1 bg-gray-950 border border-gray-800 px-2.5 py-1 rounded-full font-mono text-orange-400 text-[11px]">
                          <Terminal className="w-3 h-3 text-orange-500" />
                          {tool}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace Store */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-yellow-500 animate-pulse" />
              ClawForge Skill Marketplace
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketplaceSkills.map((item, idx) => {
                const installed = skills.some(s => s.packageName === item.pkg);
                return (
                  <div key={idx} className="p-4 bg-gray-950 border border-gray-800 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-100">{item.title}</span>
                        <span className="text-[10px] text-gray-500 font-mono">v{item.ver}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => installMarketplace(item)}
                      disabled={installed}
                      className={`w-full mt-3 text-center py-1.5 text-xs font-bold rounded-lg transition-all ${
                        installed
                          ? 'bg-gray-900 text-green-500 border border-green-500/20 flex items-center justify-center gap-1.5'
                          : 'bg-orange-600 hover:bg-orange-500 text-white'
                      }`}
                    >
                      {installed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Installed
                        </>
                      ) : (
                        'Install Skill'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Custom Skill Package Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit">
          <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-orange-500" />
            Build Custom Skill
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Create locally-defined skills with targeted guidelines and specific background instructions for the runtime.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Skill Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Technical Copywriter"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Package Name</label>
              <input
                type="text"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                placeholder="@clawforge/skill-copywriter"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ensures all system markdown documentation meets styling guides"
                rows={2}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Supplementary Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Always use active voice. Strictly write API docs inside standard folders."
                rows={3}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              Compile & Inject Skill
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Skills;