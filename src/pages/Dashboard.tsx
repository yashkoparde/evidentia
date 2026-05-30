import React from 'react';
import { motion } from 'motion/react';
import { FileText, ShieldCheck, AlertTriangle, Cpu, TrendingUp, Video, Music, Archive, File, Activity } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { formatDate, getFileIcon } from '../utils/utils';

export const Dashboard: React.FC<{ onEvidenceClick: (id: string) => void }> = ({ onEvidenceClick }) => {
  const { evidenceList, logs, refreshData } = useApp();

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const stats = [
    { label: 'Files Uploaded', value: evidenceList.length, icon: FileText, color: 'text-evidentia-accent' },
    { label: 'Verified Integrity', value: evidenceList.filter(e => e.status === 'verified').length, icon: ShieldCheck, color: 'text-evidentia-success' },
    { label: 'Tamper Alerts', value: evidenceList.filter(e => e.status === 'tampered').length, icon: AlertTriangle, color: 'text-evidentia-danger' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-evidentia-accent/40" />
            <span className="text-[10px] font-mono text-evidentia-accent uppercase tracking-[0.3em]">Institutional Access</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase italic">Operative Command</h1>
          <p className="text-xs font-mono text-white/40 uppercase tracking-[0.3em] mt-1">Evidentia Centralized Digital Evidence Repository (CDER)</p>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 bg-evidentia-accent/5 rounded border border-evidentia-accent/10">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-white/40 uppercase">Clearance Level</span>
            <span className="text-[10px] font-mono text-evidentia-accent uppercase font-black">Level Alpha-4</span>
          </div>
          <div className="w-1 h-8 bg-evidentia-accent/20" />
          <Activity className="w-5 h-5 text-evidentia-accent animate-pulse" />
        </div>
      </header>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <GlassCard key={i} delay={i * 0.1}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-3xl font-display font-bold text-white">
                  <Counter value={stat.value} />
                </h4>
              </div>
              <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-evidentia-success" />
              <span className="text-[10px] font-mono text-evidentia-success uppercase tracking-widest">Core Sync Active</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Activity */}
        <div>
          <GlassCard title="Recent Activity Log">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {evidenceList.slice(0, 8).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onEvidenceClick(ev.id)}
                  className="group flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-evidentia-accent transition-all cursor-pointer overflow-hidden"
                >
                  <div className="w-20 h-20 shrink-0 bg-black/40 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center relative">
                    {ev.thumbnail ? (
                      <img src={ev.thumbnail} alt={ev.title} className="w-full h-full object-cover" />
                    ) : (
                      React.createElement(getFileIcon(ev.fileType, ev.fileName), { className: "w-8 h-8 text-white/20" })
                    )}
                    <div className="absolute top-1 right-1">
                      {React.createElement(getFileIcon(ev.fileType, ev.fileName), { className: "w-3 h-3 text-evidentia-accent/40" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-mono text-evidentia-accent uppercase tracking-widest">{ev.caseId}</span>
                      <span className={`w-2 h-2 rounded-full ${ev.status === 'verified' ? 'bg-evidentia-success' : 'bg-white/20'}`} />
                    </div>
                    <h5 className="text-sm font-bold text-white truncate">{ev.title}</h5>
                    <p className="text-[10px] text-white/40 line-clamp-2 mt-1">{ev.description}</p>
                    <div className="mt-2 text-[8px] font-mono text-white/20 uppercase">
                      {formatDate(new Date(ev.createdAt))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const Counter: React.FC<{ value: number }> = ({ value }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    let totalDuration = 1000;
    let incrementTime = (totalDuration / end) > 10 ? (totalDuration / end) : 10;

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
};
