import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Radar, 
  Server, 
  Network, 
  ShieldAlert, 
  FileText, 
  History, 
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Radio,
  Clock,
  User,
  Activity,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import ScanProgressModal from '../components/ScanProgressModal';

export default function SOCLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [backendHealth, setBackendHealth] = useState({ healthy: false, nmap: false });
  const [activeScan, setActiveScan] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll Backend Health & Active Scans
  useEffect(() => {
    const checkState = async () => {
      try {
        const healthRes = await api.get('/health');
        setBackendHealth({ healthy: healthRes.data.status === 'healthy', nmap: healthRes.data.nmap_available });

        // Check if any scan job is currently running
        const scansRes = await api.get('/scans');
        const runningScan = scansRes.data.find(
          (s) => s.status !== 'COMPLETED' && s.status !== 'FAILED' && s.status !== 'CANCELLED'
        );
        setActiveScan(runningScan || null);
      } catch (err) {
        setBackendHealth({ healthy: false, nmap: false });
        setActiveScan(null);
      }
    };

    checkState();
    const interval = setInterval(checkState, 3000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Scans', path: '/scans', icon: Radar },
    { name: 'Hosts', path: '/hosts', icon: Server },
    { name: 'Ports & Services', path: '/ports-services', icon: Radio },
    { name: 'Network Map', path: '/network-map', icon: Network },
    { name: 'Findings', path: '/findings', icon: ShieldAlert },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Scan History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-100 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside 
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-[#111827] border-r border-[#1F2937] flex flex-col transition-all duration-300 z-30 relative`}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1F2937]">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-400">
                <Radar className={`w-5 h-5 ${activeScan ? 'animate-spin text-amber-400' : 'animate-pulse'}`} />
              </div>
              <div>
                <h1 className="font-bold tracking-wider text-white text-base leading-none">NETRECON</h1>
                <span className="text-[10px] text-blue-400 font-mono tracking-widest">SOC DASHBOARD</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto p-2 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-400">
              <Radar className={`w-6 h-6 ${activeScan ? 'animate-spin text-amber-400' : 'animate-pulse'}`} />
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#1E293B] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1E293B]'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Safeguard Notice */}
        {!collapsed && (
          <div className="p-3 m-3 bg-[#0B0F19] border border-emerald-900/50 rounded-lg">
            <div className="flex items-start space-x-2 text-emerald-400 text-xs font-medium mb-1">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Authorized Testing</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-tight">
              Only scan systems you own or have explicit authorization to assess.
            </p>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between px-6 z-20">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-wide">
              {navItems.find(i => i.path === location.pathname)?.name || 'Security Console'}
            </h2>
            <p className="text-xs text-gray-400 font-mono">Discover. Analyze. Secure.</p>
          </div>

          <div className="flex items-center space-x-6">
            {/* ACTIVE SCANNING IN PROGRESS INDICATOR BADGE */}
            {activeScan ? (
              <button
                onClick={() => setShowProgressModal(true)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-amber-950/60 border border-amber-500/50 text-amber-300 rounded-lg animate-pulse hover:bg-amber-900/60 transition-all font-mono text-xs cursor-pointer shadow-lg shadow-amber-900/20"
                title="Click to view scan progress modal"
              >
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <span className="font-bold">SCANNING IN PROGRESS ({activeScan.progress_percentage}%)</span>
                <span className="text-[10px] text-amber-400/80 hidden lg:inline">[{activeScan.target}]</span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-[#0B0F19] border border-[#1F2937] rounded-md text-xs font-mono text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Scanner Idle</span>
              </div>
            )}

            {/* Status indicators */}
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#0B0F19] border border-[#1F2937] rounded-md">
                <span className={`w-2 h-2 rounded-full ${backendHealth.healthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-gray-300">Backend: {backendHealth.healthy ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              <div className="flex items-center space-x-2 px-3 py-1 bg-[#0B0F19] border border-[#1F2937] rounded-md">
                <span className={`w-2 h-2 rounded-full ${backendHealth.nmap ? 'bg-cyan-400' : 'bg-amber-400'}`}></span>
                <span className="text-gray-300">Scanner: {backendHealth.nmap ? 'NMAP CLI' : 'SOCKET FALLBACK'}</span>
              </div>

              <div className="flex items-center space-x-2 px-3 py-1 bg-[#0B0F19] border border-[#1F2937] rounded-md text-gray-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentTime}</span>
              </div>
            </div>

            {/* Profile menu */}
            <div className="flex items-center space-x-3 pl-4 border-l border-[#1F2937]">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-xs">
                SOC
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-white leading-tight">Lead Analyst</div>
                <div className="text-[10px] text-gray-400 font-mono">admin@netrecon.local</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0B0F19]">
          {children}
        </main>
      </div>

      {/* Progress Modal trigger if active scan indicator is clicked */}
      {showProgressModal && activeScan && (
        <ScanProgressModal
          scanId={activeScan.id}
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </div>
  );
}
