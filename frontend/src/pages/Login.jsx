import React, { useState } from 'react';
import { Radar, Lock, User, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('netrecon_token', res.data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError('Invalid username or password credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto bg-blue-600/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400 shadow-lg">
            <Radar className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">NETRECON</h1>
          <p className="text-xs text-blue-400 font-mono tracking-widest uppercase">Network Reconnaissance & Security Dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300 text-xs text-center font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all border border-blue-400/30 shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Authenticating...' : 'Access SOC Console'}
          </button>
        </form>

        <div className="p-3 bg-[#0B0F19] border border-[#1F2937] rounded-lg text-center text-[10px] text-gray-500 font-mono">
          Default Admin: <span className="text-gray-300">admin / admin123</span>
        </div>
      </div>
    </div>
  );
}
