/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './pages/Login';
import { Sidebar, TopBar } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Verify } from './pages/Verify';
import { AuditLogs } from './pages/AuditLogs';
import { EvidenceDetail } from './pages/EvidenceDetail';
import { NotificationSystem } from './components/NotificationSystem';
import { AnimatePresence, motion } from 'motion/react';

const AppContent: React.FC = () => {
  const { currentUser, isLoading, configError, activeTab, setActiveTab } = useApp();
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  // Check for public share link on initial load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publicEvidenceId = params.get('evidence');
    if (publicEvidenceId) {
      setSelectedEvidenceId(publicEvidenceId);
    }
  }, []);

  if (configError) {
    return (
      <div className="h-screen w-screen bg-evidentia-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-[50px] rounded-full animate-pulse" />
            <div className="relative w-20 h-20 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-red-500 text-4xl">!</span>
            </div>
          </div>
          <h1 className="text-2xl font-serif tracking-widest text-white uppercase italic">Critical Configuration Failure</h1>
          <p className="text-sm font-mono text-white/60 leading-relaxed">
            {configError}
          </p>
          <div className="h-[1px] w-full bg-white/10" />
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-tighter italic">
            * Protocol 44.B Required: Ensure all environment variables are synchronized with the cloud provider terminal.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-evidentia-bg flex flex-col items-center justify-center space-y-4">
        <div className="w-48 h-1 bg-white/10 overflow-hidden rounded-full relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 h-full w-1/2 bg-evidentia-accent shadow-[0_0_15px_#00F0FF]"
          />
        </div>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.5em] animate-pulse">Initializing Terminal...</p>
      </div>
    );
  }

  // Determine if we are in public mode (viewing evidence via link without login)
  const isPublicMode = !currentUser && !!selectedEvidenceId;

  if (!currentUser && !selectedEvidenceId) {
    return <Login />;
  }

  const handleEvidenceClick = (id: string) => {
    setSelectedEvidenceId(id);
  };

  const renderContent = () => {
    if (selectedEvidenceId) {
      return (
        <EvidenceDetail 
          evidenceId={selectedEvidenceId} 
          onBack={() => {
            if (isPublicMode) {
              // Redirect to login if they try to "go back" from a public link
              window.location.href = '/';
            } else {
              setSelectedEvidenceId(null);
            }
          }}
          isPublic={isPublicMode}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard onEvidenceClick={handleEvidenceClick} />;
      case 'upload': return <Upload />;
      case 'verify': return <Verify onEvidenceClick={handleEvidenceClick} />;
      case 'logs': return <AuditLogs onEvidenceClick={handleEvidenceClick} />;
      default: return <Dashboard onEvidenceClick={handleEvidenceClick} />;
    }
  };

  const getPageTitle = () => {
    if (selectedEvidenceId) return 'ARTIFACT_DETAILS';
    switch (activeTab) {
      case 'dashboard': return 'DASHBOARD';
      case 'upload': return 'NEW_UPLOAD';
      case 'verify': return 'VERIFY_INTEGRITY';
      case 'logs': return 'ACTIVITY_LOG';
      default: return 'SYSTEM';
    }
  };

  return (
    <div className="flex h-screen bg-evidentia-bg overflow-hidden font-sans">
      <NotificationSystem />
      {!isPublicMode && (
        <Sidebar activeTab={activeTab} setTab={(t) => { setActiveTab(t); setSelectedEvidenceId(null); }} />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 relative grid-bg">
        <TopBar title={isPublicMode ? 'PUBLIC_ACCESS_VERIFIED' : getPageTitle()} showUser={!isPublicMode} />
        
        <main className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedEvidenceId ? 'detail' : activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
