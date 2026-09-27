import React, { useEffect, useState } from 'react';
import { Radar, Play, Trash2, Eye, FileText, CheckCircle2, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import api from '../services/api';
import ScanModal from '../components/ScanModal';
import ScanProgressModal from '../components/ScanProgressModal';

export default function Scans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [activeScanId, setActiveScanId] = useState(null);

  const fetchScans = async () => {
    try {
      const res = await api.get('/scans');
      setScans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartScan = async (scanPayload) => {
    const res = await api.post('/scans', scanPayload);
    setActiveScanId(res.data.id);
    fetchScans();
  };

  const handleDeleteScan = async (scanId) => {
    if (window.confirm('Are you sure you want to delete this scan record?')) {
      await api.delete(`/scans/${scanId}`);
      fetchScans();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Network Scans</h1>
          <p className="text-xs text-gray-400 font-mono">Manage and execute network discovery jobs</p>
        </div>
        <button
          onClick={() => setIsScanModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center space-x-2 border border-blue-400/30"
        >
          <Play className="w-4 h-4" />
          <span>Launch New Scan</span>
        </button>
      </div>

      {/* Scan Jobs Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0F19] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-3">Scan ID / Target</th>
                <th className="px-5 py-3">Profile</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Live Hosts</th>
                <th className="px-5 py-3">Open Ports</th>
                <th className="px-5 py-3">Findings</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-300">
              {scans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-gray-500 text-xs">
                    No scan jobs found. Click "Launch New Scan" to begin.
                  </td>
                </tr>
              ) : (
                scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{scan.target}</span>
                        {scan.is_demo && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px]">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{scan.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-800/40 rounded text-[10px] font-bold">
                        {scan.profile}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                          scan.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : scan.status === 'FAILED'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                        }`}
                      >
                        {scan.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {scan.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-emerald-400 font-bold">{scan.live_hosts_count}</td>
                    <td className="px-5 py-4 text-cyan-400 font-bold">{scan.open_ports_count}</td>
                    <td className="px-5 py-4 text-amber-400 font-bold">{scan.findings_count}</td>
                    <td className="px-5 py-4 text-gray-400">{scan.duration_seconds}s</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setActiveScanId(scan.id)}
                        className="p-1.5 bg-[#0B0F19] text-blue-400 hover:text-white border border-[#1F2937] rounded-md"
                        title="View Progress / Results"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScan(scan.id)}
                        className="p-1.5 bg-[#0B0F19] text-red-400 hover:text-white border border-[#1F2937] rounded-md"
                        title="Delete Scan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onStartScan={handleStartScan}
      />

      <ScanProgressModal
        scanId={activeScanId}
        onClose={() => setActiveScanId(null)}
        onComplete={() => fetchScans()}
      />
    </div>
  );
}
