import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Mic, MicOff, Volume2, Settings2, Play, Circle, Battery, Sparkles, AlertCircle, Check } from 'lucide-react';

export const Voice: React.FC = () => {
  const { voiceConfig, wakewordConfig, fetchVoiceAndWakeword, saveVoiceConfig, saveWakewordConfig } = useClawForgeStore();
  const [isListening, setIsListening] = useState(false);
  const [speechLogs, setSpeechLogs] = useState<string[]>([
    'Hey Claw local wake word listener online.',
    'Ready for continuous push-to-talk voice commands.'
  ]);

  // Form states
  const [speechEngine, setSpeechEngine] = useState('');
  const [continuous, setContinuous] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [lang, setLang] = useState('en-US');
  const [wakePhrase, setWakePhrase] = useState('');
  const [sensitivity, setSensitivity] = useState(0.75);
  const [powerMode, setPowerMode] = useState('Balanced');
  const [activeWakePhrases, setActiveWakePhrases] = useState<string[]>([]);

  useEffect(() => {
    fetchVoiceAndWakeword().then(() => {
      // Set local defaults when loaded
      const vc = useClawForgeStore.getState().voiceConfig;
      const wc = useClawForgeStore.getState().wakewordConfig;
      if (vc) {
        setSpeechEngine(vc.speechEngine || 'Local DeepSpeech');
        setContinuous(vc.continuousConversation !== false);
        setNoiseSuppression(vc.noiseSuppression !== false);
        setLang(vc.language || 'en-US');
      }
      if (wc) {
        setSensitivity(wc.sensitivity || 0.75);
        setPowerMode(wc.powerMode || 'Balanced');
        setActiveWakePhrases(wc.wakePhrases || ['Hey Claw']);
      }
    });
  }, [fetchVoiceAndWakeword]);

  const handleSaveConfigs = async () => {
    const vc = {
      speechEngine,
      continuousConversation: continuous,
      noiseSuppression,
      language: lang,
      microphoneSelection: 'Built-in Microphone',
      speakerSelection: 'Default System Audio',
      automaticPunctuation: true
    };
    const wc = {
      enabled: true,
      wakePhrases: activeWakePhrases,
      sensitivity,
      powerMode
    };
    await saveVoiceConfig(vc);
    await saveWakewordConfig(wc);
    setSpeechLogs(prev => [...prev, 'Voice and Wake Word configurations synchronized successfully inside SQLite.']);
  };

  const handleAddWakePhrase = () => {
    if (!wakePhrase || activeWakePhrases.includes(wakePhrase)) return;
    const updated = [...activeWakePhrases, wakePhrase];
    setActiveWakePhrases(updated);
    setWakePhrase('');
  };

  const handleRemoveWakePhrase = (phrase: string) => {
    const updated = activeWakePhrases.filter(p => p !== phrase);
    setActiveWakePhrases(updated);
  };

  const handlePushToTalk = () => {
    if (isListening) {
      setIsListening(false);
      setSpeechLogs(prev => [...prev, 'Speech capture halted. Synthesizing prompt response...']);
    } else {
      setIsListening(true);
      setSpeechLogs(prev => [...prev, 'Microphone session started. Listening continuously...']);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-orange-500" />
            Voice Assistant & Wake Word
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Activate continuous hands-free voice control and configure customizable wake words processed entirely on-device.
          </p>
        </div>
        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse">
          <Circle className="w-2 h-2 fill-current" />
          Always Listening
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Waveform, push to talk, and logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Pulsing glow background */}
            {isListening && (
              <div className="absolute inset-0 bg-orange-600/5 animate-pulse pointer-events-none" />
            )}

            <span className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-4">Pipeline Speech Input Viewport</span>

            {/* Simulated Animated Visualizer wave */}
            <div className="flex items-center justify-center gap-1.5 h-16 mb-8 w-full">
              {Array.from({ length: 24 }).map((_, idx) => {
                const heights = [12, 28, 48, 20, 56, 16, 72, 32, 64, 40, 80, 24, 48, 64, 16, 40, 56, 24, 32, 12];
                const height = isListening ? heights[idx % heights.length] : 4;
                const animStyle = isListening
                  ? {
                      animation: `pulse 1.2s infinite ease-in-out alternate`,
                      animationDelay: `${idx * 0.05}s`,
                      height: `${height}px`
                    }
                  : { height: '6px' };

                return (
                  <div
                    key={idx}
                    style={animStyle}
                    className={`w-1 rounded-full transition-all duration-300 ${isListening ? 'bg-orange-500' : 'bg-gray-800'}`}
                  />
                );
              })}
            </div>

            {/* Mic push to talk button */}
            <button
              onClick={handlePushToTalk}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg border transition-all ${
                isListening
                  ? 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white animate-pulse'
                  : 'bg-gray-950 hover:bg-gray-800 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
            </button>

            <span className="text-xs text-gray-400 mt-4 font-semibold">
              {isListening ? 'Speech Streaming Active... Click to Pause' : 'Click to Push-To-Talk / Interrupt'}
            </span>
          </div>

          {/* Speech logs audit feed */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <span className="text-xs text-gray-500 font-mono block mb-2">SPEECH-TO-TEXT LOG FEED:</span>
            <div className="space-y-1.5 font-mono text-xs max-h-36 overflow-y-auto bg-gray-950 p-3 rounded-lg border border-gray-800">
              {speechLogs.map((log, idx) => (
                <div key={idx} className="text-gray-400 flex gap-2">
                  <span className="text-orange-500 font-bold shrink-0">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Voice & Wake word Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit space-y-5">
          <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-800">
            <Settings2 className="w-5 h-5 text-orange-500" />
            V2 Voice Configurations
          </h2>

          {/* Speech Engine */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">STT/TTS Pipeline Engine</label>
            <select
              value={speechEngine}
              onChange={(e) => setSpeechEngine(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
            >
              <option value="Local DeepSpeech">Local DeepSpeech Offline (0ms latency)</option>
              <option value="Whisper API">Whisper Web API (High accuracy)</option>
              <option value="System WebSpeech">System WebSpeech Native (Browser-based)</option>
            </select>
          </div>

          {/* Language selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Microphone Language</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
            >
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="de-DE">German (Deutsch)</option>
              <option value="fr-FR">French (Français)</option>
            </select>
          </div>

          {/* Power Modes */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1 text-gray-300">
              <Battery className="w-4 h-4 text-orange-400" />
              Wake Processor Power Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Battery Saver', 'Balanced', 'Performance'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPowerMode(mode)}
                  className={`py-1 px-2 text-xs font-bold rounded border transition-all ${
                    powerMode === mode
                      ? 'bg-orange-600 border-orange-500 text-white'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Wake phrases CRUD list */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Custom Wake Phrases</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={wakePhrase}
                onChange={(e) => setWakePhrase(e.target.value)}
                placeholder="e.g. Hey Claw"
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddWakePhrase}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 text-xs rounded-lg border border-gray-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-gray-950 p-2 border border-gray-800 rounded-lg max-h-24 overflow-y-auto">
              {activeWakePhrases.map((phrase, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-gray-900 border border-gray-800 px-2.5 py-0.5 rounded text-[11px] font-mono text-gray-300">
                  <span>{phrase}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWakePhrase(phrase)}
                    className="text-red-500 hover:text-red-400 ml-1 font-bold font-sans"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sensitivity Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-300">Wake word Sensitivity</label>
              <span className="text-[10px] font-mono text-orange-400">{Math.round(sensitivity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>

          {/* Switches */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <label className="flex items-center justify-between text-xs text-gray-400 cursor-pointer">
              <span>Continuous Conversation Mode</span>
              <input
                type="checkbox"
                checked={continuous}
                onChange={() => setContinuous(!continuous)}
                className="accent-orange-500"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-gray-400 cursor-pointer">
              <span>Microphone Noise Suppression</span>
              <input
                type="checkbox"
                checked={noiseSuppression}
                onChange={() => setNoiseSuppression(!noiseSuppression)}
                className="accent-orange-500"
              />
            </label>
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveConfigs}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Synchronize SQLite Settings
          </button>

          <div className="p-3 bg-orange-600/5 border border-orange-500/10 rounded-lg flex items-start gap-1.5 text-[11px] text-orange-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Wake words are parsed entirely locally inside the sandbox to safeguard your home audio privacy.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Voice;