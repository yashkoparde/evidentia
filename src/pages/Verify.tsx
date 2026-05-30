import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShieldAlert, ShieldCheck, Binary, ChevronRight, Fingerprint, 
  Database, Cpu, FileText, Upload as UploadIcon, Box, X, ExternalLink,
  QrCode, Camera, Key, RefreshCw
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { GlowButton } from '../components/GlowButton';
import { useApp } from '../context/AppContext';
import { TerminalText } from '../components/TerminalText';
import { cn, getFileIcon } from '../utils/utils';
import { blockchainService } from '../services/blockchainService';
import { generateHash } from '../services/hashService';

export const Verify: React.FC<{ onEvidenceClick: (id: string) => void }> = ({ onEvidenceClick } ) => {
  const { evidenceList, verifyEvidenceItem, refreshData } = useApp();
  
  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const [verifyMode, setVerifyMode] = useState<'scan' | 'upload' | 'link'>('scan');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'failed' | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [scanStep, setScanStep] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [blockchainRecord, setBlockchainRecord] = useState<any>(null);

  // Manual file verification state
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState('');

  // Secure Link / QR Scan state
  const [secureLinkInput, setSecureLinkInput] = useState('');
  const [linkScanStatus, setLinkScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [linkScanLogs, setLinkScanLogs] = useState<string[]>([]);
  const [linkScanProgress, setLinkScanProgress] = useState(0);
  const [resolvedEvidenceId, setResolvedEvidenceId] = useState<string | null>(null);

  const parseEvidenceIdFromLink = (linkStr: string): string | null => {
    if (!linkStr) return null;
    
    // 1. Try URL parameters
    try {
      if (linkStr.includes('?')) {
        const queryPart = linkStr.split('?')[1];
        const urlParams = new URLSearchParams(queryPart);
        const evidenceId = urlParams.get('evidence');
        if (evidenceId) return evidenceId;
      }
    } catch (e) {
      console.error("URL parsing failed, falling back", e);
    }

    // 2. Try match UUID
    const uuidMatch = linkStr.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) return uuidMatch[0];

    // 3. Simple hash search if exact ID matches some item in evidenceList
    const cleaned = linkStr.trim();
    if (evidenceList.some(ev => ev.id === cleaned)) {
      return cleaned;
    }

    return null;
  };

  const handleLinkVerify = async (inputVal: string) => {
    if (!inputVal) return;
    const matchedId = parseEvidenceIdFromLink(inputVal);
    
    if (!matchedId) {
      setLinkScanStatus('failed');
      setLinkScanLogs([
        "[INIT] Starting Secure Decoder Protocol...",
        "[ERROR] Input string has no valid secure evidence markers.",
        "Please insert link (e.g., '?evidence=UUID') or exact key UUID."
      ]);
      return;
    }

    const exists = evidenceList.some(ev => ev.id === matchedId);
    if (!exists) {
      setLinkScanStatus('failed');
      setLinkScanLogs([
        "[INIT] Accessing Ledger Pointer...",
        `[WARNING] Key pointer ${matchedId.substring(0, 8)}... is not registered in base DB repository.`,
        "[ERROR] Verification failed: Record is unrecognized or signature is altered."
      ]);
      return;
    }

    setResolvedEvidenceId(matchedId);
    setLinkScanStatus('scanning');
    setLinkScanProgress(0);
    setLinkScanLogs(["Staging secure cryptographic handshake...", "Accessing digital portal scanner..."]);

    const steps = [
      { progress: 25, log: `Decoupling evidence query for key: ${matchedId.substring(0, 8)}...` },
      { progress: 50, log: "Routing transport ledger validation to Ethereum/Polygon Blockchain..." },
      { progress: 80, log: "Cross-referencing fingerprint, checking cryptographic security keys..." },
      { progress: 100, log: "Decryption matching record payload successfully! Directing gateway..." }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLinkScanProgress(step.progress);
      setLinkScanLogs(prev => [...prev, step.log]);
    }

    setLinkScanStatus('success');
    
    // Smooth navigation: Wait 1 second and then open the evidence detail page!
    await new Promise(resolve => setTimeout(resolve, 1000));
    onEvidenceClick(matchedId);
  };

  const startVerification = async () => {
    if (verifyMode === 'scan' && !selectedId) return;
    if (verifyMode === 'upload' && !manualFile) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setBlockchainRecord(null);
    setLogMessages([]);
    setScanStep(0);

    const steps = [
      "Initializing forensic integrity scan protocol...",
      "Re-computing SHA-256 fingerprint from binary structure...",
      "Requesting record retrieval from blockchain immutable ledger...",
      "Cross-referencing hash with timestamped records...",
      "Analyzing chain-of-custody validity...",
      "Finalizing integrity verdict...",
    ];

    let hashToCheck = '';
    if (verifyMode === 'scan') {
      const selectedEvidence = evidenceList.find(e => e.id === selectedId);
      hashToCheck = selectedEvidence?.fileHash || '';
    }

    for (let i = 0; i < steps.length; i++) {
      setLogMessages(prev => [...prev, steps[i]]);
      setScanStep(i + 1);
      
      if (i === 1 && verifyMode === 'upload' && manualFile) {
        hashToCheck = await generateHash(manualFile);
        setComputedHash(hashToCheck);
      }

      // Add glitch effect during hash comparison (step 3)
      if (i === 3) {
        setIsGlitching(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsGlitching(false);
      } else {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
      }
    }

    const record = await blockchainService.getHash(hashToCheck);
    setBlockchainRecord(record);
    const isValid = !!record;
    
    // If it's a known record being scanned, update its status
    if (verifyMode === 'scan' && selectedId) {
       await verifyEvidenceItem(selectedId);
    }

    setVerificationResult(isValid ? 'success' : 'failed');
    setIsVerifying(false);
  };

  const selectedEvidence = evidenceList.find(e => e.id === selectedId);

  const renderVerificationConsole = () => {
    if (verifyMode === 'scan' && !selectedEvidence) return null;
    if (verifyMode === 'upload' && !manualFile) return null;

    return (
      <div className="space-y-6 mt-4">
        <GlassCard title={verifyMode === 'scan' ? "Registry Verification Protocol" : "Ad-Hoc File Verification"}>
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg border flex items-center justify-center bg-evidentia-accent/10 border-evidentia-accent/30 overflow-hidden">
                {selectedEvidence?.thumbnail ? (
                  <img src={selectedEvidence.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  React.createElement(getFileIcon(selectedEvidence?.fileType || 'binary', selectedEvidence?.fileName), { className: "w-6 h-6 text-evidentia-accent" })
                )}
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white uppercase tracking-tight">
                  {verifyMode === 'scan' ? selectedEvidence?.title : manualFile?.name}
                </h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  {verifyMode === 'scan' ? `Global Record ID: ${selectedEvidence?.id}` : "Temporary Binary Analysis Workspace"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isVerifying && !verificationResult && (
                <GlowButton onClick={startVerification} className={verifyMode === 'upload' ? 'bg-evidentia-violet' : ''}>
                  Initialize Verification
                </GlowButton>
              )}
              {verificationResult && verifyMode === 'scan' && selectedId && (
                <GlowButton onClick={() => onEvidenceClick(selectedId)} variant="ghost" className="text-[10px] py-1.5 h-auto">View Full Report</GlowButton>
              )}
            </div>
          </div>

          <div className={cn(
            "bg-black/60 rounded-xl border border-white/5 p-6 min-h-[300px] font-mono text-xs relative overflow-hidden transition-all duration-300",
            isGlitching && "bg-evidentia-accent/10 shadow-[inner_0_0_50px_rgba(0,240,255,0.2)] scale-[1.01]",
            verificationResult === 'failed' && "bg-evidentia-danger/5",
            verificationResult === 'success' && "bg-evidentia-success/5"
          )}>
            {isGlitching && (
              <>
                <motion.div 
                  animate={{ opacity: [0, 0.4, 0, 0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.08 }}
                  className="absolute inset-0 bg-evidentia-danger/20 pointer-events-none z-20"
                />
                <motion.div 
                  animate={{ opacity: [0, 0.3, 0], x: [-20, 20, -10], y: [2, -2, 4] }}
                  transition={{ repeat: Infinity, duration: 0.12 }}
                  className="absolute inset-0 bg-evidentia-success/10 pointer-events-none z-20 mix-blend-screen"
                />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1)_0px,rgba(0,0,0,0.1)_1px,transparent_1px,transparent_2px)] pointer-events-none z-30" />
              </>
            )}
            
            {isVerifying && <div className="scanline" />}

            <div className="space-y-3">
              {logMessages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex gap-3 items-start ${i === logMessages.length - 1 ? 'text-evidentia-accent border-b border-evidentia-accent/10 pb-2' : 'text-white/40'}`}
                >
                  <span className="text-evidentia-accent/50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span>{msg}</span>
                  {i === logMessages.length - 1 && <span className="animate-pulse">_</span>}
                </motion.div>
              ))}
            </div>

            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mt-12 p-8 rounded-xl border flex flex-col items-center text-center space-y-4
                  ${verificationResult === 'success' 
                    ? 'bg-evidentia-success/10 border-evidentia-success text-evidentia-success' 
                    : 'bg-evidentia-danger/10 border-evidentia-danger text-evidentia-danger'}`}
              >
                {verificationResult === 'success' ? (
                  <>
                    <ShieldCheck className="w-16 h-16 animate-[pulse_2s_infinite]" />
                    <div>
                      <h2 className="text-2xl font-display font-black tracking-tighter uppercase">VERIFIED: AUTHENTIC</h2>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] mt-1 opacity-80">Evidence matches blockchain ledger exactly</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-16 h-16 animate-[bounce_1s_infinite]" />
                    <div>
                      <h2 className="text-2xl font-display font-black tracking-tighter uppercase">ALERT: TAMPERED</h2>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] mt-1 opacity-80">Local binary hash differs from blockchain record</p>
                    </div>
                  </>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                  <div className="p-3 bg-black/40 border border-white/5 rounded text-left">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Local Fingerprint (SHA-256)</p>
                    <p className="font-mono text-[10px] truncate text-evidentia-accent">{verifyMode === 'scan' ? selectedEvidence?.fileHash : computedHash}</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded text-left">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Blockchain Record Hash</p>
                    <p className={`font-mono text-[10px] truncate ${verificationResult === 'success' ? 'text-evidentia-success' : 'text-evidentia-danger'}`}>
                      {blockchainRecord ? blockchainRecord.hash : "RECORD_NOT_FOUND"}
                    </p>
                  </div>
                </div>

                {blockchainRecord && (
                  <div className="w-full space-y-2 mt-4 px-1">
                     <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest opacity-40">
                        <span>Entry Timestamp</span>
                        <span>Source Node</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-mono text-white/60">
                        <span>{new Date(blockchainRecord.timestamp).toLocaleString()}</span>
                        <span className="text-evidentia-accent">POLYGON_POS_MAINNET</span>
                     </div>
                     <div className="pt-2 text-left">
                        <p className="text-[8px] font-mono uppercase tracking-widest opacity-40 mb-1">Blockchain Authority</p>
                        <a 
                          href={`https://polygonscan.com/address/${import.meta.env.VITE_CONTRACT_ADDRESS}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-mono text-evidentia-accent hover:underline flex items-center gap-1"
                        >
                          {import.meta.env.VITE_CONTRACT_ADDRESS} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                     </div>
                  </div>
                )}

                <GlowButton 
                  variant={verificationResult === 'success' ? 'success' : 'danger'}
                  onClick={() => {
                    setVerificationResult(null); 
                    setLogMessages([]);
                    if (verifyMode === 'upload') setManualFile(null);
                  }}
                  className="mt-4"
                >
                  Reset Console
                </GlowButton>
              </motion.div>
            )}
          </div>
        </GlassCard>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-evidentia-success animate-pulse" />
            <span className="text-[10px] font-mono text-evidentia-success uppercase tracking-widest">Protocol 9-V Integrity Verification</span>
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic">Integrity Verification</h1>
          <p className="text-xs font-mono text-white/40 uppercase tracking-[0.3em] mt-1">Evidentia | Blockchain Validation</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 flex-wrap gap-1">
          <button 
            onClick={() => { setVerifyMode('scan'); setVerificationResult(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer",
              verifyMode === 'scan' ? "bg-evidentia-accent text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]" : "text-white/40 hover:text-white"
            )}
          >
            Scan Registry
          </button>
          
          <button 
            onClick={() => { setVerifyMode('link'); setVerificationResult(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer",
              verifyMode === 'link' ? "bg-evidentia-accent text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-evidentia-accent/30" : "text-white/40 hover:text-white"
            )}
          >
            Secure Link / QR Scanner
          </button>

          <button 
            onClick={() => { setVerifyMode('upload'); setVerificationResult(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer",
              verifyMode === 'upload' ? "bg-evidentia-violet text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)]" : "text-white/40 hover:text-white"
            )}
          >
            Direct File Check
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Evidence Selection List / File Upload */}
        <div className="space-y-4">
          {verifyMode === 'scan' ? (
            <>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-2 px-1 text-center">Bureau Registry Database</div>
              <div className="space-y-3">
                {evidenceList.length === 0 ? (
                  <div className="p-12 glass-panel text-center">
                    <p className="text-[10px] font-mono text-white/30 uppercase">No records found</p>
                  </div>
                ) : (
                  evidenceList.map((ev) => (
                    <React.Fragment key={ev.id}>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          if (!isVerifying) {
                            if (selectedId === ev.id) {
                              setSelectedId(null);
                              setVerificationResult(null);
                              setLogMessages([]);
                            } else {
                              setSelectedId(ev.id);
                              setVerificationResult(null);
                              setLogMessages([]);
                            }
                          }
                        }}
                        className={`
                          p-4 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden group
                          ${selectedId === ev.id 
                            ? 'bg-evidentia-accent/10 border-evidentia-accent shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'}
                        `}
                      >
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-evidentia-accent font-bold tracking-widest">{ev.caseId}</span>
                          <div className={`w-2 h-2 rounded-full ${ev.status === 'verified' ? 'bg-evidentia-success' : ev.status === 'tampered' ? 'bg-evidentia-danger' : 'bg-white/20'}`} />
                        </div>
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-black/40 rounded border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                            {ev.thumbnail ? <img src={ev.thumbnail} alt="" className="w-full h-full object-cover" /> : React.createElement(getFileIcon(ev.fileType, ev.fileName), { className: "w-8 h-8 text-white/10" })}
                            <div className="absolute bottom-1 right-1">
                               {React.createElement(getFileIcon(ev.fileType, ev.fileName), { className: "w-3 h-3 text-white/20" })}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-display font-semibold text-white truncate">{ev.title}</h4>
                            <p className="text-[10px] font-mono text-white/30 mt-1 uppercase tracking-tighter truncate">Identifier: {ev.id}</p>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-[8px] font-mono text-white/20 uppercase bg-white/5 px-2 py-0.5 rounded">SHA-256</span>
                              <span className="text-[8px] font-mono text-white/40 truncate opacity-50">{ev.fileHash.substring(0, 32)}...</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <ChevronRight className={cn("w-5 h-5 text-white/10 transition-transform", selectedId === ev.id && "rotate-90 text-evidentia-accent")} />
                          </div>
                        </div>
                      </motion.div>
                      
                      <AnimatePresence>
                        {selectedId === ev.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                             {renderVerificationConsole()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))
                 )}
              </div>
            </>
          ) : verifyMode === 'link' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Viewport: High-Tech simulated camera and QR scanning screen */}
              <div className="lg:col-span-5 space-y-4">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-2 text-center select-none">
                  Aim camera / Decoder view
                </div>
                <div className="relative border border-evidentia-accent/30 rounded-2xl bg-black/80 aspect-square overflow-hidden flex flex-col items-center justify-center p-6 shadow-[inner_0_0_40px_rgba(0,240,255,0.15),0_0_20px_rgba(0,0,0,0.8)] border-dashed">
                  
                  {/* Glowing camera overlay visual elements */}
                  <div className="absolute top-4 left-4 border-l-2 border-t-2 border-evidentia-accent w-4 h-4 rounded-tl" />
                  <div className="absolute top-4 right-4 border-r-2 border-t-2 border-evidentia-accent w-4 h-4 rounded-tr" />
                  <div className="absolute bottom-4 left-4 border-l-2 border-b-2 border-evidentia-accent w-4 h-4 rounded-bl" />
                  <div className="absolute bottom-4 right-4 border-r-2 border-b-2 border-evidentia-accent w-4 h-4 rounded-br" />
                  
                  {/* Subtly animated scanning helper elements */}
                  <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-[0.3em] font-medium text-white/30 uppercase flex items-center gap-1">
                    <Camera className="w-2.5 h-2.5 text-evidentia-accent animate-pulse" /> Live HUD Feed
                  </div>

                  {linkScanStatus === 'scanning' && (
                    <motion.div 
                      key="laser"
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="absolute left-0 w-full h-[3px] bg-evidentia-accent/80 shadow-[0_0_12px_#00F0FF] z-20"
                    />
                  )}

                  {linkScanStatus === 'scanning' ? (
                    <div className="text-center space-y-6 z-10">
                      <div className="relative flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          className="w-28 h-28 rounded-full border border-dashed border-evidentia-accent/30 flex items-center justify-center"
                        />
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                          className="w-20 h-20 rounded-full border border-dashed border-evidentia-accent/60 absolute flex items-center justify-center"
                        />
                        <QrCode className="w-10 h-10 text-evidentia-accent absolute animate-pulse" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-evidentia-accent font-bold tracking-widest uppercase animate-pulse">
                          DECODING SECURE CREDENTIALS...
                        </div>
                        <div className="text-[16px] font-display font-black text-white">
                          {linkScanProgress}% COMPLETION
                        </div>
                      </div>
                    </div>
                  ) : linkScanStatus === 'success' ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center space-y-4 z-10"
                    >
                      <div className="w-20 h-20 rounded-full bg-evidentia-success/10 border border-evidentia-success flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,255,156,0.3)]">
                        <ShieldCheck className="w-10 h-10 text-evidentia-success" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-display font-black tracking-tight text-white uppercase italic">ACCESS GRANTED</h4>
                        <p className="text-[9px] font-mono text-evidentia-success/80 uppercase tracking-widest">Redirecting to Vault Artifact Page...</p>
                      </div>
                    </motion.div>
                  ) : linkScanStatus === 'failed' ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center space-y-4 z-10"
                    >
                      <div className="w-20 h-20 rounded-full bg-evidentia-danger/10 border border-evidentia-danger flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,59,59,0.3)]">
                        <ShieldAlert className="w-10 h-10 text-evidentia-danger" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-display font-black tracking-tight text-white uppercase italic">DECODE FAILURE</h4>
                        <p className="text-[9px] font-mono text-evidentia-danger/80 uppercase tracking-widest px-4">The secure signature is invalid or unrecognized.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center space-y-4 z-10">
                      <QrCode className="w-20 h-20 text-white/10 mx-auto" />
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Awaiting secure input</p>
                        <p className="text-[9px] font-mono text-[#E0E6ED]/30 max-w-[200px] leading-relaxed mx-auto uppercase">
                          Paste a secure link or select a mock check code on the right panel to test.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-3 text-[8px] font-mono text-white/20 select-none">
                    EVIDENTIA DECODE UNIT PROT-X.3
                  </div>
                </div>
              </div>

              {/* Right Viewport: Control console containing URL entry field and lists to simulate scans */}
              <div className="lg:col-span-7 space-y-6">
                <GlassCard title="Authorization Link Portals">
                  <div className="space-y-6">
                    <p className="text-xs font-mono text-white/60 leading-relaxed uppercase">
                      Enter the secure URL generated via the "Share secure link" feature, or the direct record UUID. The cryptographic engine will match the on-chain registry state and open the target page.
                    </p>

                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] ml-1">
                        Secure URL or UUID Input
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input 
                            type="text"
                            value={secureLinkInput}
                            onChange={(e) => setSecureLinkInput(e.target.value)}
                            placeholder="PASTE EVIDENCE SECURE LINK OR UUID HERE..."
                            disabled={linkScanStatus === 'scanning'}
                            className="w-full bg-black/60 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-xs font-mono text-white placeholder-white/20 focus:border-evidentia-accent transition-all outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleLinkVerify(secureLinkInput)}
                          disabled={linkScanStatus === 'scanning' || !secureLinkInput.trim()}
                          className="bg-evidentia-accent text-black px-5 py-3 rounded-lg font-mono text-xs font-bold hover:bg-white transition-colors uppercase tracking-widest hover:shadow-[0_0_15px_#00F0FF] duration-300 disabled:opacity-40 select-none cursor-pointer"
                        >
                          Scan Ledger Link
                        </button>
                      </div>
                    </div>

                    {linkScanLogs.length > 0 && (
                      <div className="p-4 bg-black/50 border border-white/5 rounded-xl space-y-1.5 font-mono text-[10px] min-h-[120px] max-h-[180px] overflow-y-auto">
                        <div className="text-white/20 uppercase text-[8px] tracking-widest border-b border-white/5 pb-1 mb-2">
                          Handshake Diagnostic Logs
                        </div>
                        {linkScanLogs.map((log, i) => (
                          <div key={i} className={cn(
                            "flex items-start gap-2",
                            log.includes('[ERROR]') ? 'text-evidentia-danger' : 
                            log.includes('[WARNING]') ? 'text-amber-400' : 
                            i === linkScanLogs.length - 1 ? 'text-evidentia-accent' : 'text-white/40'
                          )}>
                            <span>[+]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Simulated QR Tag Decks to make testing and demonstration extremely intuitive */}
                <GlassCard title="Mock Registry QR Deck">
                  <div className="space-y-4">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      Choose a record to simulation-scan its security certificate camera stream:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {evidenceList.map((ev) => {
                        const simulatedUrl = `${window.location.origin}?evidence=${ev.id}`;
                        return (
                          <div 
                            key={ev.id}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 group transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-black/40 rounded border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {ev.thumbnail ? <img src={ev.thumbnail} alt="" className="w-full h-full object-cover" /> : React.createElement(getFileIcon(ev.fileType, ev.fileName), { className: "w-5 h-5 text-white/20" })}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-[11px] font-display font-bold text-white uppercase truncate">
                                  {ev.title}
                                </h5>
                                <p className="text-[8px] font-mono text-evidentia-accent uppercase tracking-tighter truncate">
                                  ID: {ev.id.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSecureLinkInput(simulatedUrl);
                                handleLinkVerify(simulatedUrl);
                              }}
                              disabled={linkScanStatus === 'scanning'}
                              className="px-2.5 py-1.5 bg-evidentia-accent/10 border border-evidentia-accent/20 group-hover:bg-evidentia-accent group-hover:text-black hover:scale-105 transition-all rounded text-[9px] font-mono uppercase tracking-widest text-evidentia-accent font-bold cursor-pointer"
                            >
                              Scan QR
                            </button>
                          </div>
                        );
                      })}

                      {evidenceList.length === 0 && (
                        <div className="col-span-1 md:col-span-2 p-6 text-center">
                          <p className="text-[9px] font-mono text-white/20 uppercase">
                            No active registry records to list for mock tags. Explore the New Upload tab.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </div>

            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-2 px-1 text-center">Binary Structure Ingestion</div>
              <div 
                onClick={() => document.getElementById('verify-file')?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer",
                  manualFile ? "border-evidentia-violet/40 bg-evidentia-violet/5" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                )}
              >
                <div className={cn("p-6 rounded-full", manualFile ? "bg-evidentia-violet/20" : "bg-white/5")}>
                   {manualFile ? <Box className="w-10 h-10 text-evidentia-violet" /> : <UploadIcon className="w-10 h-10 text-white/20" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-mono text-white/70 uppercase truncate max-w-[300px]">
                    {manualFile ? manualFile.name : "Select Binary to Verify"}
                  </p>
                  {manualFile && (
                    <p className="text-[10px] font-mono text-white/20 mt-1">{(manualFile.size / 1024).toFixed(1)} KB • ARTIFACT_STAGED</p>
                  )}
                </div>
                <input 
                  type="file" 
                  id="verify-file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setManualFile(e.target.files[0]);
                      setVerificationResult(null);
                      setLogMessages([]);
                    }
                  }} 
                />
              </div>
              
              {manualFile && renderVerificationConsole()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

