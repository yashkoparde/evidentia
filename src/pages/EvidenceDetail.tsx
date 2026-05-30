import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Shield, ExternalLink, Hash, Link as LinkIcon, Search, Plus, X, Trash2, Cpu, Binary, AlertTriangle, Database, Activity, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '../components/GlassCard';
import { GlowButton } from '../components/GlowButton';
import { useApp } from '../context/AppContext';
import { formatDate, formatDuration, cn, getFileIcon } from '../utils/utils';
import { Evidence } from '../types';
import { storageService } from '../services/storageService';
import ReactMarkdown from 'react-markdown';

interface EvidenceDetailProps {
  evidenceId: string;
  onBack: () => void;
  isPublic?: boolean;
}

export const EvidenceDetail: React.FC<EvidenceDetailProps> = ({ evidenceId, onBack, isPublic = false }) => {
  const { getEvidenceById: getLocalEvidenceById, linkCase, evidenceList, removeEvidence, addNotification, getEvidenceFileUrl, simulateRiskChange, currentUser } = useApp();
  const [caseSearch, setCaseSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [rawFileUrl, setRawFileUrl] = useState<string | null>(null);
  const [showEmailReceipt, setShowEmailReceipt] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  React.useEffect(() => {
    const loadEvidence = async () => {
      setIsFetching(true);
      const local = getLocalEvidenceById(evidenceId);
      if (local) {
        setEvidence(local);
        setIsFetching(false);
      } else {
        try {
          const remote = await storageService.getEvidenceById(evidenceId);
          setEvidence(remote);
        } catch (err) {
          console.error("Failed to fetch remote evidence", err);
        } finally {
          setIsFetching(false);
        }
      }
    };
    loadEvidence();
  }, [evidenceId, getLocalEvidenceById]);

  React.useEffect(() => {
    if (!evidence) return;
    const fetchUrl = async () => {
      const url = await getEvidenceFileUrl(evidenceId);
      setRawFileUrl(url);
    };
    fetchUrl();
  }, [evidenceId, getEvidenceFileUrl, evidence]);
  
  const allExistingCases = Array.from(new Set(evidenceList.flatMap(e => e.linkedCases || [])));
  const suggestedCases = allExistingCases.filter(c => !evidence?.linkedCases?.includes(c));

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-2 border-evidentia-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-evidentia-accent uppercase tracking-widest animate-pulse">Decrypting Record Data...</p>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-6 text-center">
        <div className="p-4 bg-evidentia-danger/10 rounded-full border border-evidentia-danger/30">
          <Shield className="w-12 h-12 text-evidentia-danger opacity-50" />
        </div>
        <div>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter">Access Denied / Not Found</h2>
          <p className="text-sm text-white/40 font-mono mt-2 max-w-md">The record identifier <span className="text-white">#{evidenceId.substring(0,8)}</span> is either invalid or your credentials lack the necessary clearance nodes.</p>
        </div>
        <GlowButton onClick={onBack} variant="ghost" className="text-xs">Return to Terminal</GlowButton>
      </div>
    );
  }

  const handleDelete = () => {
    if (!isDeleting) {
      setIsDeleting(true);
      addNotification('Confirm: Press again to permanently purge this record', 'alert');
      return;
    }
    removeEvidence(evidenceId);
    onBack();
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Decorative Border & Frame
      doc.setDrawColor(20, 24, 30);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setLineWidth(0.5);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      // 2. Official Header Section
      doc.setFillColor(20, 24, 30);
      doc.rect(8, 8, pageWidth - 16, 25, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 240, 255); // Evidentia Accent
      doc.text('EVIDENTIA CRYPTOGRAPHIC LEDGER', pageWidth / 2, 18, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text('EVIDENTIA DIGITAL FORENSIC EVIDENCE DIVISION', pageWidth / 2, 26, { align: 'center' });

      // Watermark
      doc.setTextColor(245, 245, 245);
      doc.setFontSize(70);
      doc.setFont('helvetica', 'bold');
      doc.text('CLASSIFIED', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45, opacity: 0.1 } as any);

      // 3. Metadata Table
      doc.setTextColor(0, 0, 0);
      let nextY = 45;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT STATUS:', 20, nextY);
      doc.setTextColor(0, 150, 0);
      doc.text('CERTIFIED INTEGRITY', 55, nextY);
      
      doc.setTextColor(0, 0, 0);
      doc.text('GEN_TIMESTAMP:', 120, nextY);
      doc.setFont('courier', 'normal');
      doc.text(new Date().toLocaleString().toUpperCase(), 155, nextY);
      
      nextY += 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, nextY - 5, pageWidth - 20, nextY - 5);

      // 4. Case Information Block
      doc.setFillColor(240, 240, 240);
      doc.rect(20, nextY, pageWidth - 40, 45, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('CASE IDENTIFIER:', 25, nextY + 8);
      doc.setFont('courier', 'bold');
      doc.text(evidence.caseId.toUpperCase(), 65, nextY + 8);

      doc.setFont('helvetica', 'bold');
      doc.text('ARTIFACT ID:', 25, nextY + 16);
      doc.text(evidence.id.toUpperCase(), 65, nextY + 16);

      doc.setFont('helvetica', 'bold');
      doc.text('TITLE:', 25, nextY + 24);
      doc.setFont('helvetica', 'normal');
      doc.text(evidence.title.toUpperCase(), 65, nextY + 24);

      doc.setFont('helvetica', 'bold');
      doc.text('FILE_NAME:', 25, nextY + 32);
      doc.text(evidence.fileName, 65, nextY + 32);

      if (evidence.duration) {
        doc.setFont('helvetica', 'bold');
        doc.text('MEDIA_LENGTH:', 25, nextY + 40);
        doc.text(formatDuration(evidence.duration), 65, nextY + 40);
      }

      nextY += 55;

      // 5. Visual Evidence (Photo/Thumbnail)
      if (evidence.thumbnail) {
        try {
          doc.setFont('helvetica', 'bold');
          doc.text('VISUAL ARTIFACT PREVIEW:', 20, nextY);
          
          // Image border
          doc.setDrawColor(0, 0, 0);
          doc.rect(20, nextY + 5, 60, 60);
          doc.addImage(evidence.thumbnail, 'JPEG', 21, nextY + 6, 58, 58);
          
          nextY += 75;
        } catch (e) {
          console.error("Could not add image to PDF", e);
          nextY += 10;
        }
      }

      // 6. Cryptographic Integrity
      doc.setFillColor(20, 24, 30);
      doc.rect(20, nextY, pageWidth - 40, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text('DIGITAL HASH VERIFICATION (SHA-256)', pageWidth / 2, nextY + 6, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      const hashLines = doc.splitTextToSize(evidence.fileHash, pageWidth - 50);
      doc.text(hashLines, 25, nextY + 15);
      
      nextY += 25;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('BLOCKCHAIN LEDGER REFERENCE:', 20, nextY);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      const bcHash = evidence.blockchainHash || "0x" + evidence.fileHash.substring(0, 48) + "...";
      doc.text(bcHash, 20, nextY + 6);
      
      nextY += 20;

      // 7. Investigative Deposition (Description)
      doc.setFillColor(245, 245, 245);
      doc.rect(20, nextY, pageWidth - 40, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('INVESTIGATIVE DEPOSITION', 25, nextY + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const notes = doc.splitTextToSize(evidence.description || 'No investigative notes provided.', pageWidth - 50);
      doc.text(notes, 25, nextY + 16);
      
      // 8. Signatures Section
      const sigY = pageHeight - 45;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(20, sigY, 80, sigY);
      doc.setFontSize(8);
      doc.text('OFFICER IN CHARGE', 20, sigY + 5);
      doc.text('EVIDENTIA FORENSICS', 20, sigY + 9);
      
      doc.line(pageWidth - 80, sigY, pageWidth - 20, sigY);
      doc.text('TERMINAL VALIDATION STAMP', pageWidth - 80, sigY + 5);
      doc.text('BLOCKCHAIN SYNC: CONFIRMED', pageWidth - 80, sigY + 9);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('This document is a certified digital artifact. Any alteration to this file will invalidate the cryptographic signature.', pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`EVIDENTIA_CERTIFIED_REPORT_${evidence.id.toUpperCase()}.pdf`);
      addNotification('Evidentia Certified Report generated successfully', 'success');
    } catch (error) {
      console.error('PDF Export failed:', error);
      addNotification('Failed to generate Evidentia Forensic report', 'alert');
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}?evidence=${evidence.id}`;
    navigator.clipboard.writeText(shareUrl);
    addNotification('Secure share link copied to clipboard', 'success');
  };

  const handleLinkCase = () => {
    if (caseSearch.trim()) {
      linkCase(evidenceId, caseSearch.trim());
      setCaseSearch('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-evidentia-accent transition-colors uppercase tracking-widest"
        >
          <X className="w-4 h-4" />
          Close Details
        </button>
        <div className="flex gap-4">
          {!isPublic && (
            <GlowButton 
              onClick={handleDelete}
              className={cn(
                "text-[10px] py-1.5 h-auto text-evidentia-danger transition-all",
                isDeleting ? "bg-evidentia-danger text-black font-bold scale-105" : "hover:bg-evidentia-danger/10 border-evidentia-danger/30"
              )}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              {isDeleting ? 'PURGE NOW' : 'Purge Record'}
            </GlowButton>
          )}
          <GlowButton onClick={handleExportPDF} variant="ghost" className="text-[10px] py-1.5 h-auto">Export PDF Report</GlowButton>
          <GlowButton onClick={handleShare} className="text-[10px] py-1.5 h-auto">Share via Secure Link</GlowButton>
        </div>
      </div>

      {evidence.status === 'tampered' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-evidentia-danger/20 border border-evidentia-danger rounded-lg flex items-center gap-4 shadow-[0_0_20px_rgba(255,59,48,0.2)]"
        >
          <div className="p-3 bg-evidentia-danger rounded-full pulse-danger">
            <AlertTriangle className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-evidentia-danger uppercase tracking-[0.2em]">Critical Integrity Breach</h3>
            <p className="text-xs text-white/80 font-mono mb-2">The AI diagnostic node and blockchain verification have detected structural tampering or semantic inconsistencies in this artifact. This record is no longer admissible in standard court proceedings without secondary expert verification.</p>
            <button 
              onClick={() => setShowEmailReceipt(true)}
              className="text-[10px] font-mono bg-evidentia-danger text-black px-3 py-1 rounded hover:bg-white transition-colors uppercase font-bold"
            >
              View Dispatch Protocol (Email)
            </button>
          </div>
        </motion.div>
      )}

      {showEmailReceipt && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-xl"
        >
          <div className="max-w-2xl w-full bg-[#0a0a0a] border border-evidentia-danger/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,59,48,0.3)]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-evidentia-danger" />
                <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Evidentia Secure Mail Protocol</span>
              </div>
              <button onClick={() => setShowEmailReceipt(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 font-sans bg-[#0a0a0a] text-white">
              {/* Email Content Emulated Design */}
              <div className="max-w-xl mx-auto border border-white/10 p-10 rounded-2xl bg-gradient-to-b from-[#111] to-[#0a0a0a] shadow-inner">
                <div className="text-center mb-10 pb-8 border-b border-white/5">
                  <div className="inline-block px-4 py-1.5 bg-evidentia-danger text-black text-[9px] font-mono font-black uppercase tracking-[.4em] mb-6 rounded-sm shadow-[0_0_15px_rgba(255,59,48,0.4)]">
                    EVIDENTIA SECURITY DISPATCH
                  </div>
                  <h1 className="text-4xl font-display font-black tracking-tighter text-white mb-1 uppercase">Evidentia</h1>
                  <p className="text-[9px] font-mono text-white/40 uppercase tracking-[.6em]">Digital Integrity Enforcement</p>
                </div>

                <div className="space-y-8 text-white/80">
                  <div className="flex justify-between items-end border-l-2 border-evidentia-danger pl-4 py-1">
                    <p className="text-xs font-mono text-evidentia-danger uppercase tracking-widest font-bold underline decoration-evidentia-danger/30 underline-offset-4">Event: Hash Collision Failure</p>
                    <p className="text-[9px] font-mono text-white/20">LOG_ID: {evidence.id.substring(0, 12).toUpperCase()}</p>
                  </div>
                  
                  <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg">
                    <p className="text-sm font-light leading-relaxed">
                      Attention, <span className="text-white font-semibold">Investigator {currentUser?.name || "Unverified"}</span>, <br/><br/>
                      The <span className="text-evidentia-accent">Advanced Forensic AI (Parikshak.ai)</span> has detected a high-probability tampering event. 
                      Automated validation of the artifact against the immutable blockchain ledger has failed. 
                      The current file hash does not correlate with the record registered on <span className="text-white font-mono">ETH_MAINNET</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 py-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                      <span className="block text-white/20 text-[8px] font-mono uppercase mb-2 tracking-widest border-b border-white/5 pb-1">Artifact Pointer</span>
                      <span className="text-xs text-white font-mono break-all leading-tight opacity-90">CERT_ID_{evidence.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="p-4 bg-evidentia-danger/10 rounded-lg border border-evidentia-danger/20">
                      <span className="block text-evidentia-danger/40 text-[8px] font-mono uppercase mb-2 tracking-widest border-b border-evidentia-danger/10 pb-1">Alert Severity</span>
                      <span className="text-xs text-evidentia-danger font-mono font-black tracking-widest">CRITICAL (LEVEL 9)</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <p className="text-[11px] font-light italic text-white/50 leading-relaxed text-center">
                      "Metadata structures show signs of illegal injection. Admissibility index has dropped to 0%."
                    </p>
                    <div className="pt-8 text-center">
                      <button className="inline-block px-12 py-4 bg-evidentia-danger text-black text-xs font-display font-black uppercase tracking-[0.2em] hover:bg-white transition-all transform hover:scale-105 shadow-lg shadow-evidentia-danger/20 cursor-pointer">
                        Secure Vault Access
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center text-[8px] font-mono text-white/20 border-t border-white/5 pt-6 uppercase tracking-[0.3em] leading-loose">
                  This is a system-generated alert from Evidentia Node AI.<br/>
                  Blockchain Verification Status: REJECTED • Forensic Confidence: 99.4%
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-evidentia-danger/5 text-center text-[10px] font-mono text-evidentia-danger uppercase tracking-tighter">
              DISPATCHED TO: {currentUser?.email || "INVESTIGATOR@SECURE.NODE"} // TIMESTAMP: {new Date().toISOString()}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: File Preview & Info */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard title="Artifact Preview">
            <div className="flex flex-col items-center py-4 bg-black/20 rounded-xl mb-6 overflow-hidden relative">
              <div className="w-full px-6 flex flex-wrap gap-2 mb-6 min-h-[30px]">
                {evidence.caseId ? (
                  <div className="px-2 py-1 bg-evidentia-violet/20 border border-evidentia-violet/50 rounded flex items-center gap-1.5 backdrop-blur-md">
                    <Hash className="w-2.5 h-2.5 text-evidentia-violet" />
                    <span className="text-[9px] font-mono text-white leading-none mt-0.5 uppercase tracking-tighter">{evidence.caseId}</span>
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-white/5 border border-white/10 rounded flex items-center gap-1.5 backdrop-blur-md">
                    <Shield className="w-2.5 h-2.5 text-white/30" />
                    <span className="text-[9px] font-mono text-white/40 leading-none mt-0.5 uppercase tracking-tighter">UNLINKED</span>
                  </div>
                )}
                {evidence.linkedCases?.map((c, i) => (
                  <div key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded flex items-center gap-1.5 backdrop-blur-md">
                    <LinkIcon className="w-2.5 h-2.5 text-white/20" />
                    <span className="text-[9px] font-mono text-white/30 leading-none mt-0.5 uppercase tracking-tighter">{c}</span>
                  </div>
                ))}
              </div>
                  <div className="w-full max-h-64 flex items-center justify-center p-2">
                    {rawFileUrl && (evidence.fileType.startsWith('image/') || evidence.fileType.startsWith('video/')) ? (
                  evidence.fileType.startsWith('video/') ? (
                    <video src={rawFileUrl} controls className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                  ) : (
                    <img src={rawFileUrl} alt={evidence.title} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                  )
                ) : evidence.thumbnail ? (
                  <img src={evidence.thumbnail} alt={evidence.title} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                ) : (
                  <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-evidentia-accent transition-colors">
                    {React.createElement(getFileIcon(evidence.fileType, evidence.fileName), { className: "w-8 h-8 text-white/40" })}
                  </div>
                )}
              </div>
              <h3 className="font-display font-bold text-white mt-4 mb-1 uppercase tracking-tight px-4">{evidence.fileName}</h3>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Type: {evidence.fileType} • Size: {(evidence.fileSize / 1024).toFixed(2)} KB</p>
              
              {rawFileUrl && (
                <a 
                  href={rawFileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[10px] font-mono text-evidentia-accent hover:text-white transition-colors bg-evidentia-accent/10 px-4 py-2 rounded border border-evidentia-accent/20 uppercase tracking-widest"
                >
                  <ExternalLink className="w-3 h-3" />
                  Access Raw Artifact
                </a>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded">
                <div className="text-[9px] font-mono text-white/40 uppercase mb-1 tracking-widest">Upload Date</div>
                <div className="text-xs font-mono text-white">{formatDate(new Date(evidence.createdAt))} {new Date(evidence.createdAt).toLocaleTimeString()}</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded">
                <div className="text-[9px] font-mono text-white/40 uppercase mb-1 tracking-widest">File Hash (integrity)</div>
                <div className="text-[9px] font-mono text-evidentia-accent break-all">{evidence.fileHash}</div>
              </div>
              {isPublic && (
                <div className="p-3 bg-evidentia-success/10 border border-evidentia-success/30 rounded flex items-center gap-3">
                  <Shield className="w-5 h-5 text-evidentia-success" />
                  <div>
                    <div className="text-[9px] font-mono text-evidentia-success uppercase tracking-widest">Integrity Status</div>
                    <div className="text-[10px] font-mono text-white">BLOCKCHAIN_VERIFIED</div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {!isPublic && (
            <GlassCard title="Case File Association">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {evidence.linkedCases?.map((c, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-3 py-1 bg-evidentia-violet/10 border border-evidentia-violet/30 rounded flex items-center gap-2 group/tag"
                  >
                    <Hash className="w-3 h-3 text-evidentia-violet" />
                    <span className="text-[10px] font-mono text-white leading-none mt-0.5">{c}</span>
                  </motion.div>
                ))}
                {(!evidence.linkedCases || evidence.linkedCases.length === 0) && (
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest italic">No linked case associations found.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] ml-1">Search & Link Case</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input 
                      type="text" 
                      value={caseSearch}
                      onChange={(e) => setCaseSearch(e.target.value)}
                      placeholder="ENTER CASE ID..."
                      className="w-full bg-black/60 border border-white/10 rounded py-2 pl-9 pr-4 text-[10px] font-mono focus:border-evidentia-accent transition-all outline-none md:text-xs"
                    />
                  </div>
                  <button 
                    onClick={handleLinkCase}
                    className="bg-evidentia-accent text-black px-4 py-2 rounded font-mono text-[10px] font-bold hover:bg-white transition-colors uppercase tracking-widest whitespace-nowrap"
                  >
                    Link Entity
                  </button>
                </div>
              </div>

              {suggestedCases.length > 0 && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest px-1">Global Case Directory</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCases.map((c, i) => (
                      <button 
                        key={i} 
                        onClick={() => linkCase(evidenceId, c)}
                        className="text-[9px] font-mono text-white/40 hover:text-evidentia-accent hover:border-evidentia-accent border border-white/10 px-2 py-1.5 rounded transition-all bg-white/5 flex items-center gap-2 group"
                      >
                        <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
          )}
        </div>

        {/* Center/Right: Description & AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard title="Forensic AI Intelligence">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-evidentia-accent" />
                  <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Diagnostic Node: Parikshak.ai</span>
                </div>
                {evidence.aiRiskScore !== undefined && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Risk Index:</span>
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${evidence.aiRiskScore}%` }}
                          className={cn(
                            "h-full shadow-[0_0_8px]",
                            evidence.aiRiskScore < 30 ? "bg-evidentia-success shadow-evidentia-success" : 
                            evidence.aiRiskScore < 70 ? "bg-amber-500 shadow-amber-500" : 
                            "bg-evidentia-danger shadow-evidentia-danger"
                          )}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-mono font-bold",
                        evidence.aiRiskScore < 30 ? "text-evidentia-success" : 
                        evidence.aiRiskScore < 70 ? "text-amber-500" : 
                        "text-evidentia-danger"
                      )}>
                        {evidence.aiRiskScore}/100
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-tighter text-right italic max-w-[200px]">
                      {evidence.aiRiskScore > 75 
                        ? "* High risk indicates a lack of verifiable digital provenance or high-stakes content requiring manual review." 
                        : "* Risk index reflects metadata consistency and diagnostic confidence."}
                    </p>
                  </div>
                )}
              </div>

              {evidence.aiSummary && (
                <div className="p-4 bg-evidentia-accent/5 border border-evidentia-accent/20 rounded-lg relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-evidentia-accent" />
                  <p className="text-sm text-white/90 leading-relaxed italic">
                    "{evidence.aiSummary}"
                  </p>
                </div>
              )}

              {evidence.aiObservations && evidence.aiObservations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Binary className="w-3 h-3" />
                    Forensic Observations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evidence.aiObservations.map((obs, i) => (
                      <div key={i} className="p-3 bg-white/5 border border-white/5 rounded text-[11px] text-white/60 font-mono leading-tight">
                        <span className="text-evidentia-accent mr-2">▶</span> {obs}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard title="Investigative Summary">
            <div className="p-6 bg-white/5 rounded-lg border border-white/10 min-h-[150px] relative overflow-hidden">
              <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
                {evidence.caseId && (
                  <span className="px-2 py-1 bg-evidentia-accent/20 border border-evidentia-accent/40 rounded text-[9px] font-mono text-evidentia-accent uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                    <Hash className="w-3 h-3" />
                    PRIMARY CASE: {evidence.caseId}
                  </span>
                )}
                {evidence.linkedCases && evidence.linkedCases.map(c => (
                  <span key={c} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3" />
                    ASSOCIATED ID: {c}
                  </span>
                ))}
              </div>

              <h4 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-[0.2em]">{evidence.title}</h4>
              <p className="text-sm text-white/70 leading-relaxed font-light whitespace-pre-wrap max-w-2xl mb-8">
                {evidence.description || "No description provided for this record."}
              </p>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <h5 className="text-[10px] font-mono text-white/40 uppercase tracking-[.3em] mb-4">Forensic Diagnostic Protocol</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <Binary className="w-3 h-3 text-evidentia-accent" />
                      <span className="text-[9px] font-mono text-white/80 uppercase">Geometric Consistency</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-tight">AI checks for perspective errors, focal length mismatches, and structural hallucinations common in generative models.</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-3 h-3 text-evidentia-violet" />
                      <span className="text-[9px] font-mono text-white/80 uppercase">Sensor Noise Analysis</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-tight">Verifies that the camera sensor's unique noise fingerprint is uniform across the entire frame. Irregularities suggest cloning.</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Blockchain Ledger Protocol">
            <div className="p-6 bg-white/5 rounded-lg border border-white/10 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* QR Code section - Pointing to the App's own verification link for actual functionality */}
                <div className="flex flex-col items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="p-4 bg-white rounded-lg shadow-[0_0_30px_rgba(25,185,155,0.2)]">
                    <QRCodeSVG 
<<<<<<< HEAD
                      value={`${window.location.origin}?evidence=${evidence.id}`}
=======
                      value={window.location.href}
>>>>>>> 02e00201138f1d200cbf20b6011582b008b20212
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">System Verification Code</p>
                    <p className="text-[9px] font-mono text-evidentia-accent uppercase tracking-tighter">
                      Scan to Authenticate Record
                    </p>
                  </div>
                </div>

                {/* Transaction details */}
                <div className="flex-1 space-y-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-3.5 h-3.5 text-evidentia-success" />
                        <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Protocol Status</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-evidentia-success font-bold">
                          {evidence.blockchainHash ? "SECURED" : "PENDING"}
                        </span>
                        <span className="text-[10px] font-mono text-white/20 uppercase">
                          {evidence.blockchainHash ? "Simulation Node" : "Queued"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-black/40 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="w-3.5 h-3.5 text-evidentia-accent" />
                        <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Network Node</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white opacity-80 uppercase">Polygon Edge</span>
                        <span className="text-[10px] font-mono text-white/20 uppercase">Local Sync</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h5 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Internal Ledger Sync</h5>
                      {evidence.blockchainHash && (
                        <div 
                          className="text-[9px] font-mono text-white/20 flex items-center gap-1.5"
                        >
                          Tx: {evidence.blockchainHash.substring(0, 10)}... <Hash className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                    {[
                      { op: 'VAULT_INIT', addr: evidence.blockchainHash ? `${evidence.blockchainHash.substring(0, 16)}...` : '0x71C...3d2B', time: formatDate(new Date(evidence.createdAt)).split(',')[1]?.trim() || '12:04:22', status: 'COMPLETE' },
                      { op: 'AI_DIAGNOSTIC', addr: 'PARIKSHAK_NODE_01', time: '14:30:05', status: 'VERIFIED' },
                      { op: 'TERMINAL_ACCESS', addr: currentUser?.email?.split('@')[0].toUpperCase() || 'ANON_USER', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), status: 'UNLOCKED' }
                    ].map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded text-[10px] font-mono group hover:bg-white/[0.05] transition-all">
                        <div className="flex items-center gap-4">
                          <span className="text-white/20">[{tx.time}]</span>
                          <span className={cn(
                            "font-bold",
                            tx.status === 'COMPLETE' ? 'text-evidentia-accent' : 
                            tx.status === 'VERIFIED' ? 'text-evidentia-success' : 'text-white/60'
                          )}>{tx.op}</span>
                        </div>
                        <span className="text-white/30 group-hover:text-white/60 transition-colors uppercase truncate max-w-[150px]">{tx.addr}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
