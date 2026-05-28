import { User } from '../types';
import { ShoppingBag, Globe, LogIn, LogOut, User as UserIcon, Tag } from 'lucide-react';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  user: User | null;
  onRequestLogin: () => void;
  onLogout: () => void;
  cartCount: number;
  onCartToggle: () => void;
  storeName: string;
  storeLogoUrl?: string;
  activeTab: 'products' | 'coupons';
  setActiveTab: (tab: 'products' | 'coupons') => void;
}

export default function Header({
  lang,
  setLang,
  user,
  onRequestLogin,
  onLogout,
  cartCount,
  onCartToggle,
  storeName,
  storeLogoUrl,
  activeTab,
  setActiveTab
}: HeaderProps) {
  const isAr = lang === 'ar';

  return (
    <header className="bg-[#12092e]/80 backdrop-blur-md border border-[#8b5cf6]/20 rounded-2xl p-3.5 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full text-white">
      {/* Brand Logo & Name */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-3">
          {storeLogoUrl ? (
            <img 
              src={storeLogoUrl} 
              alt={storeName} 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-contain border border-[#8b5cf6]/30 shadow-md"
            />
          ) : (
            /* Gorgeous Handcrafted vector emblem logo fitting S&L name */
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] via-[#d946ef] to-[#bfdbfe] flex items-center justify-center shadow-lg font-sans font-black select-none text-white text-xl tracking-tight uppercase border border-[#a78bfa]/40 group">
              <span className="relative z-10 font-black animate-pulse">S&L</span>
              <div className="absolute inset-0.5 rounded-[14px] bg-[#12092e] opacity-40 group-hover:opacity-0 transition duration-300"></div>
            </div>
          )}

          <div className="text-right">
            <span className="block font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d946ef] to-[#bfdbfe] text-xl tracking-wide font-sans">{storeName}</span>
            <span className="text-[9px] font-extrabold text-[#c5a059] block tracking-widest uppercase font-mono">
              {isAr ? 'البحرين ● سوق متميز' : 'Bahrain ● Premium Hub'}
            </span>
          </div>
        </div>

        {/* Small responsive cart, lang bar, and Admin Lock visible on mobile only right beside logo */}
        <div className="flex items-center gap-1.5 md:hidden">
          {/* Cart trigger button */}
          <button 
            onClick={onCartToggle}
            className="p-2.5 rounded-xl bg-[#1b124a] hover:bg-[#251b61] border border-[#ff007f]/30 text-white relative flex items-center justify-center"
          >
            <ShoppingBag size={15} className="text-[#e879f9]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#d946ef] text-white text-[9px] font-mono font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg border border-[#12092e] animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
          
          {/* Lang toggle button */}
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="p-2.5 rounded-xl bg-[#1b124a] text-zinc-350 text-[10px] font-bold border border-[#a78bfa]/20 flex items-center justify-center hover:text-white cursor-pointer select-none"
          >
            {isAr ? 'EN' : 'عربي'}
          </button>

          {/* Dedicated responsive admin entrance directly on mobile */}
          {user ? (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-500/20 text-[10px] font-bold"
              title={isAr ? 'خروج المشرف' : 'Log out Admin'}
            >
              🚪
            </button>
          ) : (
            <button
              onClick={onRequestLogin}
              className="px-2.5 py-1.5 rounded-xl bg-[#1e053f]/80 text-amber-300 border border-amber-500/30 font-black flex items-center gap-1 cursor-pointer hover:bg-amber-550 hover:text-white transition duration-200 text-[10.5px]"
              title={isAr ? 'تسجيل دخول الإدارة 🔐' : 'Authorized Login 🔐'}
            >
              <span>🔐</span>
              <span>{isAr ? 'تسجيل دخول' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Slogan / Tabs Navigation */}
      <div className="flex bg-[#12092e] border border-[#8b5cf6]/20 p-1 rounded-xl w-full md:w-auto max-w-sm justify-center">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg font-black text-[11px] sm:text-xs transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 select-none ${
            activeTab === 'products'
              ? 'bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingBag size={13} />
          <span>{isAr ? 'منتجات المتجر' : 'Products'}</span>
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg font-black text-[11px] sm:text-xs transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 select-none ${
            activeTab === 'coupons'
              ? 'bg-[#d946ef] text-white shadow-md shadow-[#d946ef]/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Tag size={13} />
          <span>{isAr ? 'خصومات وعروض المحلات 🎟️' : 'Local Coupons'}</span>
        </button>
      </div>

      {/* Language, Cart and Profile controls */}
      <div className="hidden md:flex items-center gap-3">
        {/* Language selector */}
        <button
          onClick={() => setLang(isAr ? 'en' : 'ar')}
          className="px-3.5 py-2 rounded-xl bg-[#1b124a] hover:bg-[#251b61] text-zinc-200 text-xs font-black border border-[#a78bfa]/20 flex items-center gap-1.5 cursor-pointer transition select-none"
        >
          <Globe size={13} className="text-[#a78bfa]" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>

        {/* Desktop badged Cart trigger */}
        <button
          onClick={onCartToggle}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1b124a] to-[#2a1d6f] hover:from-[#2a1d6f] hover:to-[#1b124a] text-xs font-black border border-[#d946ef]/40 text-white relative flex items-center gap-2 cursor-pointer transition select-none shadow-md shadow-[#d946ef]/5"
        >
          <ShoppingBag size={14} className="text-[#e879f9]" />
          <span>{isAr ? 'سلّة المشتريات' : 'My Cart'}</span>
          {cartCount > 0 ? (
            <span className="bg-[#d946ef] text-white text-[10px] font-mono font-black px-2 py-0.5 rounded-full animate-bounce">
              {cartCount}
            </span>
          ) : (
            <span className="text-zinc-500 font-mono text-[10px]">0</span>
          )}
        </button>

        {/* User login / status button */}
        {user ? (
          <div className="flex items-center gap-2 bg-[#1b124a]/80 border border-[#8b5cf6]/30 px-3.5 py-1.5 rounded-xl">
            <div className="text-right">
              <span className="text-[8px] text-zinc-400 block font-bold leading-none mb-0.5">
                {user.isAdmin ? (isAr ? 'المشرف العام 👑' : 'System Owner 👑') : (isAr ? 'العضو الحالي' : 'Authorized User')}
              </span>
              <span className="text-[11px] font-black text-white block leading-tight truncate max-w-[120px]">
                {user.name}
              </span>
            </div>
            
            <button
              onClick={onLogout}
              title={isAr ? 'تسجيل الخروج' : 'Logout'}
              className="p-1.5 text-zinc-400 hover:text-red-400 bg-[#12092e] rounded-lg transition"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onRequestLogin}
            className="bg-zinc-100 hover:bg-[#8b5cf6] hover:text-white text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <LogIn size={13} />
            <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
