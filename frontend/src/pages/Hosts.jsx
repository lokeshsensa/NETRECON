import React, { useEffect, useState } from 'react';
import { Server, Search, Filter, ShieldAlert, Cpu, ChevronRight, X, Radio } from 'lucide-react';
import api from '../services/api';

export default function Hosts() {
  const [hosts, setHosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHost, setSelectedHost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const res = await api.get('/scans');
        const allHosts = [];
        res.data.forEach((s) => {
          if (s.hosts) {
            s.hosts.forEach((h) => allHosts.push({ ...h, scanTarget: s.target }));
          }
        });
        setHosts(allHosts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHosts();
  }, []);

  const filteredHosts = hosts.filter(
    (h) =>
      h.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.hostname && h.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.vendor && h.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Discovered Host Inventory</h1>
          <p className="text-xs text-gray-400 font-mono">Detailed reachability & service exposure map</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search IP, Hostname, Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Hosts Inventory Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0F19] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3">Hostname</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">MAC / Vendor</th>
                <th className="px-5 py-3">Open Ports</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-300">
              {filteredHosts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    No matching hosts found in database.
                  </td>
                </tr>
              ) : (
                filteredHosts.map((host) => (
                  <tr key={host.id} className="hover:bg-[#1E293B]/50 transition-colors cursor-pointer" onClick={() => setSelectedHost(host)}>
                    <td className="px-5 py-4 font-bold text-white flex items-center space-x-2">
                      <Server className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{host.ip_address}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-300">{host.hostname || 'N/A'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        host.status === 'UP' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {host.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      <div>{host.mac_address || 'N/A'}</div>
                      <div className="text-[10px] text-gray-500">{host.vendor || 'Unknown Hardware'}</div>
                    </td>
                    <td className="px-5 py-4 text-cyan-400 font-bold">
                      {host.ports ? host.ports.length : 0} Ports
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        host.risk_level === 'HIGH' || host.risk_level === 'CRITICAL' 
                          ? 'bg-red-950 text-red-400 border border-red-800' 
                          : host.risk_level === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {host.risk_level}
                      </span>
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

      {/* Host Detail Drawer / Modal */}
      {selectedHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border-l border-[#1F2937] w-full max-w-xl h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
              <div>
                <h3 className="font-bold text-white text-lg font-mono">{selectedHost.ip_address}</h3>
                <p className="text-xs text-gray-400">{selectedHost.hostname || 'No FQDN Hostname'}</p>
              </div>
              <button onClick={() => setSelectedHost(null)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Host Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
                <div className="text-gray-500">MAC Address</div>
                <div className="text-white mt-1">{selectedHost.mac_address || 'N/A'}</div>
              </div>
              <div className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
                <div className="text-gray-500">Vendor</div>
                <div className="text-white mt-1">{selectedHost.vendor || 'Generic'}</div>
              </div>
            </div>

            {/* Ports Section */}
            <div>
              <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-2">
                Exposed Open Ports & Services
              </h4>
              <div className="space-y-2">
                {selectedHost.ports && selectedHost.ports.length > 0 ? (
                  selectedHost.ports.map((p) => (
                    <div key={p.id} className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-emerald-400">Port {p.port_number}/{p.protocol}</span>
                        <span className="ml-2 text-gray-300 font-bold">{p.service_name?.toUpperCase()}</span>
                      </div>
                      <div className="text-gray-400 text-[11px]">
                        {p.product} {p.version}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-xs text-center bg-[#0B0F19] rounded-lg">No open ports detected.</div>
                )}
              </div>
            </div>

            {/* Findings Section */}
            <div>
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
                Defensive Risk Analysis Findings
              </h4>
              <div className="space-y-2">
                {selectedHost.findings && selectedHost.findings.length > 0 ? (
                  selectedHost.findings.map((f) => (
                    <div key={f.id} className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{f.title}</span>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-950 text-red-400 border border-red-800">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">{f.description}</p>
                      <div className="text-[10px] text-emerald-400 font-mono mt-1">
                        <b>Remediation:</b> {f.recommended_remediation}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-xs text-center bg-[#0B0F19] rounded-lg">No risk findings recorded.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
