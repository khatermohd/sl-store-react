import { User } from '../types';
import { ShoppingBag, Globe, LogIn, LogOut, Bell, Sparkles } from 'lucide-react';

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
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
  setActiveTab,
  activeCategory,
  setActiveCategory
}: HeaderProps) {
  const isAr = lang === 'ar';

  // Store categories of the integrated web shop: Text-only as requested by the user, with "قسم السيدات" added
  const categoryTabs = [
    { id: 'cars', type: 'products', titleAr: 'السيارات', titleEn: 'Cars' },
    { id: 'home', type: 'products', titleAr: 'المنزل', titleEn: 'Home' },
    { id: 'electronics', type: 'products', titleAr: 'إلكترونيات', titleEn: 'Electronics' },
    { id: 'perfumes', type: 'products', titleAr: 'العطور والبخور', titleEn: 'Fragrances' },
    { id: 'children', type: 'products', titleAr: 'أطفال', titleEn: 'Children' },
    { id: 'games', type: 'products', titleAr: 'العاب', titleEn: 'Games' },
    { id: 'ladies', type: 'products', titleAr: 'قسم السيدات', titleEn: 'Women\'s Section' },
    { id: 'clothes', type: 'products', titleAr: 'الملابس', titleEn: 'Clothes' },
    { id: 'rent', type: 'products', titleAr: 'إيجار', titleEn: 'Rent' },
    { id: 'coupons', type: 'coupons', titleAr: 'كوبونات', titleEn: 'Coupons' },
    { id: 'others', type: 'products', titleAr: 'أخرى', titleEn: 'Others' }
  ];

  const handleTabClick = (tab: typeof categoryTabs[0]) => {
    if (tab.type === 'coupons') {
      setActiveTab('coupons');
    } else {
      setActiveTab('products');
      setActiveCategory(tab.id);
    }
  };

  const isTabActive = (tab: typeof categoryTabs[0]) => {
    if (tab.type === 'coupons') {
      return activeTab === 'coupons';
    }
    return activeTab === 'products' && activeCategory === tab.id;
  };

  return (
    <header className="bg-gradient-to-b from-black/25 to-[#12092e]/80 backdrop-blur-2xl border border-[#8b5cf6]/20 rounded-3xl p-5 sm:p-6 flex flex-col gap-6 text-white shadow-2xl relative w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Visual top border glow */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#8b5cf6]/40 to-transparent"></div>

      {/* Row 1: Logo & Store Name (S&L PREMIUM STORE) + Quick Controls */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3.5">
          {storeLogoUrl ? (
            <img 
              src={storeLogoUrl} 
              alt={storeName} 
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-contain border border-[#8b5cf6]/35 shadow-md bg-white/5"
            />
          ) : (
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#da291c] via-[#ed8936] to-[#ec4899] flex items-center justify-center shadow-lg font-sans font-black select-none text-white text-2xl border border-white/20 group">
              <span className="relative z-10 font-sans tracking-tight">S&L</span>
              <div className="absolute inset-0.5 rounded-[14px] bg-[#12092e] opacity-40"></div>
            </div>
          )}

          <div className="text-right">
            {/* Show name S&L STORE prominently as requested */}
            <span className="block font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-pink-300 text-2xl tracking-wide font-sans sm:text-3xl drop-shadow-md">
              S&L STORE
            </span>
            <span className="text-[9.5px] font-black text-indigo-300 block tracking-widest uppercase font-mono mt-0.5">
              {isAr ? 'البحرين ● متجرك المتكامل المعزز' : 'Bahrain ● Your Integrated Hub'}
            </span>
          </div>
        </div>

        {/* Quick controls: Language & Admin status */}
        <div className="flex items-center gap-2">
          
          {/* Language Selection Toggle */}
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#1b124a]/85 text-zinc-300 border border-[#a78bfa]/15 flex items-center gap-1 hover:text-white cursor-pointer select-none transition"
          >
            <Globe size={12} className="text-amber-400" />
            <span className="font-bold">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Admin Indicator Gateway */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-[#1b124a]/80 border border-[#8b5cf6]/35 p-1.5 px-3 rounded-xl text-xs">
              <span className="text-[10px] text-emerald-400 font-extrabold truncate max-w-[80px]">{user.name}</span>
              <button 
                onClick={onLogout} 
                className="hover:text-rose-400 text-zinc-400 cursor-pointer" 
                title={isAr ? 'تسجيل الخروج' : 'Logout Admin'}
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
               onClick={onRequestLogin}
               className="px-3 py-1.5 rounded-xl bg-[#1b124a]/80 hover:bg-[#251b61] border border-[#a78bfa]/15 text-white font-extrabold cursor-pointer transition text-xs flex items-center gap-1"
            >
              <span>🔐</span>
              <span className="hidden sm:inline">{isAr ? 'إشراف' : 'Admin'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Row 2: قسم الأقسام (Categories) مباشِرةً تحت الإسِم */}
      {/* We build a horizontal grid/collection of rounded cards style */}
      <div className="border-t border-[#8b5cf6]/15 pt-4">
        <div className="text-[10.5px] font-black text-zinc-400 mb-3 block px-1 tracking-wider uppercase">
          {isAr ? 'أقسام المتجر المتكاملة' : 'STORE DEPARTMENTS'}
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          {categoryTabs.map((tab) => {
            const active = isTabActive(tab);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center justify-center px-4 py-2.5 rounded-full transition-all duration-300 cursor-pointer text-xs font-black border ${
                  active
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] border-transparent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)] scale-[0.98]'
                    : 'bg-[#12092e]/45 border-[#8b5cf6]/15 text-zinc-300 hover:border-[#8b5cf6]/60 hover:text-white hover:bg-[#12092e]/80'
                }`}
              >
                {/* Structured label or full name directly */}
                <span>{isAr ? tab.titleAr : tab.titleEn}</span>
              </button>
            );
          })}
        </div>
      </div>

    </header>
  );
}
