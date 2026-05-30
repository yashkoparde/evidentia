import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Evidence, AuditLog, User, SystemNotification } from '../types';
import { blockchainService } from '../services/blockchainService';
import { storageService } from '../services/storageService';
import { logService } from '../services/logService';

interface AppContextType {
  evidenceList: Evidence[];
  logs: AuditLog[];
  currentUser: User | null;
  isLoading: boolean;
  configError: string | null;
  notifications: SystemNotification[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshData: () => void;
  getEvidenceFileUrl: (evidenceId: string) => Promise<string | null>;
  addEvidence: (evidence: Evidence, file: File) => Promise<string>;
  verifyEvidenceItem: (id: string) => Promise<{ isValid: boolean; blockchainRecord: any }>;
  getEvidenceById: (id: string) => Evidence | undefined;
  removeEvidence: (id: string) => void;
  linkCase: (evidenceId: string, caseId: string) => void;
  simulateRiskChange: (id: string, score: number, summary: string, observations: string[]) => Promise<void>;
  addNotification: (message: string, type: SystemNotification['type']) => void;
  removeNotification: (id: string) => void;
  login: (email: string) => void;
  logout: () => void;
}

import { supabase } from '../supabaseClient';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const refreshData = useCallback(async () => {
    const freshEvidence = await storageService.getEvidenceList(currentUser?.id);
    
    // Check for public evidence record requested via URL
    const params = new URLSearchParams(window.location.search);
    const publicId = params.get('evidence');
    
    if (publicId && !freshEvidence.some(e => e.id === publicId)) {
      const publicEvidence = await storageService.getEvidenceById(publicId);
      if (publicEvidence) {
        freshEvidence.push(publicEvidence);
      }
    }

    const freshLogs = await logService.getLogs(currentUser?.id);
    setEvidenceList(freshEvidence);
    setLogs(freshLogs);
  }, [currentUser?.id]);

  const getEvidenceFileUrl = async (id: string): Promise<string | null> => {
    const ev = evidenceList.find(e => e.id === id);
    if (!ev || !ev.storagePath) return null;
    const signed = await storageService.getSignedUrl(ev.storagePath);
    if (signed) return signed;
    // Fallback to public URL if signed fails (e.g. user is not logged in but has a direct link)
    return storageService.getPublicUrl(ev.storagePath);
  };

