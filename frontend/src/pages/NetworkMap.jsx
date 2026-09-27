import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Server, Router, ShieldAlert, Cpu, Network, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';

// Custom Node for Hosts
const HostNode = ({ data }) => {
  const getRiskColor = (risk) => {
    if (risk === 'HIGH' || risk === 'CRITICAL') return 'border-red-500 bg-red-950/90 text-red-300 shadow-red-900/40';
    if (risk === 'MEDIUM') return 'border-amber-500 bg-amber-950/90 text-amber-300 shadow-amber-900/40';
    return 'border-emerald-500 bg-emerald-950/90 text-emerald-300 shadow-emerald-900/40';
  };

  return (
    <div className={`p-3.5 rounded-xl border-2 shadow-2xl min-w-[190px] font-mono ${getRiskColor(data.risk)}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <div className="flex items-center space-x-2 border-b border-gray-700/60 pb-2 mb-2">
        <Server className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="font-bold text-sm text-white">{data.ip}</span>
      </div>
      <div className="text-[11px] text-gray-200 font-semibold truncate mb-1">
        {data.hostname || 'Endpoint Host'}
      </div>
      <div className="text-[10px] text-cyan-300 font-mono flex items-center justify-between border-t border-gray-800/80 pt-1.5 mt-1.5">
        <span>Open Ports: <b className="text-white">{data.portsCount}</b></span>
        <span className="font-bold px-1.5 py-0.5 rounded bg-black/40 text-[9px] uppercase">{data.risk}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
};

// Custom Node for Router/Gateway
const RouterNode = ({ data }) => (
  <div className="p-3.5 bg-blue-950/95 border-2 border-blue-400 rounded-xl shadow-2xl min-w-[210px] text-center font-mono shadow-blue-900/50">
    <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3" />
    <div className="flex items-center justify-center space-x-2 text-blue-400 mb-1">
      <Router className="w-5 h-5 animate-pulse" />
      <span className="font-bold text-xs text-white uppercase">{data.label}</span>
    </div>
    <div className="text-[11px] text-blue-300 font-bold tracking-wider">{data.subnet}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3" />
  </div>
);

const nodeTypes = { hostNode: HostNode, routerNode: RouterNode };

export default function NetworkMap() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [scansList, setScansList] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const fetchTopology = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scans');
      const allScans = res.data;
      setScansList(allScans);

      // Collect hosts to display
      let hostsToRender = [];
      let subnetLabel = "ALL NETWORK SUBNETS";

      if (selectedScanId === 'ALL') {
        allScans.forEach((s) => {
          if (s.hosts) {
            s.hosts.forEach((h) => {
              if (!hostsToRender.some((existing) => existing.ip_address === h.ip_address)) {
                hostsToRender.push(h);
              }
            });
          }
        });
      } else {
        const targetScan = allScans.find((s) => s.id === selectedScanId);
        if (targetScan && targetScan.hosts) {
          hostsToRender = targetScan.hosts;
          subnetLabel = targetScan.target;
        }
      }

      if (hostsToRender.length === 0) {
        // Default Sample Topology
        const initialNodes = [
          {
            id: 'router-1',
            type: 'routerNode',
            position: { x: 400, y: 30 },
            data: { label: 'SUBNET GATEWAY', subnet: '192.168.1.0/24' }
          },
          {
            id: 'host-1',
            type: 'hostNode',
            position: { x: 100, y: 200 },
            data: { ip: '192.168.1.10', hostname: 'web-prod-01.local', portsCount: 3, risk: 'LOW' }
          },
          {
            id: 'host-2',
            type: 'hostNode',
            position: { x: 400, y: 200 },
            data: { ip: '192.168.1.20', hostname: 'db-cluster-node.local', portsCount: 3, risk: 'HIGH' }
          },
          {
            id: 'host-3',
            type: 'hostNode',
            position: { x: 700, y: 200 },
            data: { ip: '192.168.1.40', hostname: 'camera-iot.local', portsCount: 2, risk: 'MEDIUM' }
          }
        ];

        const initialEdges = [
          { id: 'e-r1-h1', source: 'router-1', target: 'host-1', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
          { id: 'e-r1-h2', source: 'router-1', target: 'host-2', animated: true, style: { stroke: '#EF4444', strokeWidth: 2 } },
          { id: 'e-r1-h3', source: 'router-1', target: 'host-3', animated: true, style: { stroke: '#F59E0B', strokeWidth: 2 } },
        ];

        setNodes(initialNodes);
        setEdges(initialEdges);
      } else {
        const routerId = 'router-gateway';
        const newNodes = [
          {
            id: routerId,
            type: 'routerNode',
            position: { x: 450, y: 30 },
            data: { label: `NETWORK ROUTER`, subnet: subnetLabel }
          }
        ];
        const newEdges = [];

        const cols = Math.min(Math.max(hostsToRender.length, 1), 4);
        hostsToRender.forEach((h, idx) => {
          const nodeId = `host-${h.id || idx}`;
          const xPos = 80 + (idx % cols) * 250;
          const yPos = 200 + Math.floor(idx / cols) * 180;

          newNodes.push({
            id: nodeId,
            type: 'hostNode',
            position: { x: xPos, y: yPos },
            data: {
              ip: h.ip_address,
              hostname: h.hostname,
              portsCount: h.ports ? h.ports.length : 0,
              risk: h.risk_level
            }
          });

          const strokeColor = h.risk_level === 'HIGH' || h.risk_level === 'CRITICAL' ? '#EF4444' : h.risk_level === 'MEDIUM' ? '#F59E0B' : '#3B82F6';
          newEdges.push({
            id: `edge-${routerId}-${nodeId}`,
            source: routerId,
            target: nodeId,
            animated: true,
            style: { stroke: strokeColor, strokeWidth: 2 }
          });
        });

        setNodes(newNodes);
        setEdges(newEdges);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
  }, [selectedScanId]);

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)] flex flex-col font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide font-sans">Interactive Network Topology Map</h1>
          <p className="text-xs text-gray-400">Subnet architecture, router gateway, and endpoint host IP diagrams</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Scan Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-1.5">
            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
            <select
              value={selectedScanId}
              onChange={(e) => setSelectedScanId(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none"
            >
              <option value="ALL" className="bg-[#111827]">All Discovered Subnets & Hosts</option>
              {scansList.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#111827]">
                  {s.target} ({s.profile})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchTopology}
            className="px-3 py-1.5 bg-[#111827] border border-[#1F2937] text-gray-300 hover:text-white rounded-lg flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[500px] bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-blue-400 font-mono text-sm space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Rendering Network Topology Graph...</span>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#1F2937" gap={20} size={1} />
            <Controls className="!bg-[#0B0F19] !text-white !border-[#1F2937] !rounded-lg" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
