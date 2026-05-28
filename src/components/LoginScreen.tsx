import React, { useState } from 'react';
import { Mail, Lock, Sparkles, X, ShieldAlert, Check } from 'lucide-react';
import { User, AdminAccount } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export default function LoginScreen({ onLogin, onClose, lang }: LoginScreenProps) {
  const isAr = lang === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError(isAr ? 'يرجى كتابة كافة الحقول المطلوبة' : 'Please satisfy all input requirements');
      setLoading(false);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Try server-side dynamic login first (guarantees .env matches dynamically on Render)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('sl_admin_email', trimmedEmail);
          localStorage.setItem('sl_admin_password', password);

          const masterNameSnippet = trimmedEmail.split('@')[0];
          const activeName = isAr 
            ? `المشرف العام ${masterNameSnippet} 👑` 
            : `Lead Admin ${masterNameSnippet} 👑`;

          onLogin({
            name: activeName,
            phone: '39442011',
            email: trimmedEmail,
            isAdmin: true,
            isVerified: true
          });
          
          setLoading(false);
          alert(isAr ? '🔓 أهلاً بك مجدداً في لوحة تحكم S&L' : '🔓 Welcome back to S&L control panel');
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn("Server login offline or failed, trying local fallback:", err);
    }

    // 2. Fallback to offline/localStorage/compiled env variables
    const masterEmail = localStorage.getItem('sl_admin_email') || (import.meta as any).env.VITE_ADMIN_EMAIL || '';
    const masterPassword = localStorage.getItem('sl_admin_password') || (import.meta as any).env.VITE_ADMIN_PASSWORD || (import.meta as any).env.VITE_ADMIN_PASS || '';

    // Read additional moderators list
    let moderators: AdminAccount[] = [];
    const savedMods = localStorage.getItem('sl_admin_accounts');
    if (savedMods) {
      try { moderators = JSON.parse(savedMods); } catch (_) {}
    }

    const isMaster = masterEmail ? (trimmedEmail === masterEmail.toLowerCase() && password === masterPassword) : false;
    const isMod = moderators.some(acc => acc.email.toLowerCase() === trimmedEmail && acc.password === password);

    setLoading(false);

    if (isMaster || isMod) {
      if (isMaster) {
        localStorage.setItem('sl_admin_email', trimmedEmail);
        localStorage.setItem('sl_admin_password', password);
      }
      
      const masterNameSnippet = masterEmail ? masterEmail.split('@')[0] : 'admin';
      const activeName = isMaster 
        ? (isAr ? `المشرف العام ${masterNameSnippet} 👑` : `Lead Admin ${masterNameSnippet} 👑`)
        : (moderators.find(acc => acc.email.toLowerCase() === trimmedEmail)?.name || 'مساعد إشراف');
        
      onLogin({
        name: activeName,
        phone: '39442011',
        email: trimmedEmail,
        isAdmin: true,
        isVerified: true
      });
      alert(isAr ? '🔓 أهلاً بك مجدداً في لوحة تحكم S&L' : '🔓 Welcome back to S&L control panel');
      onClose();
    } else {
      setError(isAr ? 'خطأ في البريد الإلكتروني أو الرقم السري للمسؤول' : 'Invalid administrator email or password');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Black ambient backdrop */}
      <div 
        className="absolute inset-0 bg-[#0b0424]/85 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Login Card */}
      <div 
        className="relative max-w-md w-full bg-[#12092e] border border-[#8b5cf6]/40 text-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Glow corner decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d946ef]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8b5cf6]/10 rounded-full blur-2xl pointer-events-none"></div>

        <button 
          onClick={onClose}
          className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 p-1 rounded-lg text-zinc-400 hover:text-white bg-[#1b124a]/50 transition cursor-pointer`}
        >
          <X size={15} />
        </button>

        <div className="text-center space-y-2 mt-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#8b5cf6]/20 to-[#d946ef]/20 border border-[#8b5cf6]/30 px-3 py-1 rounded-full text-xs font-black select-none text-white animate-pulse">
            <span className="text-[#e879f9]">S&L</span>
            <span>{isAr ? 'بوابة تسجيل الدخول' : 'Sign In Portal'} 🔑</span>
          </div>

          <h2 className="text-xl font-black text-white">
            {isAr ? 'تسجيل الدخول للمتجر' : 'Store Sign In'}
          </h2>
          <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
            {isAr 
              ? 'أهلاً بك مجدداً في متجر S&L البحريني المتميز. يرجى إدخال تفاصيل حسابك.' 
              : 'Welcome back to S&L Premium Bahraini store. Please enter your credentials.'}
          </p>
        </div>

        {/* Form elements */}
        <form onSubmit={handleAdminSubmit} className="mt-6 space-y-4">
          
          <div className="space-y-1 text-right">
            <label className={`text-[10px] font-bold text-zinc-300 block ${isAr ? 'text-right' : 'text-left'}`}>
              {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
            </label>
            <div className="relative">
              <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? "مثال: name@example.com" : "e.g. name@example.com"}
                className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/25 outline-none focus:border-[#d946ef] font-mono`}
              />
            </div>
          </div>

          <div className="space-y-1 text-right">
            <label className={`text-[10px] font-bold text-zinc-300 block ${isAr ? 'text-right' : 'text-left'}`}>
              {isAr ? 'الرقم السري:' : 'Password:'}
            </label>
            <div className="relative">
              <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/25 outline-none focus:border-[#d946ef] font-mono`}
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/35 text-rose-400 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5">
              <ShieldAlert size={14} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-[#1b124a]/50 p-3 rounded-xl border border-[#8b5cf6]/15 text-[10px] text-zinc-400 leading-relaxed flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-450 mt-1 shrink-0"></div>
            <p className={isAr ? 'text-right' : 'text-left'}>
              {isAr
                ? 'ملاحظة: البوابة مؤمنة بالكامل لحفظ وتدقيق الفواتير وحسابات المشرفين والشركاء.'
                : 'Note: Secured gateway to access, trace invoices and modify partner operations.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] hover:from-[#d946ef] hover:to-[#8b5cf6] text-white font-black py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-[#8b5cf6]/10 flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer text-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Sparkles size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? (isAr ? 'جاري التحقق... ⏳' : 'Verifying... ⏳') : (isAr ? 'تسجيل الدخول 🔐' : 'Sign In 🔐')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
