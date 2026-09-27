import React, { useEffect, useState } from 'react';
import { Radio, Search, Server, Cpu, Filter, ChevronRight, X, Database } from 'lucide-react';
import api from '../services/api';

export default function PortsServices() {
  const [portsList, setPortsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPort, setSelectedPort] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const res = await api.get('/scans');
        const aggregated = [];
        res.data.forEach((scan) => {
          if (scan.hosts) {
            scan.hosts.forEach((host) => {
              if (host.ports) {
                host.ports.forEach((port) => {
                  aggregated.push({
                    ...port,
                    hostIp: host.ip_address,
                    hostname: host.hostname,
                    hostStatus: host.status,
                    hostRisk: host.risk_level,
                    scanTarget: scan.target
                  });
                });
              }
            });
          }
        });
        setPortsList(aggregated);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPorts();
  }, []);

  const filteredPorts = portsList.filter(
    (p) =>
      p.port_number.toString().includes(searchTerm) ||
      (p.service_name && p.service_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.product && p.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.hostIp && p.hostIp.includes(searchTerm))
  );

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide font-sans">Discovered Ports & Services</h1>
          <p className="text-xs text-gray-400">Enumerated active TCP/UDP open ports across assessed endpoints</p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter Port, Service, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Ports Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0B0F19] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-3">Host IP</th>
                <th className="px-5 py-3">Port</th>
                <th className="px-5 py-3">Protocol</th>
                <th className="px-5 py-3">State</th>
                <th className="px-5 py-3">Service Name</th>
                <th className="px-5 py-3">Product / Banner</th>
                <th className="px-5 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-300">
              {filteredPorts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    No open ports detected in current scan database.
                  </td>
                </tr>
              ) : (
                filteredPorts.map((p, idx) => (
                  <tr
                    key={p.id || idx}
                    className="hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPort(p)}
                  >
                    <td className="px-5 py-4 font-bold text-white flex items-center space-x-2">
                      <Server className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{p.hostIp}</span>
                    </td>
                    <td className="px-5 py-4 text-cyan-400 font-bold">{p.port_number}</td>
                    <td className="px-5 py-4 text-gray-400 uppercase">{p.protocol}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {p.state.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-blue-300 uppercase">{p.service_name || 'unknown'}</td>
                    <td className="px-5 py-4 text-gray-400">
                      {p.product ? `${p.product} ${p.version || ''}` : 'Generic Banner'}
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

      {/* Detailed Service Panel Modal */}
      {selectedPort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  Port {selectedPort.port_number}/{selectedPort.protocol.toUpperCase()} Service Detail
                </h3>
              </div>
              <button onClick={() => setSelectedPort(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 bg-[#0B0F19] rounded-lg border border-[#1F2937]">
                <span className="text-gray-400">Affected Host:</span>
                <span className="text-white font-bold">{selectedPort.hostIp} ({selectedPort.hostname || 'No FQDN'})</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#0B0F19] rounded-lg border border-[#1F2937]">
                <span className="text-gray-400">Service Name:</span>
                <span className="text-cyan-400 font-bold uppercase">{selectedPort.service_name}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#0B0F19] rounded-lg border border-[#1F2937]">
                <span className="text-gray-400">Detected Product:</span>
                <span className="text-emerald-400 font-bold">{selectedPort.product || 'Standard Service'}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#0B0F19] rounded-lg border border-[#1F2937]">
                <span className="text-gray-400">Version String:</span>
                <span className="text-amber-400 font-mono">{selectedPort.version || 'Unspecified'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#1F2937]">
              <button
                onClick={() => setSelectedPort(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
