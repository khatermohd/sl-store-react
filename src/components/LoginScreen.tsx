import React, { useState } from 'react';
import { Mail, Lock, Sparkles, X, ShieldAlert, Check, Phone, User as UserIcon } from 'lucide-react';
import { User, AdminAccount } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onClose: () => void;
  lang: 'ar' | 'en';
}

interface SavedCustomer {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export default function LoginScreen({ onLogin, onClose, lang }: LoginScreenProps) {
  const isAr = lang === 'ar';
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Login Inputs
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone number
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration Inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Load custom registered customers from storage
  const getRegisteredCustomers = (): SavedCustomer[] => {
    const raw = localStorage.getItem('sl_registered_customers');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {
        return [];
      }
    }
    return [];
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');
    setLoading(true);

    const input = loginIdentifier.trim().toLowerCase();
    const pass = loginPassword.trim();

    if (!input || !pass) {
      setError(isAr ? 'يرجى كتابة كافة الحقول المطلوبة' : 'Please fill all required login fields');
      setLoading(false);
      return;
    }

    // 1. Identify if logging in as OWNER or Administrator
    const masterEmail = (localStorage.getItem('sl_admin_email') || (import.meta as any).env.VITE_ADMIN_EMAIL || 'al7anjri@gmail.com').toLowerCase();
    const masterPassword = localStorage.getItem('sl_admin_password') || (import.meta as any).env.VITE_ADMIN_PASSWORD || (import.meta as any).env.VITE_ADMIN_PASS || 'admin123';

    // Retrieve dodat-moderators list
    let moderators: AdminAccount[] = [];
    const savedMods = localStorage.getItem('sl_admin_accounts');
    if (savedMods) {
      try {
        moderators = JSON.parse(savedMods);
      } catch (_) {}
    }

    const isMaster = (input === 'al7anjri@gmail.com' || input === masterEmail) && pass === masterPassword;
    const isMod = moderators.some(acc => acc.email.toLowerCase() === input && acc.password === pass);

    if (isMaster || isMod) {
      setLoading(false);
      if (isMaster) {
        localStorage.setItem('sl_admin_email', input);
        localStorage.setItem('sl_admin_password', pass);
      }

      onLogin({
        name: isMaster ? (isAr ? 'المالك خاطر 👑' : 'Owner Khater 👑') : (moderators.find(acc => acc.email.toLowerCase() === input)?.name || 'مشرف مساعد'),
        phone: '39442011',
        email: input,
        isAdmin: true,
        isVerified: true
      });

      alert(isAr ? '🔓 أهلاً بك يا مالك المتجر في لوحة تحكم الإدارة الشاملة!' : '🔓 Welcome Administrator to the general controls console!');
      onClose();
      return;
    }

    // 2. Identify if regular registered customer
    const customers = getRegisteredCustomers();
    const foundCustomer = customers.find(c => {
      const emailMatch = c.email && c.email.toLowerCase() === input;
      const phoneMatch = c.phone && c.phone.trim() === input;
      return emailMatch || phoneMatch;
    });

    setLoading(false);

