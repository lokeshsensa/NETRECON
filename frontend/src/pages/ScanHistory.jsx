import React, { useEffect, useState } from 'react';
import { History, Trash2, Download, Eye, Calendar, Clock, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function ScanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/scans');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete scan history entry?')) {
      await api.delete(`/scans/${id}`);
      fetchHistory();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">Historical Scan Repository</h1>
        <p className="text-xs text-gray-400 font-mono">Complete audit log of previously executed network assessments</p>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-xl font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0B0F19] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">Profile</th>
                <th className="px-5 py-3">Hosts</th>
                <th className="px-5 py-3">Ports</th>
                <th className="px-5 py-3">Findings</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-300">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    No scan history available.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="px-5 py-4 text-gray-400">
                      <div className="text-white font-bold">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-white">
                      {item.target}
                      {item.is_demo && (
                        <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] border border-amber-500/30 rounded">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-blue-400 font-bold">{item.profile}</td>
                    <td className="px-5 py-4 text-emerald-400 font-bold">{item.live_hosts_count} / {item.hosts_count}</td>
                    <td className="px-5 py-4 text-cyan-400 font-bold">{item.open_ports_count}</td>
                    <td className="px-5 py-4 text-amber-400 font-bold">{item.findings_count}</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => window.open(`/api/reports/${item.id}/pdf`, '_blank')}
                        className="p-1.5 bg-[#0B0F19] text-blue-400 hover:text-white border border-[#1F2937] rounded-md"
                        title="Download PDF Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-[#0B0F19] text-red-400 hover:text-white border border-[#1F2937] rounded-md"
                        title="Delete Entry"
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
    </div>
  );
}
