import React, { useState, useEffect } from 'react';
import { Shield, Clock, Search, Upload, LogOut, LayoutDashboard, FileText, Activity, Menu, X, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/utils';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';
import { blockchainService } from '../services/blockchainService';
import { storageService } from '../services/storageService';

export const Sidebar: React.FC<{ activeTab: string, setTab: (tab: string) => void }> = ({ activeTab, setTab }) => {
  const { logout, currentUser, evidenceList } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'upload', icon: Upload, label: 'New Upload' },
    { id: 'verify', icon: Search, label: 'Verify Records', count: evidenceList.length },
    { id: 'logs', icon: Activity, label: 'Activity Log' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen bg-black/40 border-r border-evidentia-border flex flex-col z-50 overflow-hidden"
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded bg-evidentia-accent/20 border border-evidentia-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]">
              <Shield className="w-5 h-5 text-evidentia-accent" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold tracking-tighter text-lg leading-none">Evidentia</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#00F0FF]/60">Secure Ledger</span>
            </div>
          </motion.div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative",
              activeTab === item.id 
                ? "bg-evidentia-accent/10 text-evidentia-accent border border-evidentia-accent/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "text-evidentia-accent" : "group-hover:text-white")} />
            {!collapsed && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-left whitespace-pre-line leading-tight">
                {item.label}
              </span>
            )}
            {!collapsed && item.count !== undefined && item.count > 0 && (
              <span className="ml-auto bg-evidentia-accent/20 text-evidentia-accent border border-evidentia-accent/30 text-[8px] font-mono px-1.5 py-0.5 rounded-full">
                {item.count}
              </span>
            )}
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeSide"
                className="absolute left-0 w-1 h-6 bg-evidentia-accent rounded-r-full" 
              />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 text-evidentia-danger hover:bg-evidentia-danger/10 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-mono text-sm uppercase tracking-wider">De-authorize</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export const TopBar: React.FC<{ title: string, showUser?: boolean }> = ({ title, showUser = true }) => {
  const { addNotification, currentUser } = useApp();
  const [time, setTime] = useState(new Date());
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const connectWallet = async () => {
    const address = await blockchainService.connectWallet();
    if (address) {
      setWalletAddress(address);
      addNotification(`Wallet Linked: ${address.substring(0, 6)}...${address.substring(38)}`, 'success');
      
      // Link to user profile in Supabase
      if (currentUser?.id) {
        await storageService.updateProfile(currentUser.id, { wallet_address: address });
      }
    } else {
      addNotification('Could not connect wallet. Ensure MetaMask is installed.', 'alert');
    }
  };

  return (
    <header className="h-16 border-b border-evidentia-border bg-black/20 flex items-center justify-between px-8 z-40 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-white/50">{title}</h2>
      </div>

      <div className="flex items-center gap-8">
        {showUser && (
          <button 
            onClick={connectWallet}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded border font-mono text-[9px] uppercase tracking-widest transition-all",
              walletAddress 
                ? "bg-evidentia-accent/10 border-evidentia-accent/40 text-evidentia-accent" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <Wallet className="w-3 h-3" />
            {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Connect Wallet'}
          </button>
        )}
        <div className="flex items-center gap-2 font-mono text-sm text-evidentia-accent">
          <Clock className="w-4 h-4" />
          <span>{formatTime(time)}</span>
        </div>
        <div className="w-10 h-10 rounded-full border border-evidentia-accent/20 bg-evidentia-accent/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-evidentia-accent" />
        </div>
      </div>
    </header>
  );
};
