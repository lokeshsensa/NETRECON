import React, { useEffect, useState } from 'react';
import { Server, Activity, Radio, ShieldAlert, Play, ArrowRight, RefreshCw, Cpu, Database, Network } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import ScanModal from '../components/ScanModal';
import ScanProgressModal from '../components/ScanProgressModal';

const CustomChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const dataObj = item.payload || {};
    const label = dataObj.name || (dataObj.port ? `Port ${dataObj.port}` : item.name) || item.dataKey || 'Metric';
    const val = item.value !== undefined ? item.value : (dataObj.count !== undefined ? dataObj.count : dataObj.value);
    const itemColor = dataObj.color || item.color || item.fill || '#3B82F6';

    return (
      <div className="bg-[#090D16] border border-[#374151] px-3.5 py-2 rounded-lg shadow-2xl flex items-center space-x-2.5 font-mono text-xs z-50">
        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: itemColor }} />
        <span className="font-semibold text-gray-200 tracking-wide">{label}:</span>
        <span className="font-extrabold text-sm tracking-wider" style={{ color: itemColor }}>
          {val !== undefined ? val : 0}
        </span>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [activeScanId, setActiveScanId] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    // Safety fallback: Ensure loading screen clears within 3 seconds
    const safetyTimer = setTimeout(() => setLoading(false), 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleStartScan = async (scanPayload) => {
    const res = await api.post('/scans', scanPayload);
    setActiveScanId(res.data.id);
    fetchSummary();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-blue-400 font-mono text-sm space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading SOC Telemetry...</span>
      </div>
    );
  }

  // Chart Data Preparation
  const hostDiscoveryData = [
    { name: 'Live', value: summary?.host_status_distribution?.live || 0, color: '#10B981' },
    { name: 'Down', value: summary?.host_status_distribution?.down || 0, color: '#EF4444' },
    { name: 'Unknown', value: summary?.host_status_distribution?.unknown || 0, color: '#6B7280' },
  ];

  const riskData = [
    { name: 'Critical', count: summary?.risk_overview?.CRITICAL || 0, color: '#EF4444' },
    { name: 'High', count: summary?.risk_overview?.HIGH || 0, color: '#F97316' },
    { name: 'Medium', count: summary?.risk_overview?.MEDIUM || 0, color: '#F59E0B' },
    { name: 'Low', count: summary?.risk_overview?.LOW || 0, color: '#3B82F6' },
    { name: 'Info', count: summary?.risk_overview?.INFO || 0, color: '#10B981' },
  ];

  const serviceColors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
  const servicePieData = Object.entries(summary?.service_distribution || {}).map(([name, value], idx) => ({
    name,
    value,
    color: serviceColors[idx % serviceColors.length]
  }));

  const topOpenPortsData = (summary?.top_open_ports || []).map((item, idx) => ({
    ...item,
    port: item.port,
    name: item.port ? `Port ${item.port}` : 'Port',
    count: item.count || 0,
    color: serviceColors[idx % serviceColors.length]
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Scan Launcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] border border-[#1F2937] rounded-xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Active Network Sentinel</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Network Reconnaissance & Risk Visibility</h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Controlled non-destructive host discovery, port enumeration, and defensive security exposure analysis for authorized subnets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all border border-blue-400/30"
          >
            <Play className="w-4 h-4" />
            <span>Start New Scan</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Hosts" value={summary?.total_hosts || 0} icon={Server} color="blue" subtitle="Discovered endpoints" />
        <StatCard title="Live Hosts" value={summary?.live_hosts || 0} icon={Activity} color="green" subtitle="Active on network" />
        <StatCard title="Open Ports" value={summary?.open_ports || 0} icon={Radio} color="cyan" subtitle="Responding services" />
        <StatCard title="Services" value={summary?.services_count || 0} icon={Database} color="purple" subtitle="Identified protocols" />
        <StatCard title="High Risk" value={summary?.high_risk_findings || 0} icon={ShieldAlert} color="red" subtitle="Critical / High exposures" />
        <StatCard 
          title="Last Scan" 
          value={summary?.last_scan ? `${summary.last_scan.duration_seconds}s` : 'N/A'} 
          icon={Cpu} 
          color="amber" 
          subtitle={summary?.last_scan?.target || 'No scans ran yet'} 
        />
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Host Discovery Status Chart */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Host Discovery State</span>
            <span className="text-xs text-gray-400 font-normal">Ping & ARP Reachability</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hostDiscoveryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {hostDiscoveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
                <Legend formatter={(value) => <span className="text-xs text-gray-300 font-mono">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Frequent Open Ports */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Top Detected Open Ports</span>
            <span className="text-xs text-gray-400 font-normal">Frequency Count</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topOpenPortsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="port" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {topOpenPortsData.map((entry, index) => (
                    <Cell key={`port-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Distribution Pie */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Detected Service Breakdown</span>
            <span className="text-xs text-gray-400 font-normal">Protocol Classification</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={servicePieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {servicePieData.map((entry, index) => (
                    <Cell key={`service-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Overview Bar */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Risk Exposure Overview</span>
            <span className="text-xs text-gray-400 font-normal">Severity Level Categorization</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`risk-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onStartScan={handleStartScan}
      />

      <ScanProgressModal
        scanId={activeScanId}
        onClose={() => setActiveScanId(null)}
        onComplete={() => fetchSummary()}
      />
    </div>
  );
}
