import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SOCLayout from './layouts/SOCLayout';
import Dashboard from './pages/Dashboard';
import Scans from './pages/Scans';
import Hosts from './pages/Hosts';
import PortsServices from './pages/PortsServices';
import NetworkMap from './pages/NetworkMap';
import Findings from './pages/Findings';
import Reports from './pages/Reports';
import ScanHistory from './pages/ScanHistory';
import Settings from './pages/Settings';
import Login from './pages/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
        
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <SOCLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/scans" element={<Scans />} />
                  <Route path="/hosts" element={<Hosts />} />
                  <Route path="/ports-services" element={<PortsServices />} />
                  <Route path="/network-map" element={<NetworkMap />} />
                  <Route path="/findings" element={<Findings />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/history" element={<ScanHistory />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </SOCLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
