import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, AlertTriangle, Fingerprint, Hash } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';

export const Login: React.FC = () => {
  const { login, addNotification } = useApp();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<'intro-1' | 'intro-2' | 'form'>('intro-1');

  React.useEffect(() => {
    // Stage 1: Ministry Reveal (Accelerated)
    const t1 = setTimeout(() => {
      setPhase('intro-2');
    }, 300);

    // Stage 2: Bureau Reveal (Accelerated)
    const t2 = setTimeout(() => {
      setPhase('form');
    }, 850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password || (isSignUp && !username)) return;
    
    setIsAuthenticating(true);
    setAuthError(null);
    setSuccessMessage(null);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { username },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        
        setIsSignUp(false);
        setPassword('');
        setSuccessMessage("Account Provisioned. Verify your credentials via the secure link sent to your terminal.");
        setIsAuthenticating(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data.session) {
          login(email);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Access Denied: Invalid Credentials');
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    addNotification("Initiating Secure Federated Authentication...", "violet");
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Federated Authentication failed');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020406] flex items-center justify-center z-[100] overflow-hidden selection:bg-evidentia-accent/30 selection:text-white">
      <div className="vignette pointer-events-none" />
      <div className="crt-noise pointer-events-none opacity-[0.04]" />
      
      {/* Deep atmospheric lighting - Indian Saffron/Deep Blue hues */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-orange-900/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {phase === 'intro-1' && (
          <motion.div
            key="intro-1"
            initial={{ opacity: 0, letterSpacing: '0.6em' }}
            animate={{ opacity: 1, letterSpacing: '0.4em' }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center text-center space-y-4"
          >
            <h2 className="text-[10px] font-serif tracking-[0.6em] text-white/30 uppercase pl-[0.6em]">
              Ministry of Home Affairs
            </h2>
            <p className="text-[8px] font-mono tracking-[0.2em] text-white/10 uppercase pl-[0.2em]">Government of India</p>
          </motion.div>
        )}

        {phase === 'intro-2' && (
          <motion.div
            key="intro-2"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center text-center relative px-6"
          >
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "40px" }}
              transition={{ delay: 0.1, duration: 0.3, ease: "circOut" }}
              className="w-[1px] bg-white/10 mb-8" 
            />
            <h1 className="text-3xl md:text-5xl font-serif tracking-[0.3em] text-white/80 uppercase leading-tight mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] pl-[0.3em]">
              Evidentia <br /> secure ledger
            </h1>
            <div className="flex items-center gap-4 text-white/20">
               <div className="h-[1px] w-8 bg-white/10" />
               <span className="text-[10px] font-serif tracking-[0.5em] uppercase pl-[0.5em]">EVIDENTIA SECURITY</span>
               <div className="h-[1px] w-8 bg-white/10" />
            </div>
          </motion.div>
        )}

        {phase === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm px-8 z-10 flex flex-col items-center"
          >
            <div className="w-full mb-10 flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-evidentia-accent/10 blur-2xl rounded-full animate-pulse" />
                <Fingerprint className="w-10 h-10 text-white/40 stroke-[0.75] relative z-10" />
              </div>
              <h1 className="text-xl font-serif text-white/80 uppercase mb-2 flex flex-col items-center leading-relaxed text-center">
                <span className="tracking-[0.4em] pl-[0.4em]">Digital Evidence</span>
                <span className="tracking-[0.4em] pl-[0.4em]">Vault</span>
              </h1>
            </div>

            <div className="w-full">
              {successMessage && !isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 flex items-start gap-4 text-evidentia-success/80 text-[10px] font-mono bg-evidentia-success/5 p-4 border border-evidentia-success/10 rounded"
                >
                  <span className="leading-relaxed">{successMessage}</span>
                </motion.div>
              )}
              <form onSubmit={handleLogin} className="space-y-6">
                
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase ml-1">
                        Operative Identifier
                      </label>
                      <div className="relative group/input">
                        <Hash className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 transition-colors group-focus-within/input:text-evidentia-accent/40 stroke-[1]" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="OPERATIVE_ID"
                          className="w-full bg-transparent border-b border-white/5 px-8 py-3 text-xs font-mono tracking-[0.1em] text-white/60 focus:border-evidentia-accent/30 outline-none transition-all placeholder:text-white/5"
                          required={isSignUp}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase ml-1">
                    System Credentials (Email)
                  </label>
                  <div className="relative group/input">
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 transition-colors group-focus-within/input:text-evidentia-accent/40 stroke-[1]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="OFFICER@EVIDENTIA.IO"
                      className="w-full bg-transparent border-b border-white/5 px-8 py-3 text-xs font-mono tracking-[0.1em] text-white/60 focus:border-evidentia-accent/30 outline-none transition-all placeholder:text-white/5"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase ml-1">
                    Authorization Phrase
                  </label>
                  <div className="relative group/input">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 transition-colors group-focus-within/input:text-evidentia-accent/40 stroke-[1]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-transparent border-b border-white/5 px-8 py-3 text-xs font-mono tracking-[0.1em] text-white/60 focus:border-evidentia-accent/30 outline-none transition-all placeholder:text-white/5"
                      required
                    />
                  </div>
                </div>

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 text-evidentia-danger/80 text-[10px] font-mono bg-evidentia-danger/5 p-4 border border-evidentia-danger/10 rounded"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1]" />
                    <span className="leading-relaxed">{authError}</span>
                  </motion.div>
                )}

                <div className="pt-4 flex flex-col gap-4">
                  <button 
                    type="submit" 
                    disabled={isAuthenticating}
                    className="w-full py-4 text-[10px] font-serif tracking-[0.3em] uppercase text-black bg-white/90 hover:bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isAuthenticating ? 'VERIFYING...' : (isSignUp ? 'INITIATE CLEARANCE' : 'SECURE LOG-IN')}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError(null);
                      setSuccessMessage(null);
                    }}
                    className={`text-[9px] font-mono uppercase tracking-[0.3em] py-4 transition-all mt-2 border flex items-center justify-center gap-2 active:scale-[0.98] ${
                      isSignUp 
                        ? 'text-white/20 border-white/5 hover:text-white/40 hover:border-white/10' 
                        : 'text-evidentia-accent border-evidentia-accent/20 bg-evidentia-accent/[0.03] hover:bg-evidentia-accent/[0.08] hover:border-evidentia-accent/40 shadow-[0_0_30px_rgba(var(--evidentia-accent-rgb),0.05)]'
                    }`}
                  >
                    {isSignUp ? 'RETURN TO TERMINAL' : 'REQUEST NEW SYSTEM CLEARANCE'}
                  </button>
                  
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-white/[0.03]"></div>
                    <span className="flex-shrink mx-4 text-[8px] font-mono text-white/10 uppercase tracking-[0.4em]">Integrated Auth</span>
                    <div className="flex-grow border-t border-white/[0.03]"></div>
                  </div>

                  {/* Google Login with better visibility */}
                  <button 
                    type="button" 
                    onClick={handleGoogleLogin} 
                    disabled={isAuthenticating}
                    className="w-full py-4 text-[9px] font-mono tracking-[0.2em] uppercase text-white/70 bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-4 group/google active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 opacity-40 group-hover/google:opacity-100 transition-opacity" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    CONTINUE WITH DIGITAL_AUTH
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-6 opacity-[0.08] hover:opacity-20 transition-opacity select-none">
              <span className="text-[10px] font-mono tracking-[0.2em] font-bold">EVIDENTIA</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
