import React, { useEffect, useState } from 'react';
import { FileText, Download, ShieldCheck, FileSpreadsheet, FileCode, FileCheck } from 'lucide-react';
import api from '../services/api';

export default function Reports() {
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await api.get('/scans');
        setScans(res.data);
        if (res.data.length > 0) {
          setSelectedScanId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  const handleDownload = (format) => {
    if (!selectedScanId) return;
    const url = `/api/reports/${selectedScanId}/${format}`;
    window.open(url, '_blank');
  };

  const currentScan = scans.find((s) => s.id === selectedScanId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">Security Assessment Reports</h1>
        <p className="text-xs text-gray-400 font-mono">Generate executive PDF, JSON raw data, and CSV spreadsheets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Selector */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
            Select Scan Job
          </h3>
          <select
            value={selectedScanId}
            onChange={(e) => setSelectedScanId(e.target.value)}
            className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
          >
            {scans.map((s) => (
              <option key={s.id} value={s.id}>
                {s.target} — ({s.profile}) — {new Date(s.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>

          {currentScan && (
            <div className="p-4 bg-[#0B0F19] border border-[#1F2937] rounded-lg space-y-2 text-xs font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Target:</span>
                <span className="text-white font-bold">{currentScan.target}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Profile:</span>
                <span className="text-blue-400">{currentScan.profile}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Discovered Hosts:</span>
                <span className="text-emerald-400 font-bold">{currentScan.hosts_count}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Open Ports:</span>
                <span className="text-cyan-400 font-bold">{currentScan.open_ports_count}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Risk Findings:</span>
                <span className="text-amber-400 font-bold">{currentScan.findings_count}</span>
              </div>
            </div>
          )}
        </div>

        {/* Report Export Options */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PDF Card */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl flex flex-col justify-between hover:border-blue-500/50 transition-all">
            <div>
              <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-lg w-fit text-blue-400 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">Executive PDF Report</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Formatted cybersecurity summary report including executive overview, host tables, and defensive recommendations.
              </p>
            </div>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={!selectedScanId}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-2 border border-blue-400/30 shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* CSV Card */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl flex flex-col justify-between hover:border-emerald-500/50 transition-all">
            <div>
              <div className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-lg w-fit text-emerald-400 mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">CSV Export</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Tabular spreadsheet export of discovered IP addresses, MAC vendors, open port numbers, and risk finding columns.
              </p>
            </div>
            <button
              onClick={() => handleDownload('csv')}
              disabled={!selectedScanId}
              className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-2 border border-emerald-400/30 shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* JSON Card */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl flex flex-col justify-between hover:border-purple-500/50 transition-all">
            <div>
              <div className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-lg w-fit text-purple-400 mb-4">
                <FileCode className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">JSON Raw Telemetry</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Complete structured JSON payload for ingestion into SIEM tools, automated pipelines, or offline parsing.
              </p>
            </div>
            <button
              onClick={() => handleDownload('json')}
              disabled={!selectedScanId}
              className="mt-6 w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-2 border border-purple-400/30 shadow-lg shadow-purple-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
