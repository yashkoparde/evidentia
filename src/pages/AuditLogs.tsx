import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Search, Calendar, User as UserIcon, Info, Shield, 
  ShieldAlert, ShieldCheck, Filter, Cpu, ExternalLink,
  Download, Trash2, CheckSquare, Square, X, Sparkles
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { formatDate, cn } from '../utils/utils';
import { logService } from '../services/logService';

export const AuditLogs: React.FC<{ onEvidenceClick: (id: string) => void }> = ({ onEvidenceClick }) => {
  const { logs, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const actionTypes = Array.from(new Set(logs.map(l => l.action)));
  const users = Array.from(new Set(logs.map(l => l.userName)));

  const filteredLogs = [...logs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(log => {
      const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) || 
                            log.userName.toLowerCase().includes(search.toLowerCase()) ||
                            (log.aiSummary && log.aiSummary.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesUser = filterUser === 'all' || log.userName === filterUser;
      
      return matchesSearch && matchesStatus && matchesAction && matchesUser;
    });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLogs.map(l => l.id));
    }
  };

  const exportToCSV = (logsToExport: typeof filteredLogs) => {
    const headers = ['ID', 'Timestamp', 'Action', 'Status', 'User', 'Details', 'AI Summary'];
    const rows = logsToExport.map(log => [
      log.id,
      log.timestamp,
      log.action,
      log.status,
      log.userName,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${(log.aiSummary || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `evidentia_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkPurge = async () => {
    if (selectedIds.length === 0 || !window.confirm(`Are you sure you want to purge ${selectedIds.length} records? This action is irreversible.`)) return;
    
    setIsDeleting(true);
    try {
      const success = await logService.deleteLogs(selectedIds);
      if (success) {
        setSelectedIds([]);
        await refreshData();
      }
    } catch (error) {
      console.error('Purge failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-evidentia-accent animate-pulse" />
            <span className="text-[10px] font-mono text-evidentia-accent uppercase tracking-widest">Bureau Custody Ledger [Alpha]</span>
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic">Audit Chain</h1>
          <p className="text-xs font-mono text-white/40 uppercase tracking-[0.3em] mt-1">Evidentia | Institutional Event Log</p>
        </div>
        
        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH..."
              className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-9 pr-4 text-[10px] font-mono focus:border-evidentia-accent outline-none transition-all placeholder:text-white/10"
            />
          </div>

          <div className="relative">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={cn(
                "w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-[10px] font-mono appearance-none focus:border-evidentia-accent outline-none cursor-pointer uppercase tracking-widest transition-all",
                filterStatus !== 'all' ? "text-evidentia-accent border-evidentia-accent/40 bg-evidentia-accent/5" : "text-white/60"
              )}
            >
              <option value="all">STATUS: ALL</option>
              <option value="success">SUCCESS</option>
              <option value="warning">WARNING</option>
              <option value="alert">ALERT</option>
            </select>
            <Filter className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none", filterStatus !== 'all' && "text-evidentia-accent")} />
          </div>

          <div className="relative">
            <select 
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className={cn(
                "w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-[10px] font-mono appearance-none focus:border-evidentia-accent outline-none cursor-pointer uppercase tracking-widest transition-all",
                filterUser !== 'all' ? "text-evidentia-accent border-evidentia-accent/40 bg-evidentia-accent/5" : "text-white/60"
              )}
            >
              <option value="all">USER: ALL</option>
              {users.map(u => <option key={u} value={u}>{u.split(' ')[0]}</option>)}
            </select>
            <UserIcon className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none", filterUser !== 'all' && "text-evidentia-accent")} />
          </div>

          <div className="relative">
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className={cn(
                "w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-[10px] font-mono appearance-none focus:border-evidentia-accent outline-none cursor-pointer uppercase tracking-widest transition-all",
                filterAction !== 'all' ? "text-evidentia-accent border-evidentia-accent/40 bg-evidentia-accent/5" : "text-white/60"
              )}
            >
              <option value="all">ACTION: ALL</option>
              {actionTypes.map(a => (
                <option key={a} value={a}>
                  {a.toUpperCase().replace('_', ' ')}
                </option>
              ))}
            </select>
            <Cpu className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none", filterAction !== 'all' && "text-evidentia-accent")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <GlassCard className="relative p-0 overflow-visible" 
            title={
              <div className="flex items-center gap-4">
                <span>Chain Records</span>
                {filteredLogs.length > 0 && (
                  <button 
                    onClick={() => exportToCSV(filteredLogs)}
                    className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white/60 hover:text-white transition-all uppercase tracking-widest"
                  >
                    <Download className="w-3 h-3" /> Export View
                  </button>
                )}
              </div>
            }
          >
            <div className="p-8 space-y-0 relative">
              <div className="absolute left-[39px] top-12 bottom-12 w-[1px] bg-white/5 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />

              <div className="flex items-center justify-between mb-8 pl-12">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-[10px] font-mono text-white/40 hover:text-white transition-all uppercase tracking-widest"
                  >
                    {selectedIds.length === filteredLogs.length && filteredLogs.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-evidentia-accent" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Select All
                  </button>
                  {selectedIds.length > 0 && (
                    <span className="text-[10px] font-mono text-evidentia-accent uppercase tracking-widest">
                      {selectedIds.length} Selected
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {selectedIds.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3"
                    >
                      <button 
                        onClick={() => exportToCSV(logs.filter(l => selectedIds.includes(l.id)))}
                        className="flex items-center gap-2 px-3 py-1.5 bg-evidentia-accent/10 border border-evidentia-accent/30 rounded text-[10px] font-mono text-evidentia-accent hover:bg-evidentia-accent/20 transition-all uppercase tracking-widest"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Selected
                      </button>
                      <button 
                        onClick={handleBulkPurge}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-3 py-1.5 bg-evidentia-danger/10 border border-evidentia-danger/30 rounded text-[10px] font-mono text-evidentia-danger hover:bg-evidentia-danger/20 transition-all uppercase tracking-widest disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Purging...' : 'Purge Selected'}
                      </button>
                      <button 
                        onClick={() => setSelectedIds([])}
                        className="p-1.5 bg-white/5 border border-white/10 rounded text-white/40 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="py-20 text-center pl-12">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">No matching records found in this segment</p>
                </div>
              ) : (
                filteredLogs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-8 group relative mb-8 last:mb-0"
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 cursor-pointer",
                        selectedIds.includes(log.id) ? 'bg-evidentia-accent border-evidentia-accent text-black' : 
                        log.status === 'success' ? 'bg-evidentia-success/10 border border-evidentia-success/40 text-evidentia-success' : 
                        log.status === 'alert' ? 'bg-evidentia-danger/20 border border-evidentia-danger shadow-[0_0_10px_rgba(255,59,59,0.3)] text-evidentia-danger' : 
                        'bg-evidentia-violet/10 border border-evidentia-violet/40 text-evidentia-violet'
                      )} onClick={() => toggleSelect(log.id)}>
                        {selectedIds.includes(log.id) ? <CheckSquare className="w-3.5 h-3.5" /> :
                         log.status === 'success' ? <ShieldCheck className="w-3.5 h-3.5" /> : 
                         log.status === 'alert' ? <ShieldAlert className="w-3.5 h-3.5" /> : 
                         <Shield className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="flex-1 pb-4 border-b border-white/5 group-hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-xs font-mono font-black uppercase tracking-[0.15em]",
                            log.status === 'alert' ? 'text-evidentia-danger text-glow' : 'text-white'
                          )}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-white/40 tracking-wider">
                            LOG_ID_{log.id.substring(0, 8).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(new Date(log.timestamp))}</span>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <p className="text-sm text-white/70 font-light leading-relaxed">
                            {log.details}
                          </p>
                          
                          {(log.action === 'upload' || log.action === 'verify') && log.aiSummary && (
                            <div className="p-3 bg-evidentia-accent/5 border border-evidentia-accent/10 rounded group/ai relative">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="p-1 rounded bg-evidentia-accent/20">
                                  <Sparkles className="w-2.5 h-2.5 text-evidentia-accent" />
                                </div>
                                <span className="text-[9px] font-mono text-evidentia-accent uppercase tracking-[0.2em] font-bold">Forensic AI Summary</span>
                              </div>
                              <p className="text-[11px] text-white/80 italic leading-relaxed">
                                "{log.aiSummary}"
                              </p>
                            </div>
                          )}
                        </div>

                        {log.evidenceId && (
                          <button 
                            onClick={() => onEvidenceClick(log.evidenceId!)}
                            className="flex items-center gap-2 px-3 py-1 bg-evidentia-accent/10 border border-evidentia-accent/30 rounded text-[10px] font-mono text-evidentia-accent hover:bg-evidentia-accent/20 transition-all uppercase opacity-0 group-hover:opacity-100 h-fit whitespace-nowrap"
                          >
                            Inspection <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20">
                          <UserIcon className="w-3 h-3" />
                          <span>Operator: {log.userName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20">
                          <Activity className="w-3 h-3" />
                          <span>Node: SERVER_FRNS_5</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <GlassCard title="Chain Summary">
            <div className="space-y-6">
              <div className="p-4 bg-evidentia-success/5 border border-evidentia-success/20 rounded-lg">
                <div className="text-[10px] font-mono text-evidentia-success uppercase mb-1 tracking-widest">Immutable Parity</div>
                <div className="text-lg font-display font-bold text-white">SYNCED_100%</div>
              </div>
              
              <div className="space-y-4">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest px-1">Log Distribution</div>
                <div className="space-y-2">
                  <DistributionBar label="Forensic Uploads" count={logs.filter(l => l.action === 'upload').length} total={logs.length} color="bg-evidentia-accent" />
                  <DistributionBar label="Integrity Scans" count={logs.filter(l => l.action === 'verify').length} total={logs.length} color="bg-evidentia-success" />
                  <DistributionBar label="Session Access" count={logs.filter(l => l.action === 'access').length} total={logs.length} color="bg-white" />
                  <DistributionBar label="Admin & System" count={logs.filter(l => ['delete', 'system_boot'].includes(l.action)).length} total={logs.length} color="bg-evidentia-violet" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <Info className="w-4 h-4 text-white/40" />
                  </div>
                  <p className="text-[9px] font-mono text-white/40 uppercase leading-relaxed tracking-wider">
                    All logs are cryptographically hashed and mirrored across 3 distributed validators.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const DistributionBar: React.FC<{ label: string, count: number, total: number, color: string }> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest text-white/60">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
};
