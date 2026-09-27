import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckSquare, Square, Play, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ScanModal({ isOpen, onClose, onStartScan }) {
  const [target, setTarget] = useState('192.168.1.0/24');
  const [profile, setProfile] = useState('STANDARD');
  const [confirmedAuth, setConfirmedAuth] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRunningScan, setActiveRunningScan] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const checkActiveScans = async () => {
      try {
        const res = await api.get('/scans');
        const running = res.data.find(
          (s) => s.status !== 'COMPLETED' && s.status !== 'FAILED' && s.status !== 'CANCELLED'
        );
        setActiveRunningScan(running || null);
      } catch (err) {
        setActiveRunningScan(null);
      }
    };
    checkActiveScans();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeRunningScan) {
      setError(`A scan job for target "${activeRunningScan.target}" is currently in progress. Please wait for it to complete.`);
      return;
    }
    if (!confirmedAuth) {
      setError('You must confirm explicit scan authorization before proceeding.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onStartScan({ target, profile, user_confirmed_auth: confirmedAuth, is_demo: isDemo });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initialize scan job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937] bg-[#0B0F19]">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white text-base">Start New Reconnaissance Scan</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Active Scan Warning Banner */}
          {activeRunningScan && (
            <div className="p-3.5 bg-amber-950/50 border border-amber-500/60 rounded-lg flex items-start space-x-3 text-amber-200 text-xs font-mono">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-400">SCAN IN PROGRESS FOR {activeRunningScan.target}</div>
                <div className="text-[11px] text-amber-300/80 mt-0.5">
                  Another scan is currently executing ({activeRunningScan.progress_percentage}% complete). Duplicate scan requests are disabled to prevent duplicate tickets and bandwidth saturation.
                </div>
              </div>
            </div>
          )}

          {error && !activeRunningScan && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode toggle for Demo */}
          <div className="flex items-center justify-between p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
            <div>
              <span className="text-xs font-semibold text-white flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                DEMO MODE
              </span>
              <p className="text-[11px] text-gray-400">Populate realistic sample SOC data without scanning live network</p>
            </div>
            <button
              type="button"
              disabled={!!activeRunningScan}
              onClick={() => setIsDemo(!isDemo)}
              className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ${isDemo ? 'bg-amber-500' : 'bg-gray-700'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isDemo ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>

          {/* Target Input */}
          <div>
            <label className="block text-xs font-mono font-medium text-gray-300 mb-1">
              Target (IP Address, Hostname, or CIDR)
            </label>
            <input
              type="text"
              disabled={!!activeRunningScan}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 192.168.1.1 or 192.168.1.0/24 or router.local"
              className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">Supported formats: Single IPv4 (192.168.1.10), Subnet CIDR (192.168.1.0/24), FQDN</p>
          </div>

          {/* Scan Profiles */}
          <div>
            <label className="block text-xs font-mono font-medium text-gray-300 mb-2">
              Scan Profile
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'QUICK', label: 'QUICK', desc: 'Fast host discovery & top 100 ports' },
                { id: 'STANDARD', label: 'STANDARD', desc: 'Host discovery & TCP service detection' },
                { id: 'DETAILED', label: 'DETAILED', desc: 'Extended port scan & DNS resolution' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={!!activeRunningScan}
                  onClick={() => setProfile(p.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    profile === p.id 
                      ? 'bg-blue-600/20 border-blue-500 text-white' 
                      : 'bg-[#0B0F19] border-[#1F2937] text-gray-400 hover:border-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-xs font-bold font-mono text-blue-400">{p.label}</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Authorization Checklist Safeguard */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-medium text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Authorization Requirement</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Only scan systems you own or have explicit authorization to test. Unauthorized network scanning may violate applicable laws.
            </p>

            <button
              type="button"
              disabled={!!activeRunningScan}
              onClick={() => setConfirmedAuth(!confirmedAuth)}
              className="flex items-center space-x-2 pt-1 text-xs text-white hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmedAuth ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-gray-500 shrink-0" />
              )}
              <span className="select-none font-medium">I confirm that I am authorized to scan this target.</span>
            </button>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-lg bg-[#0B0F19] border border-[#1F2937]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmedAuth || loading || !!activeRunningScan}
              className={`px-5 py-2 text-xs font-medium text-white rounded-lg transition-all flex items-center space-x-2 ${
                confirmedAuth && !loading && !activeRunningScan
                  ? 'bg-blue-600 hover:bg-blue-500 border border-blue-400/30 shadow-lg shadow-blue-600/20'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {loading ? (
                <span>Launching...</span>
              ) : activeRunningScan ? (
                <span>Scan In Progress</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Scan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