    if (foundCustomer) {
      if (foundCustomer.password === pass) {
        onLogin({
          name: foundCustomer.name,
          phone: foundCustomer.phone,
          email: foundCustomer.email || undefined,
          isAdmin: false,
          isVerified: true
        });
        alert(isAr ? `🔓 مرحباً بك مجدداً يا ${foundCustomer.name}!` : `🔓 Welcome back, ${foundCustomer.name}!`);
        onClose();
      } else {
        setError(isAr ? 'الرقم السري المدخل غير صحيح' : 'Incorrect password entered');
      }
    } else {
      setError(
        isAr 
          ? 'المستخدم غير مسجل بالمنظومة، تحقق من البريد/الهاتف أو اضغط على إنشاء حساب' 
          : 'User not registered. Check credentials or click Create Account'
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const phone = regPhone.trim();
    const pass = regPassword.trim();

    if (!name || !pass) {
      setError(isAr ? 'الاسم والرقم السري حقول إلزامية' : 'Full Name and Password are mandatory');
      return;
    }

    if (!email && !phone) {
      setError(isAr ? 'يجب إدخال إما البريد الإلكتروني أو رقم الهاتف للاعتماد' : 'Provide at least an Email address or a Mobile number');
      return;
    }

    // Check if customer already registered
    const customers = getRegisteredCustomers();
    const alreadyExists = customers.some(c => {
      const emailDup = email && c.email && c.email.toLowerCase() === email;
      const phoneDup = phone && c.phone && c.phone === phone;
      return emailDup || phoneDup;
    });

    if (alreadyExists) {
      setError(isAr ? 'البريد أو الهاتف مستخدم ومسجل مسبقاً!' : 'Email or phone number is already registered!');
      return;
    }

    // Append new customer
    const newCustomer: SavedCustomer = {
      name,
      email,
      phone,
      password: pass
    };

    const updated = [...customers, newCustomer];
    localStorage.setItem('sl_registered_customers', JSON.stringify(updated));

    setSuccess(isAr ? '🎉 تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...' : '🎉 Account created successfully! Logging you in...');

    // Log the user in immediately
    setTimeout(() => {
      onLogin({
        name: name,
        phone: phone || '39442011',
        email: email || undefined,
        isAdmin: false,
        isVerified: true
      });
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Black ambient backdrop */}
      <div 
        className="absolute inset-0 bg-[#0b0424]/90 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Login Card */}
      <div 
        className="relative max-w-md w-full bg-[#12092e] border border-[#8b5cf6]/40 text-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250 font-sans"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Glow corner decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d946ef]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8b5cf6]/15 rounded-full blur-3xl pointer-events-none"></div>

        <button 
          onClick={onClose}
          className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 p-1.5 rounded-xl text-zinc-400 hover:text-white bg-[#1b124a]/60 border border-[#8b5cf6]/20 transition cursor-pointer`}
          title={isAr ? 'إغلاق' : 'Close'}
        >
          <X size={14} />
        </button>

        <div className="text-center space-y-2 mt-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#8b5cf6]/25 to-[#d946ef]/25 border border-[#8b5cf6]/35 px-3.5 py-1 rounded-full text-xs font-black select-none text-white">
            <span className="text-[#e879f9]">S&L STORE</span>
            <span>{isAr ? 'بوابة الحسابات' : 'Identity Gateway'} 💎</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isRegisterMode 
              ? (isAr ? 'إنشاء حساب جديد' : 'Register Account')
              : (isAr ? 'تسجيل الدخول للمتجر' : 'Store Sign In')}
          </h2>
          <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-snug">
            {isRegisterMode
              ? (isAr ? 'سجل حسابك مجاناً وبسهولة للاحتفاظ بطلبياتك ومراجعة فواتيرك.' : 'Create an account to track your combined invoices & checkout history.')
              : (isAr ? 'أهلاً بك مجدداً. يرجى إدخال تفاصيل حسابك أو رقم هاتفك لاعتماد الطلب.' : 'Welcome back. Enter your email/phone coordinates to authorize checkout.')}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex mt-6 bg-[#160e3d] p-1 rounded-xl border border-[#8b5cf6]/20">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              !isRegisterMode ? 'bg-[#8b5cf6] text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔑 {isAr ? 'تسجيل دخول' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              isRegisterMode ? 'bg-[#ff007f] text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            👤 {isAr ? 'حساب جديد' : 'Register'}
          </button>
        </div>

        {/* Dynamic Mode Switcher */}
        {!isRegisterMode ? (
          /* Login Form */
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            
            <div className="space-y-1">
              <label className={`text-[10px] font-bold text-zinc-350 block ${isAr ? 'text-right' : 'text-left'}`}>
                {isAr ? 'البريد الإلكتروني أو رقم الهاتف:' : 'Email or Phone Number:'}
              </label>
              <div className="relative">
                <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                  <Mail size={13} />
                </span>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={isAr ? "مثال: name@example.com أو 3944..." : "e.g. name@example.com or phone..."}
                  className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/25 outline-none focus:border-[#d946ef] font-mono`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold text-zinc-350 block ${isAr ? 'text-right' : 'text-left'}`}>
                {isAr ? 'الرقم السري الحامي الحساب:' : 'Account Password:'}
              </label>
              <div className="relative">
                <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                  <Lock size={13} />
                </span>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8b5cf6] hover:bg-[#d946ef] text-white font-black py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-md transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{isAr ? 'دخول فوري للحساب 🔓' : 'Authorize Sign In 🔓'}</span>
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
            
            <div className="space-y-1">
              <label className={`text-[10px] font-bold text-zinc-350 block ${isAr ? 'text-right' : 'text-left'}`}>
                {isAr ? 'اسمك الثلاثي والكامل:' : 'Full Legal Name:'}
              </label>
              <div className="relative">
                <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                  <UserIcon size={13} />
                </span>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={isAr ? "مثال: خاطر البلوشي" : "e.g. Khater Al-Balooshi"}
                  className={`w-full text-xs sm:text-sm p-2.5 sm:p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/25 outline-none focus:border-[#ff007f]`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold text-zinc-350 block ${isAr ? 'text-right' : 'text-left'}`}>
                  {isAr ? 'البريد الإلكتروني (اختياري):' : 'Email address (Optional):'}
                </label>
                <div className="relative">
                  <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                    <Mail size={12} />
                  </span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@mail.com"
                    className={`w-full text-xs p-2.5 ${isAr ? 'pr-8 pl-2 text-right' : 'pl-8 pr-2 text-left'} bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/25 outline-none focus:border-[#ff007f] font-mono`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-bold text-zinc-350 block ${isAr ? 'text-right' : 'text-left'}`}>
                  {isAr ? 'رقم الهاتف (اختياري):' : 'Phone number (Optional):'}
                </label>
                <div className="relative">
                  <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                    <Phone size={12} />
                  </span>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="39442011"
                    className={`w-full text-xs p-2.5 ${isAr ? 'pr-8 pl-2 text-right' : 'pl-8 pr-2 text-left'} bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/25 outline-none focus:border-[#ff007f] font-mono`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold text-zinc-350 block ${isAr ? 'text-right' : 'text-left'}`}>
                {isAr ? 'اختر رمز سري آمن لحسابك:' : 'Define Account Password:'}
              </label>
              <div className="relative">
                <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`}>
                  <Lock size={13} />
                </span>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/25 outline-none focus:border-[#ff007f] font-mono`}
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/35 text-rose-400 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5 animate-pulse">
                <ShieldAlert size={14} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-450 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5">
                <Check size={14} className="shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#ff007f] hover:bg-[#d946ef] text-white font-black py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-md transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{isAr ? 'تسجيل وحفظ البيانات 👤' : 'Create My Account 👤'}</span>
            </button>
          </form>
        )}

        {/* Security watermark footer */}
        <div className="bg-[#1b124a]/50 p-3 rounded-2xl border border-[#8b5cf6]/15 text-[10px] text-zinc-400 leading-relaxed flex items-start gap-2 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1] mt-1 shrink-0 animate-ping"></div>
          <p className={isAr ? 'text-right' : 'text-left'}>
            {isAr
              ? 'ملاحظة: يمكنك استخدام هاتفك للاعتماد الفوري، وفي حال تسجيل حساب المالك al7anjri@gmail.com يتعرف عليك المتحد برمجياً ويفتح لوحة التحكم.'
              : 'Sign in utilizing your mobile coordinate. Logins with owner al7anjri@gmail.com dynamically trigger global dashboard controls.'}
          </p>
        </div>
      </div>
    </div>
  );
}
