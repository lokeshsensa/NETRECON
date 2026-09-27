import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = "blue", subtitle, trend }) {
  const colorMap = {
    blue: "bg-blue-600/10 border-blue-500/30 text-blue-400",
    green: "bg-emerald-600/10 border-emerald-500/30 text-emerald-400",
    cyan: "bg-cyan-600/10 border-cyan-500/30 text-cyan-400",
    purple: "bg-purple-600/10 border-purple-500/30 text-purple-400",
    amber: "bg-amber-600/10 border-amber-500/30 text-amber-400",
    red: "bg-red-600/10 border-red-500/30 text-red-400"
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-gray-700 transition-all shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">{title}</span>
          <div className="text-3xl font-bold font-mono text-white mt-1.5">{value}</div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
