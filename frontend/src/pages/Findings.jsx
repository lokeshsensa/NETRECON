import React, { useEffect, useState } from 'react';
import { ShieldAlert, Filter, Search, ChevronRight, X, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const res = await api.get('/findings');
        setFindings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, []);

  const filteredFindings = findings.filter((f) => {
    const matchesSev = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.service_name && f.service_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSev && matchesSearch;
  });

  const getSeverityBadge = (sev) => {
    const colors = {
      CRITICAL: 'bg-red-950 text-red-400 border-red-800',
      HIGH: 'bg-red-900/60 text-red-300 border-red-700',
      MEDIUM: 'bg-amber-950 text-amber-400 border-amber-800',
      LOW: 'bg-blue-950 text-blue-400 border-blue-800',
      INFO: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${colors[sev] || colors.INFO}`}>
        {sev}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Defensive Security Findings</h1>
          <p className="text-xs text-gray-400 font-mono">Configuration risk analysis and exposure classification</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter findings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Severity Filter Cards */}
      <div className="grid grid-cols-6 gap-3 font-mono">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => {
          const count = sev === 'ALL' ? findings.length : findings.filter((f) => f.severity === sev).length;
          return (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedSeverity === sev
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/10'
                  : 'bg-[#111827] border-[#1F2937] text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold">{sev}</div>
              <div className="text-lg font-bold mt-0.5 text-white">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Findings Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0F19] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Finding Title</th>
                <th className="px-5 py-3">Port / Service</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Detected</th>
                <th className="px-5 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-300">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                    No matching findings recorded.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedFinding(f)}
                  >
                    <td className="px-5 py-4">{getSeverityBadge(f.severity)}</td>
                    <td className="px-5 py-4 font-bold text-white">{f.title}</td>
                    <td className="px-5 py-4 text-cyan-400">
                      {f.port_number ? `Port ${f.port_number}/TCP` : 'Host Level'} ({f.service_name || 'N/A'})
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {new Date(f.detected_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-500 inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937] bg-[#0B0F19]">
              <div className="flex items-center space-x-3">
                {getSeverityBadge(selectedFinding.severity)}
                <h3 className="font-bold text-white text-base font-mono">{selectedFinding.title}</h3>
              </div>
              <button onClick={() => setSelectedFinding(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs text-gray-300">
              <div>
                <span className="text-gray-500 uppercase text-[10px] block font-bold">Description</span>
                <p className="mt-1 text-gray-200">{selectedFinding.description}</p>
              </div>

              {selectedFinding.evidence && (
                <div>
                  <span className="text-gray-500 uppercase text-[10px] block font-bold">Evidence</span>
                  <div className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-emerald-400 mt-1">
                    {selectedFinding.evidence}
                  </div>
                </div>
              )}

              {selectedFinding.why_it_matters && (
                <div>
                  <span className="text-amber-400 uppercase text-[10px] block font-bold">Why It Matters</span>
                  <p className="mt-1 text-gray-300">{selectedFinding.why_it_matters}</p>
                </div>
              )}

              <div>
                <span className="text-emerald-400 uppercase text-[10px] block font-bold">Recommended Defensive Remediation</span>
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-300 mt-1 font-semibold">
                  {selectedFinding.recommended_remediation}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#1F2937]">
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
