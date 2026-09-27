import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Shield, Server, Cpu, Database, Save, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [health, setHealth] = useState({ healthy: false, nmap_available: false });
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    defaultProfile: 'STANDARD',
    scanTimeout: 600,
    maxConcurrentScans: 3,
    compactMode: false,
    auditLogging: true,
    sessionTimeout: 60
  });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHealth();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-mono text-xs">
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide font-sans">Scanner & Security Settings</h1>
        <p className="text-xs text-gray-400 font-mono">Engine operational parameters and system environment status</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Scanner configuration updated successfully.</span>
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg border ${health.healthy ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-red-600/20 text-red-400 border-red-500/30'}`}>
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-gray-400 text-[10px] uppercase font-bold">FastAPI Backend</div>
            <div className="text-white font-bold text-sm">{health.healthy ? 'OPERATIONAL' : 'DEGRADED'}</div>
          </div>
        </div>

        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg border ${health.nmap_available ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-amber-600/20 text-amber-400 border-amber-500/30'}`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-gray-400 text-[10px] uppercase font-bold">Nmap Engine Path</div>
            <div className="text-white font-bold text-sm">{health.nmap_available ? 'INSTALLED (CLI)' : 'SOCKET FALLBACK'}</div>
          </div>
        </div>

        <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-gray-400 text-[10px] uppercase font-bold">Database Engine</div>
            <div className="text-white font-bold text-sm">SQLite / PostgreSQL Ready</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Scanner Engine Settings */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-2 font-sans">
            Reconnaissance Engine Defaults
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">Default Profile</label>
              <select
                value={config.defaultProfile}
                onChange={(e) => setConfig({ ...config, defaultProfile: e.target.value })}
                className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg p-2 text-white"
              >
                <option value="QUICK">QUICK</option>
                <option value="STANDARD">STANDARD</option>
                <option value="DETAILED">DETAILED</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Scan Timeout (Seconds)</label>
              <input
                type="number"
                value={config.scanTimeout}
                onChange={(e) => setConfig({ ...config, scanTimeout: parseInt(e.target.value) })}
                className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg p-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Security & Audit Controls */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider text-emerald-400 border-b border-[#1F2937] pb-2 font-sans">
            Audit & Authorization Hardening
          </h3>
          <div className="flex items-center justify-between py-2 border-b border-[#1F2937]/50">
            <div>
              <div className="text-white font-bold">Enforce Audit Logging</div>
              <div className="text-gray-400 text-[11px]">Log target IP, timestamp, and user identity for every scan job</div>
            </div>
            <input
              type="checkbox"
              checked={config.auditLogging}
              onChange={(e) => setConfig({ ...config, auditLogging: e.target.checked })}
              className="w-4 h-4 rounded bg-[#0B0F19] border-gray-700 text-blue-600 focus:ring-0"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-white font-bold">JWT Token Expiry (Minutes)</div>
              <div className="text-gray-400 text-[11px]">Automatic SOC session revocation timeout</div>
            </div>
            <input
              type="number"
              value={config.sessionTimeout}
              onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
              className="w-24 bg-[#0B0F19] border border-[#1F2937] rounded-lg p-1.5 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center space-x-2 border border-blue-400/30 shadow-lg shadow-blue-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