  // 1. Auth Listener (Always active)
  useEffect(() => {
    let authSubscription: any = null;

    const setupAuth = async () => {
      // Safety timeout to ensure loading screen doesn't hang forever
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.username || session.user.email?.split('@')[0].toUpperCase() || 'AGENT',
            email: session.user.email || '',
            role: 'agent',
            lastSeen: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Auth session check error:", err);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.username || session.user.email?.split('@')[0].toUpperCase() || 'AGENT',
            email: session.user.email || '',
            role: 'agent',
            lastSeen: new Date().toISOString()
          });
        } else {
          setCurrentUser(null);
        }
      });
      authSubscription = data.subscription;
    };

    setupAuth();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  // 2. Data Fetching & Realtime (Depends on current user)
  useEffect(() => {
    // Skip if loading or if we already have a config error
    if (isLoading && !currentUser) return;

    let evidenceChannel: any = null;

    const initData = async () => {
      try {
        await refreshData();
        
        // Initial system log if empty
        const currentLogs = await logService.getLogs();
        if (currentLogs.length === 0) {
          await logService.addLog('system_boot', 'EVIDENTIA CORE SYSTEM INITIALIZED', 'SYSTEM', undefined, 'success');
          await refreshData();
        }

        // Setup Realtime
        const channelName = `evidence-realtime-${currentUser?.id || 'public'}`;
        
        // Ensure any previous channel with same name is removed
        supabase.removeChannel(supabase.channel(channelName));

        evidenceChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', table: 'evidence', schema: 'public' },
            (payload) => {
              console.log('[REALTIME] Change detected:', payload);
              refreshData();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[REALTIME] Successfully subscribed to evidence changes');
            }
          });

      } catch (err: any) {
        console.error("Data initialization error:", err);
        if (err.isConfigError || err.message?.includes('configuration missing') || err.message?.includes('Supabase configuration missing')) {
          setConfigError("Supabase Configuration Missing: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Environment Variables.");
        }
      }
    };

    initData();

    return () => {
      if (evidenceChannel) {
        supabase.removeChannel(evidenceChannel);
      }
    };
  }, [currentUser?.id, refreshData, isLoading]);

  const addNotification = useCallback((message: string, type: SystemNotification['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, message, type, timestamp: new Date().toISOString() }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addEvidence = async (newEvidence: Evidence, file: File) => {
    if (!currentUser) throw new Error('Authentication required');
    console.log(`[INGESTION] Starting ingestion for: ${newEvidence.title}`);
    
    // 1. Upload physical file to Supabase Storage
    // Structure: ${auth.uid()}/${featureName}/${itemId}/${uuid}.${extension}
    const extension = file.name.split('.').pop();
    const storagePath = `${currentUser.id}/evidence/${newEvidence.id}/${newEvidence.id}.${extension}`;
    
    console.log(`[INGESTION] Step 1: Uploading file to storage: ${storagePath}`);
    const uploadedPath = await storageService.uploadFile(file, storagePath);
    console.log(`[INGESTION] Step 1: Upload complete. Path: ${uploadedPath}`);
    
    // Check for duplicates
    const isDuplicate = evidenceList.some(e => e.fileHash === newEvidence.fileHash);
    
    // 3. Store on blockchain via service if not already stored
    let txHash = newEvidence.blockchainHash;
    if (!txHash || txHash.includes('...')) {
      console.log(`[INGESTION] Step 2: Committing hash to blockchain...`);
      // Use the linkedCases if present, or provide a default
      const caseRef = newEvidence.linkedCases?.[0] || 'UNLINKED';
      const blockchainResult = await blockchainService.storeHash(newEvidence.fileHash, caseRef);
      txHash = blockchainResult.txHash || txHash;
    }
    
    const evidenceToSave = { 
      ...newEvidence, 
      isDuplicate, 
      storagePath: uploadedPath,
      blockchainHash: txHash,
      status: (txHash && !txHash.includes('...')) ? 'verified' as const : 'pending' as const
    };

    // 4. Store metadata locally
    console.log(`[INGESTION] Step 3: Saving metadata to database...`);
    await storageService.saveEvidence(evidenceToSave, currentUser?.id);
    console.log(`[INGESTION] Step 3: Metadata saved.`);
    
    // 5. Log the upload
    await logService.addLog(
      'upload', 
      `Evidence Ingested: ${newEvidence.title} (#${newEvidence.id})${isDuplicate ? ' [DUPLICATE DETECTED]' : ''}`, 
      currentUser?.name || 'SYSTEM', 
      currentUser?.id,
      isDuplicate ? 'warning' : 'success', 
      newEvidence.id
    );

    console.log(`[INGESTION] Finalizing and refreshing data...`);
    await refreshData();
    addNotification(`New Evidence Ingested: ${newEvidence.title}`, 'success');
    return newEvidence.id;
  };

  const verifyEvidenceItem = async (id: string): Promise<{ isValid: boolean; blockchainRecord: any }> => {
    const ev = evidenceList.find(e => e.id === id);
    if (!ev) throw new Error('Evidence not found');

    // 1. Fetch record from blockchain
    const blockchainRecord = await blockchainService.getHash(ev.fileHash);
    
    // 2. Compare hashes (the current file hash vs blockchain record)
    const isValid = blockchainRecord !== null && blockchainRecord.hash === ev.fileHash;
    
    // 3. Update status in storage
    await storageService.updateEvidence(id, {
      status: isValid ? 'verified' : 'tampered',
      lastVerified: new Date().toISOString()
    });

    // 4. Log the verification
    await logService.addLog(
      'verify', 
      `Integrity Scan: ${ev.title} - ${isValid ? 'VERIFIED' : 'TAMPERED'}`, 
      currentUser?.name || 'SYSTEM',
      currentUser?.id,
      isValid ? 'success' : 'alert', 
      id
    );

    await refreshData();
    
    if (!isValid) {
      addNotification(`SECURITY ALERT: Evidence Tampering Detected on ${ev.title}`, 'alert');
    } else {
      addNotification(`Integrity Verified: ${ev.title}`, 'success');
    }

    return { isValid, blockchainRecord };
  };

  const linkCase = async (evidenceId: string, caseId: string) => {
    const ev = evidenceList.find(e => e.id === evidenceId);
    if (ev) {
      const linkedCases = Array.from(new Set([...(ev.linkedCases || []), caseId]));
      await storageService.updateEvidence(evidenceId, { linkedCases });
      await logService.addLog('access', `Linked evidence ${ev.title} to case ${caseId}`, currentUser?.name || 'SYSTEM', currentUser?.id);
      await refreshData();
      addNotification(`Case Link Established: ${caseId}`, 'violet');
    }
  };
  
  const simulateRiskChange = async (id: string, score: number, summary: string, observations: string[]) => {
    const ev = evidenceList.find(e => e.id === id);
    if (!ev) return;

    // Start simulation
    addNotification(`INITIALIZING AI FORENSIC RE-SCAN...`, 'violet');

    await storageService.updateEvidence(id, {
      aiRiskScore: score,
      aiSummary: summary,
      aiObservations: observations,
      status: score > 70 ? 'tampered' : ev.status
    });

    if (score > 70) {
      addNotification(`BREACH DETECTED: DISPATCHING SECURE PROTOCOL...`, 'alert');
      
      /**
       * REAL IMPLEMENTATION STEPS FOR SUPABASE EMAILS:
       * 1. Deploy an Edge Function: `supabase functions deploy send-integrity-alert`
       * 2. Use a service like Resend (https://resend.com)
       * 3. Invoke: 
       *    const { data, error } = await supabase.functions.invoke('send-integrity-alert', {
       *      body: { 
       *        evidenceId: id, 
       *        email: currentUser?.email,
       *        userName: currentUser?.name,
       *        riskScore: score 
       *      }
       *    });
       */
    }

    await logService.addLog(
      'verify', 
      `AI Risk Recalculation: ${ev.title} adjusted to ${score}/100`, 
      currentUser?.name || 'SYSTEM',
      currentUser?.id,
      score > 70 ? 'alert' : 'warning', 
      id
    );

    await refreshData();
    if (score > 70) {
      addNotification(`SUCCESS: INTEGRITY ALERT DISPATCHED TO ${currentUser?.email || 'OFFICER'}`, 'violet');
    }
  };

  const getEvidenceById = (id: string) => evidenceList.find(e => e.id === id);

  const removeEvidence = async (id: string) => {
    const ev = evidenceList.find(e => e.id === id);
    await storageService.deleteEvidence(id, ev?.storagePath);
    await logService.addLog('delete', `Evidence record purged: #${id}`, currentUser?.name || 'SYSTEM', currentUser?.id, 'warning');
    await refreshData();
    addNotification('Evidence record and file purged from terminal', 'alert');
  };

  const login = async (email: string) => {
    // Session state is handled by Supabase onAuthStateChange
    // Just show the notification and local log
    const name = email.split('@')[0].toUpperCase();
    await logService.addLog('access', 'Secure terminal access granted', name);
    addNotification(`Authentication Successful: Welcome ${name}`, 'success');
  };

  const logout = async () => {
    await logService.addLog('access', 'Terminal session terminated', currentUser?.name || 'SYSTEM', currentUser?.id);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setNotifications([]);
  };

  return (
    <AppContext.Provider value={{
      evidenceList,
      logs,
      currentUser,
      isLoading,
      configError,
      notifications,
      refreshData,
      getEvidenceFileUrl,
      addEvidence,
      verifyEvidenceItem,
      getEvidenceById,
      removeEvidence,
      linkCase,
      simulateRiskChange,
      addNotification,
      removeNotification,
      activeTab,
      setActiveTab,
      login,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
