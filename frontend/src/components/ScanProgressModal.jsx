import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Loader2, Shield, Radio, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function ScanProgressModal({ scanId, onClose, onComplete }) {
  const [scan, setScan] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!scanId) return;

    const poll = async () => {
      try {
        const res = await api.get(`/scans/${scanId}`);
        setScan(res.data);
        if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
          if (onComplete) onComplete(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [scanId]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!scan) return null;

  const handleCloseModal = (e) => {
    if (e) e.stopPropagation();
    if (onClose) onClose();
  };

  const handleViewResults = (e) => {
    if (e) e.stopPropagation();
    if (onClose) onClose();
    navigate('/hosts');
  };

  const stages = [
    { key: 'VALIDATING', name: 'Target Validation' },
    { key: 'HOST_DISCOVERY', name: 'Host Discovery' },
    { key: 'PORT_SCANNING', name: 'Port Scanning' },
    { key: 'SERVICE_DETECTION', name: 'Service Detection' },
    { key: 'RISK_ANALYSIS', name: 'Risk Analysis' },
    { key: 'REPORT_GENERATION', name: 'Report Generation' },
  ];

  const getStageStatus = (stageKey) => {
    const stageOrder = ['VALIDATING', 'HOST_DISCOVERY', 'PORT_SCANNING', 'SERVICE_DETECTION', 'RISK_ANALYSIS', 'REPORT_GENERATION', 'COMPLETED'];
    const currentIndex = stageOrder.indexOf(scan.status);
    const targetIndex = stageOrder.indexOf(stageKey);

    if (scan.status === 'COMPLETED') return 'completed';
    if (scan.status === 'FAILED') return targetIndex <= currentIndex ? 'error' : 'pending';
    if (currentIndex > targetIndex) return 'completed';
    if (currentIndex === targetIndex) return 'current';
    return 'pending';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-default"
      onClick={handleCloseModal}
    >
      <div 
        className="bg-[#111827] border border-[#1F2937] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937] bg-[#0B0F19]">
          <div className="flex items-center space-x-3">
            <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
            <div>
              <h3 className="font-semibold text-white text-base">Scan Execution Progress</h3>
              <p className="text-xs text-gray-400 font-mono">Target: {scan.target} ({scan.profile})</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleCloseModal} 
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1E293B] transition-colors"
            title="Close Progress Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2 text-xs font-mono">
              <span className="text-blue-400 font-medium">{scan.current_stage || 'Processing...'}</span>
              <span className="text-white font-bold">{scan.progress_percentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#0B0F19] rounded-full border border-[#1F2937] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 rounded-full"
                style={{ width: `${scan.progress_percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stage Progression Checklist */}
          <div className="space-y-3 bg-[#0B0F19] p-4 rounded-xl border border-[#1F2937]">
            {stages.map((st) => {
              const status = getStageStatus(st.key);
              return (
                <div key={st.key} className="flex items-center justify-between text-xs font-mono py-1 border-b border-[#1F2937]/50 last:border-0">
                  <div className="flex items-center space-x-3">
                    {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {status === 'current' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
                    {status === 'pending' && <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0"></div>}
                    {status === 'error' && <X className="w-4 h-4 text-red-400 shrink-0" />}
                    <span className={status === 'current' ? 'text-blue-300 font-bold' : status === 'completed' ? 'text-gray-300' : 'text-gray-500'}>
                      {st.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase">
                    {status === 'completed' ? '[DONE]' : status === 'current' ? '[RUNNING]' : '[WAITING]'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Real-time discovered metrics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
              <div className="text-xs text-gray-400">Live Hosts</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{scan.live_hosts_count}</div>
            </div>
            <div className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
              <div className="text-xs text-gray-400">Open Ports</div>
              <div className="text-xl font-bold font-mono text-cyan-400">{scan.open_ports_count}</div>
            </div>
            <div className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
              <div className="text-xs text-gray-400">Findings</div>
              <div className="text-xl font-bold font-mono text-amber-400">{scan.findings_count}</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-[#0B0F19] border border-[#1F2937] rounded-lg hover:border-gray-600 transition-colors"
            >
              Close Modal
            </button>

            {scan.status === 'COMPLETED' ? (
              <button
                type="button"
                onClick={handleViewResults}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
              >
                <span>View Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-[#0B0F19] border border-[#1F2937] rounded-lg"
              >
                Minimize to Background
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
