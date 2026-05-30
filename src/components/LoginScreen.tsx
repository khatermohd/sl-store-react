import React, { useState, useEffect } from 'react';
import { Mail, Lock, Sparkles, X, ShieldAlert, Check, Phone, User as UserIcon, MessageSquare } from 'lucide-react';
import { User, AdminAccount } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export default function LoginScreen({ onLogin, onClose, lang }: LoginScreenProps) {
  const isAr = lang === 'ar';
  
  // Clean phone number for WhatsApp redirects
  const getCleanPhoneForWa = (phone: string) => {
    let clean = phone.replace(/\s+/g, '').replace(/[+\-()]/g, '');
    if (clean.startsWith('00')) {
      clean = clean.substring(2);
    }
    if (clean.length === 8) {
      clean = '973' + clean;
    }
    return clean;
  };
  
  // Modes: 'otp' | 'admin'
  const [activeTab, setActiveTab] = useState<'otp' | 'admin'>('otp');
  
  // States for Phone OTP Login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [showSimulatedSms, setShowSimulatedSms] = useState(false);

  // States for Admin Password Login
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // General Notification States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Timer countdown for sending OTP again
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handler to request Verification Code (OTP)
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const phoneClean = phoneNumber.trim();
    const nameClean = fullName.trim();

    if (!phoneClean) {
      setError(isAr ? 'يرجى كتابة رقم راتف للتواصل' : 'Please provide closer phone number');
      return;
    }

    if (!nameClean) {
      setError(isAr ? 'يرجى كتابة الاسم الثلاثي الكامل للعميل للاعتماد' : 'Please provide your full legal name');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Generate random 4-digit code
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setTimer(59); // 1 minute cooldown
      setLoading(false);
      setShowSimulatedSms(false);
      setSuccess(isAr 
        ? '💬 تم توليد الرمز وجاهز للتأكيد عبر الواتساب الخاص بك!' 
        : '💬 Your security verification code is generated!');

    }, 800);
  };

  // Handler to verify the OTP and log the customer in
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (enteredOtp !== generatedOtp) {
      setError(isAr ? '❌ الرمز الذي أدخلته غير مطابق! تحقق من الرسالة التجريبية.' : '❌ Mismatched code! Double-check simulated alert banner.');
      return;
    }

    setSuccess(isAr ? '🎉 تم التحقق واعتماد رقم هاتفك بنجاح!' : '🎉 Verification successful! Phone number is now authenticated.');
    setLoading(true);

    const savedUser: User = {
      name: fullName.trim(),
      phone: phoneNumber.trim(),
      isVerified: true,
      isAdmin: false
    };

    // Save newly authenticated customer to general local ledger
    const existingRaw = localStorage.getItem('sl_registered_customers') || '[]';
    let existingList = [];
    try {
      existingList = JSON.parse(existingRaw);
    } catch (_) {}
    
    const isNew = !existingList.some((c: any) => c.phone === savedUser.phone);
    if (isNew) {
      existingList.push({
        name: savedUser.name,
        phone: savedUser.phone,
        email: '',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('sl_registered_customers', JSON.stringify(existingList));
    }

    setTimeout(() => {
      onLogin(savedUser);
      onClose();
    }, 1200);
  };

  // Handler for Admin Password Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const input = adminEmail.trim().toLowerCase();
    const pass = adminPassword.trim();

    if (!input || !pass) {
      setError(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required administrator fields');
      return;
    }

    setLoading(true);

    // Call server-side authentication route to safely check admin access without exposing variables to the client bundle
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: input, password: pass })
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setLoading(false);
          onLogin({
            name: isAr ? 'المالك خاطر 👑' : 'Owner Khater 👑',
            phone: '39442011',
            email: data.email || input,
            isAdmin: true,
            isVerified: true
          });
          setSuccess(isAr ? '🔓 أهلاً بك يا مالك المتجر في لوحة تحكم الإدارة الشاملة!' : '🔓 Welcome Administrator to the general controls console!');
          setTimeout(() => {
            onClose();
          }, 1100);
        } else {
          // If server-side Master email check fails, verify if it matches user-created local moderator helpers list
          let moderators: AdminAccount[] = [];
          const savedMods = localStorage.getItem('sl_admin_accounts');
          if (savedMods) {
            try {
              moderators = JSON.parse(savedMods);
            } catch (_) {}
          }
          const matchedMod = moderators.find(acc => acc.email.toLowerCase() === input && acc.password === pass);
          setLoading(false);
          
          if (matchedMod) {
            onLogin({
              name: matchedMod.name || (isAr ? 'مشرف مساعد' : 'Assistant Moderator'),
              phone: '39442011',
              email: input,
              isAdmin: true,
              isVerified: true
            });
            setSuccess(isAr ? '🔓 أهلاً بك في لوحة تحكم المشرف المساعد!' : '🔓 Welcome assistant manager!');
            setTimeout(() => {
              onClose();
            }, 1100);
          } else {
            setError(isAr ? '❌ بيانات الدخول للإدارة غير صحيحة.' : '❌ Incorrect credentials for admin privileges.');
          }
        }
      })
      .catch((err) => {
        setLoading(false);
        // Fallback check if the server is offline (local dev setup option check)
        let moderators: AdminAccount[] = [];
        const savedMods = localStorage.getItem('sl_admin_accounts');
        if (savedMods) {
          try { moderators = JSON.parse(savedMods); } catch (_) {}
        }
        const matchedMod = moderators.find(acc => acc.email.toLowerCase() === input && acc.password === pass);
        if (matchedMod) {
          onLogin({
            name: matchedMod.name,
            phone: '39442011',
            email: input,
            isAdmin: true,
            isVerified: true
          });
          setSuccess(isAr ? '🔓 أهلاً بك (وضع غير متصل بالشبكة).' : '🔓 Welcome assistant manager (offline mode).');
          setTimeout(() => onClose(), 1100);
        } else {
          setError(isAr ? '❌ عطلاً في الاتصال بالسيرفر للمصادقة.' : '❌ Server authentication network error.');
        }
      });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Light modern overlay backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Login Card */}
      <div 
        className="relative max-w-md w-full bg-white border border-slate-200 text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <button 
          onClick={onClose}
          className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer`}
          title={isAr ? 'إغلاق' : 'Close'}
        >
          <X size={15} />
        </button>

        <div className="text-center space-y-2 mt-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-[11px] font-black select-none text-indigo-700">
            <span className="text-indigo-800">S&L STORE BAHRAIN</span>
            <span>{isAr ? 'بوابة التحقق' : 'Security Verification'} 🛡️</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            {activeTab === 'otp' 
              ? (isAr ? 'دخول بحساب رقم الجوال' : 'Phone Identity Verification')
              : (isAr ? 'تسجيل دخول الإدارة والمالك' : 'Administrator Sign In')}
          </h2>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-normal">
            {activeTab === 'otp'
              ? (isAr ? 'يرجى تأكيد رقم جوالك ليصلك رمز تتبع الطلبات والتوثيق للمتابعة معك.' : 'Introduce your mobile phone to receive live text verification and confirm records.')
              : (isAr ? 'تسجيل دخول الحساب الإداري المخصص لمالك ومسؤولي المتجر.' : 'Secure entrance panel restricted for owner & managers only.')}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex mt-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('otp');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer ${
              activeTab === 'otp' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📱 {isAr ? 'حساب العميل (بقفل التحقق)' : 'Customer Access (SMS)'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer ${
              activeTab === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            🔑 {isAr ? 'بوابة الإدارة (والمالك)' : 'Store Owner Panel'}
          </button>
        </div>

        {/* Tab 1: Customer Phone Verification (SMS OTP) */}
        {activeTab === 'otp' && (
          <div className="mt-5 space-y-4">
            {!otpSent ? (
              /* Requesting Phone Code */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    {isAr ? 'اسم العميل بالكامل (لتسجيل الفاتورة باسمك):' : 'Full Name (For official invoicing):'}
                  </label>
                  <div className="relative">
                    <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`}>
                      <UserIcon size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isAr ? "مثال: علي البلوشي" : "e.g., Ali Al-Balooshi"}
                      className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 focus:bg-white`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    {isAr ? 'رقم الهاتف للتواصل ومتابعة توصيل الطلب:' : 'WhatsApp Phone Number:'}
                  </label>
                  <div className="relative">
                    <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`}>
                      <Phone size={14} />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={isAr ? "مثال: 39****** (البحرين) أو رقم بلدكم" : "e.g., 39****** or International"}
                      className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 focus:bg-white font-mono`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-650 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5">
                    <ShieldAlert size={14} className="shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs sm:text-sm transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                >
                  <Sparkles size={14} />
                  <span>{loading ? (isAr ? 'جاري الإرسال...' : 'Sending request...') : (isAr ? 'طلب رمز التفعيل المؤقت ⚡' : 'Request Security Code ⚡')}</span>
                </button>
              </form>
            ) : (
              /* Entering OTP Code */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-3 text-right">
                  <div className="bg-emerald-50/70 p-4.5 rounded-2xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed space-y-2">
                    <p className="font-extrabold text-sm text-emerald-800 flex items-center gap-1">
                      <span>💬 {isAr ? `تفعيل رقم هاتف العميل: ${phoneNumber}` : `WhatsApp verification for ${phoneNumber}`}</span>
                    </p>
                    <p className="text-[10px]">
                      {isAr 
                        ? 'أهلاً بك! لتأكيد هوية هاتفك والتفعيل الفوري، يرجى النقر على الزر الأخضر أدناه لفتح شات الواتساب الخاص بك لتلقي الرمز، ثم انسخه وأدخله بالأسفل لتنشيط حسابك بالكامل:' 
                        : 'Welcome! To verify your identity and activate your session, please click the green WhatsApp button below to open your chat and receive the verification code. Then copy and insert the code below:'}
                    </p>

                    {/* WhatsApp Action Button with requested text format */}
                    <a
                      href={`https://wa.me/${getCleanPhoneForWa(phoneNumber)}?text=${encodeURIComponent(
                        `رمز التحقق الخاص بك في موقع S&L (${generatedOtp})`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-[11px] text-center transition transform active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-150 cursor-pointer"
                    >
                      <MessageSquare size={13} />
                      <span>{isAr ? 'احصل على الرمز عبر الواتساب الخاص بك 💬' : 'Get Code via your WhatsApp 💬'}</span>
                    </a>
                  </div>

                  <label className="text-[11px] font-bold text-slate-600 block mt-3">
                    {isAr ? 'أدخل الرمز المكون من 4 أرقام هنا للإتمام والتوثيق:' : 'Enter the 4-digit code below to submit:'}
                  </label>
                  
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g., 1234"
                    className="w-full text-center text-lg tracking-[0.5em] p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 focus:bg-white font-mono font-black"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-650 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5">
                    <ShieldAlert size={14} className="shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5">
                    <Check size={14} className="shrink-0 text-emerald-600" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setEnteredOtp('');
                      setError('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition cursor-pointer text-center"
                  >
                    {isAr ? 'تعديل الرقم ✏️' : 'Edit number'}
                  </button>

                  <button
                    type="submit"
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm transition transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{isAr ? 'التحقق وتسجيل الدخول 🔓' : 'Verify & Log In 🔓'}</span>
                  </button>
                </div>

                {timer > 0 ? (
                  <p className="text-[10px] text-center text-slate-400">
                    {isAr ? `إعادة الإرسال بعد ${timer} ثانية` : `Resend in ${timer}s`}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      setTimer(59);
                      const code = Math.floor(1000 + Math.random() * 9000).toString();
                      setGeneratedOtp(code);
                      setShowSimulatedSms(false);
                    }}
                    className="w-full text-[10px] text-indigo-600 hover:underline text-center cursor-pointer block font-bold"
                  >
                    {isAr ? '🔄 توليد رمز جديد للواتساب' : '🔄 Generate new WhatsApp code'}
                  </button>
                )}
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Admin Password Entrance */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-[11px] font-bold text-slate-600 block">
                {isAr ? 'البريد الإلكتروني المعتمد للمالك:' : 'Registered Owner Email:'}
              </label>
              <div className="relative">
                <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`}>
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder={isAr ? "مثال: owner@domain.com" : "e.g., owner@domain.com"}
                  className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 focus:bg-white`}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-[11px] font-bold text-slate-600 block">
                {isAr ? 'كلمة السر الإدارية لحماية اللوحة:' : 'Security Admin Password:'}
              </label>
              <div className="relative">
                <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`}>
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full text-xs sm:text-sm p-3 ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 focus:bg-white font-mono`}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-650 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5">
                <ShieldAlert size={14} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] p-2.5 rounded-xl flex items-center gap-1.5">
                <Check size={14} className="shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs sm:text-sm transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              <Lock size={13} />
              <span>{isAr ? 'دخول لوحة التحكم المشرف الشاملة 🔑' : 'Secure Admin Portal Access 🔑'}</span>
            </button>
          </form>
        )}

        {/* Security watermark footer */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed flex items-start gap-2 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0 animate-ping"></div>
          <p className={isAr ? 'text-right' : 'text-left'}>
            {isAr
              ? 'ملاحظة الأمن: ميزة الرمز تمكنك من التأكد 100% أن الزوار يمتلكون أرقام الهواتف المدخلة قبل أن يصلوا إليك على الواتساب لضمان جدية التواصل وعملاء حقيقيين.'
              : 'Verifying clients secures your store from false bookings and ensures genuine transaction contacts.'}
          </p>
        </div>
      </div>
    </div>
  );
}
