import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload as UploadIcon, File as FileIcon, X, Shield, 
  Cpu, Binary, ChevronRight, Box, Zap, Layers, ExternalLink 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '../components/GlassCard';
import { GlowButton } from '../components/GlowButton';
import { useApp } from '../context/AppContext';
import { generateHash } from '../services/hashService';
import { analyzeFile } from '../services/aiService';
import { blockchainService } from '../services/blockchainService';
import { cn } from '../utils/utils';
import { TerminalText } from '../components/TerminalText';

const HologramPreview: React.FC<{ file: File }> = ({ file }) => {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center overflow-hidden">
      {/* Laser lines */}
      <motion.div 
        animate={{ y: [0, 192, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-full h-[1px] bg-evidentia-accent shadow-[0_0_8px_#00F0FF] z-10"
      />
      
      {/* Glowing base reflection */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-evidentia-accent/20 blur-xl rounded-full" />

      {/* 3D Wireframe Container */}
      <div className="relative perspective-1000 transform-style-3d">
        <motion.div
          animate={{ rotateY: 360, rotateX: [10, -10, 10] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="relative w-24 h-32 flex items-center justify-center"
        >
          {/* Main Box Wireframe */}
          <div className="absolute inset-0 border border-evidentia-accent/40 shadow-[inset_0_0_15px_rgba(0,240,255,0.2)]">
            {/* Structural lines */}
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-evidentia-accent/20" />
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-evidentia-accent/20" />
          </div>
          
          {/* Internal abstract layers */}
          <motion.div 
            animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-20 border border-evidentia-violet/40 bg-evidentia-violet/5 flex flex-col gap-1 p-2 overflow-hidden"
          >
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-0.5 w-full bg-evidentia-violet/30 rounded-full" />
            ))}
          </motion.div>

          {/* Corner points */}
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-evidentia-accent" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-evidentia-accent" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-evidentia-accent" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-evidentia-accent" />
        </motion.div>
      </div>

      {/* Floating status text */}
      <div className="absolute top-4 right-0 font-mono text-[8px] text-evidentia-accent/60 uppercase tracking-tighter vertical-text flex flex-col gap-2">
         <span>DATA_SEGMENT_0x1</span>
         <span>LAYER_MAPPING_ACTIVE</span>
         <span>HASH_INTEGRITY_SAFE</span>
      </div>
    </div>
  );
};

export const Upload: React.FC = () => {
  const { addEvidence, setActiveTab, refreshData } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({ title: '', description: '', caseId: '' });
  const [stage, setStage] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [analysisText, setAnalysisText] = useState('');
  const [progress, setProgress] = useState(0);
  const [showHologram, setShowHologram] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
<<<<<<< HEAD
  const [uploadedId, setUploadedId] = useState('');
=======
>>>>>>> 02e00201138f1d200cbf20b6011582b008b20212

  const [finalHash, setFinalHash] = useState('');
  const [duration, setDuration] = useState<number | undefined>();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const getDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!file || !metadata.title || !metadata.caseId) return;

    setStage('analyzing');
    setShowHologram(false);
    
    // Check for duration if it's a video/audio
    let fileDuration: number | undefined = undefined;
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        fileDuration = await getDuration(file);
        setDuration(fileDuration);
    }
    // STEP 1: Hash Generation (MANDATORY)
    setAnalysisText("Generating cryptographic fingerprint...");
    const hash = await generateHash(file);
    setFinalHash(hash);
    
    // Generate thumbnail for images
    let thumbnail: string | undefined;
    if (file.type.startsWith('image/')) {
        thumbnail = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
    }

    setProgress(33);
    await new Promise(r => setTimeout(r, 1200));

    // STEP 2: Analysis
    setAnalysisText("Analyzing artifact properties...");
    const aiResults = await analyzeFile({
      title: metadata.title,
      description: metadata.description,
      type: file.type || 'binary/unknown',
      hash
    });
    setProgress(66);
    await new Promise(r => setTimeout(r, 1200));

    // STEP 3: Blockchain Commitment
    setAnalysisText("Committing hash to blockchain ledger...");
    const blockchainResult = await blockchainService.storeHash(hash);
    if (!blockchainResult.success) {
      setAnalysisText(`Blockchain error: ${blockchainResult.error}`);
      await new Promise(r => setTimeout(r, 2000));
    }
    const txHash = blockchainResult.txHash;
    setLastTxHash(txHash || null);
    setProgress(85);
    await new Promise(r => setTimeout(r, 1200));

    // STEP 4: Storage
    setAnalysisText("Syncing record with indexed database...");
    const id = crypto.randomUUID();
<<<<<<< HEAD
    setUploadedId(id);
=======
>>>>>>> 02e00201138f1d200cbf20b6011582b008b20212
    
    try {
      await addEvidence({
        id,
        title: metadata.title,
        description: metadata.description,
        caseId: metadata.caseId,
        fileName: file.name,
        fileSize: file.size,
        fileType: aiResults.fileType || file.type || 'unknown',
        aiSummary: aiResults.summary,
        aiRiskScore: aiResults.riskScore,
        aiObservations: aiResults.observations,
        fileHash: hash,
        blockchainHash: txHash || `0x${hash.substring(0, 32)}...`,
        status: txHash ? 'verified' : 'pending',
        thumbnail,
        thumbnailType: file.type,
        duration: fileDuration,
        createdAt: new Date().toISOString(),
        linkedCases: [metadata.caseId]
      }, file);
      
      setProgress(100);
      await new Promise(r => setTimeout(r, 1000));
      setStage('complete');
    } catch (error: any) {
      console.error('Ingestion failed:', error);
      let errorMsg = error.message || 'Unknown network error';
      if (errorMsg.includes('storage_path')) {
        errorMsg = "Critical Component Missing: 'storage_path' column not found in database. Please run the FIX_STORAGE_PROTOCOL.sql script in your Supabase SQL editor.";
      } else if (errorMsg.includes('evidence_user_id_fkey')) {
        errorMsg = "Relational Identity Mismatch: Your user profile wasn't found in the database. Please run the FIX_PROFILES.sql script in your Supabase SQL editor to synchronize your identity.";
      }
      setAnalysisText(`Sync failed: ${errorMsg}`);
      // Keep at same stage to let user read the error
      setTimeout(() => {
        if (stage === 'analyzing') setStage('idle');
      }, 8000);
    }
  };

  const reset = () => {
    setFile(null);
    setMetadata({ title: '', description: '', caseId: '' });
    setStage('idle');
    setProgress(0);
    setShowHologram(false);
<<<<<<< HEAD
    setUploadedId('');
=======
>>>>>>> 02e00201138f1d200cbf20b6011582b008b20212
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in slide-in-from-bottom duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-evidentia-accent animate-pulse" />
            <span className="text-[10px] font-mono text-evidentia-accent uppercase tracking-widest">Protocol 7-B Secure Ingestion</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase italic">Artifact Intake</h1>
          <p className="text-xs font-mono text-white/40 uppercase tracking-[0.3em] mt-1">Evidentia | Digital Forensic Unit</p>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {stage === 'idle' ? (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-8"
          >
            <div className="md:col-span-3 space-y-6">
              <GlassCard title="Upload Hub">
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => !file && document.getElementById('file-input')?.click()}
                  className={`
                    mt-4 border-2 border-dashed rounded-xl p-12 transition-all duration-500 flex flex-col items-center justify-center gap-4 group cursor-pointer relative overflow-hidden
                    ${file ? 'border-evidentia-success/40 bg-evidentia-success/5' : 'border-white/10 hover:border-evidentia-accent/40 bg-white/20 hover:bg-evidentia-accent/5'}
                  `}
                >
                  <AnimatePresence>
                    {showHologram && file && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-[#05070A]/90 backdrop-blur-md flex items-center justify-center"
                      >
                         <button 
                          onClick={() => setShowHologram(false)}
                          className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10"
                         >
                           <X className="w-4 h-4 text-white/40" />
                         </button>
                         {file.type.startsWith('image/') ? (
                           <img src={URL.createObjectURL(file)} alt="Preview" className="max-w-[80%] max-h-[80%] object-contain" />
                         ) : (
                           <HologramPreview file={file} />
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`p-4 rounded-full transition-transform duration-500 ${file ? 'bg-evidentia-success/20 -translate-y-1' : 'bg-white/5 group-hover:scale-110'}`}>
                    {file ? <Shield className="w-8 h-8 text-evidentia-success" /> : <UploadIcon className="w-8 h-8 text-white/40" />}
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <p className="font-mono text-sm uppercase tracking-widest text-white/80">
                        {file ? file.name : "Secure Drag & Drop Zone"}
                      </p>
                      {file && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowHologram(!showHologram); }}
                          className={cn(
                            "p-1.5 rounded transition-colors bg-evidentia-accent/10 border border-evidentia-accent/30 text-evidentia-accent group/holo",
                            showHologram && "bg-evidentia-accent text-white"
                          )}
                          title="Holographic Structure View"
                        >
                          <Box className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-white/30 uppercase mt-2 tracking-tighter">
                      {file ? `${(file.size / 1024).toFixed(2)} KB • ${file.type || 'RAW'}` : "Drop evidence file for ingestion"}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    id="file-input" 
                    className="hidden" 
                    onChange={(e) => e.target.files && setFile(e.target.files[0])} 
                  />
                  {!file && (
                    <GlowButton 
                      variant="ghost" 
                      className="text-[10px] py-1.5 px-4 h-auto mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('file-input')?.click();
                      }}
                    >
                      Browse Local Storage
                    </GlowButton>
                  )}
                  {file && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }} 
                      className="text-[10px] font-mono text-evidentia-danger uppercase tracking-widest hover:underline mt-2 relative z-30"
                    >
                      Clear Cache
                    </button>
                  )}
                </div>
              </GlassCard>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                  <Binary className="w-5 h-5 text-evidentia-accent" />
                  <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest leading-none">
                    Binary Integrity<br/><span className="text-evidentia-accent">ENABLED</span>
                  </div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-evidentia-violet" />
                  <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest leading-none">
                    AI Auto-Scan<br/><span className="text-evidentia-violet">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <GlassCard title="Metadata Mapping">
                <form 
                  className="space-y-4 mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpload();
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Case Identifier</label>
                    <input 
                      type="text" 
                      value={metadata.caseId}
                      onChange={(e) => setMetadata({...metadata, caseId: e.target.value})}
                      placeholder="CASE-XXXX-2024"
                      className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-xs font-mono tracking-wider focus:border-evidentia-accent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Evidence Title</label>
                    <input 
                      type="text" 
                      value={metadata.title}
                      onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                      placeholder="SURVEILLANCE_LOG.LOG"
                      className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-xs font-mono tracking-wider focus:border-evidentia-accent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Incident Brief</label>
                    <textarea 
                      rows={3}
                      value={metadata.description}
                      onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                      placeholder="Enter incident context..."
                      className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-xs font-mono tracking-wider focus:border-evidentia-accent outline-none transition-all resize-none"
                    />
                  </div>
                  <GlowButton 
                    type="submit"
                    disabled={!file || !metadata.title || !metadata.caseId}
                    className="w-full py-3 mt-4 text-xs font-bold"
                  >
                    Ingest Evidence
                  </GlowButton>
                </form>
              </GlassCard>

              <div className="p-4 bg-evidentia-accent/5 border border-evidentia-accent/20 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-evidentia-accent">
                  <Zap className="w-3 h-3" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold">Protocol Information</span>
                </div>
                <p className="text-[9px] font-mono text-white/40 leading-relaxed uppercase tracking-tighter">
                  On-chain commitment requires a connected wallet with active POL balance for gas. Artifact hashes are archived immutably upon transaction confirmation.
                </p>
              </div>
            </div>
          </motion.div>
        ) : stage === 'analyzing' ? (
          <motion.div
            key="analyzing-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-12 py-20"
          >
            <div className="relative">
              {/* Spinning rings */}
              <div className="w-48 h-48 rounded-full border border-evidentia-accent/20 animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border-2 border-evidentia-accent/40 border-t-evidentia-accent animate-[spin_2s_linear_infinite]" />
              <div className="absolute inset-10 rounded-full border border-evidentia-violet/40 border-b-evidentia-violet animate-[spin_3s_linear_infinite_reverse]" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-12 h-12 text-evidentia-accent animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-xl font-display font-bold text-white tracking-tight uppercase">Processing Node Ingestion</h2>
              <div className="flex flex-col items-center gap-2">
                <TerminalText text={analysisText} className="text-sm font-mono text-evidentia-accent" />
                <div className="w-64 h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                  <motion.div 
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-evidentia-accent shadow-[0_0_10px_#00F0FF]"
                  />
                </div>
                <span className="text-[10px] font-mono text-white/30 tracking-widest mt-2">{progress}% SYNCED</span>
              </div>
            </div>
            
            <div className="w-full max-w-md grid grid-cols-3 gap-2 opacity-40 grayscale">
              <div className="h-1 bg-evidentia-accent rounded" />
              <div className={`h-1 rounded ${progress > 33 ? 'bg-evidentia-accent' : 'bg-white/10'}`} />
              <div className={`h-1 rounded ${progress > 66 ? 'bg-evidentia-accent' : 'bg-white/10'}`} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="complete-view"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-8 py-10"
          >
            <div className="w-24 h-24 rounded-full bg-evidentia-success/20 border border-evidentia-success flex items-center justify-center shadow-[0_0_30px_rgba(0,255,156,0.3)]">
              <Shield className="w-12 h-12 text-evidentia-success" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-white">INGESTION SUCCESSFUL</h2>
              <p className="text-sm font-mono text-evidentia-success uppercase tracking-[0.2em]">Evidence has been committed to immutable ledger</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <GlassCard className="text-left">
                <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Resource Title</span>
                    <span className="text-white truncate max-w-[150px]">{metadata.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Global Case ID</span>
                    <span className="text-white">{metadata.caseId}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Physical Hash</span>
                    <span className="text-evidentia-accent truncate ml-4" title={finalHash}>{finalHash.substring(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white/40">Chain Status</span>
                    <span className="px-2 py-0.5 bg-evidentia-success/20 text-evidentia-success rounded text-[8px] border border-evidentia-success/30">VERIFIED</span>
                  </div>
                </div>
              </GlassCard>

<<<<<<< HEAD
              <GlassCard className="flex flex-col items-center justify-center p-6 gap-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-evidentia-accent/15 border border-evidentia-accent/30 rounded-full text-[8.5px] font-mono text-evidentia-accent uppercase tracking-widest font-bold mb-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-evidentia-accent animate-ping" /> SECURE DOSSIER SHARE QR
                </div>
                
                <div className="p-2 bg-white rounded-lg shadow-[0_0_25px_rgba(0,240,255,0.25)]">
                  <QRCodeSVG 
                    value={`${window.location.origin}?evidence=${uploadedId}`}
                    size={110}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                
                <div className="text-center space-y-1 w-full max-w-[200px]">
                  <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">DYNAMIC HANDSHAKE SIGNATURE</p>
                  {lastTxHash ? (
=======
              {lastTxHash && (
                <GlassCard className="flex flex-col items-center justify-center p-6 gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <QRCodeSVG 
                      value={`https://polygonscan.com/tx/${lastTxHash}`}
                      size={100}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Transaction Hash</p>
>>>>>>> 02e00201138f1d200cbf20b6011582b008b20212
                    <a 
                      href={`https://polygonscan.com/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
<<<<<<< HEAD
                      className="text-[8px] font-mono text-emerald-400 flex items-center justify-center gap-1 hover:underline truncate"
                    >
                      TX: {lastTxHash.substring(0, 16)}... <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <p className="text-[8.5px] font-mono text-emerald-400 font-bold uppercase tracking-wide">SECURE SANDBOX CONSENSUS</p>
                  )}
                </div>
              </GlassCard>
=======
                      className="text-[9px] font-mono text-evidentia-accent flex items-center justify-center gap-1 hover:underline truncate max-w-[180px]"
                    >
                      {lastTxHash.substring(0, 24)}... <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </GlassCard>
              )}
>>>>>>> 02e00201138f1d200cbf20b6011582b008b20212
            </div>

            <div className="flex gap-4">
              <GlowButton variant="ghost" onClick={reset}>Ingest Another Artifact</GlowButton>
              <GlowButton onClick={() => setActiveTab('dashboard')}>Go to Command Center</GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
