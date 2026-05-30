import { User } from '../types';
import { ShoppingBag, Globe, LogIn, LogOut, Bell, Sparkles, Search } from 'lucide-react';

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
  setActiveCategory,
  searchQuery,
  setSearchQuery
}: HeaderProps) {
  const isAr = lang === 'ar';

  // Store departments/categories including 'all' as the first option, text-only.
  const categoryTabs = [
    { id: 'all', type: 'products', titleAr: 'الكل', titleEn: 'All' },
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
    <header className="bg-white/95 backdrop-blur-2xl border border-slate-250/90 rounded-3xl p-5 sm:p-6 flex flex-col gap-5 text-slate-900 shadow-sm relative w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Visual top border glow */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

      {/* Row 1: Logo & Store Name (S&L PREMIUM STORE) + Quick Controls */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3.5">
          {storeLogoUrl ? (
            <img 
              src={storeLogoUrl} 
              alt={storeName} 
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-contain border border-slate-200/90 shadow-xs bg-slate-50"
            />
          ) : (
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#da291c] via-rose-500 to-[#d946ef] flex items-center justify-center shadow-md font-sans font-black select-none text-white text-2xl border border-white/20 group">
              <span className="relative z-10 font-sans tracking-tight">S&L</span>
              <div className="absolute inset-0.5 rounded-[14px] bg-indigo-950 opacity-10"></div>
            </div>
          )}

          <div className="text-right">
            {/* Show name S&L STORE prominently as requested */}
            <span className="block font-black text-transparent bg-clip-text bg-gradient-to-r from-red-650 via-slate-900 to-indigo-900 text-2xl tracking-wide font-sans sm:text-3xl">
              S&L STORE
            </span>
            <span className="text-[9.5px] font-black text-slate-500 block tracking-widest uppercase font-mono mt-0.5">
              {isAr ? 'البحرين ● متجرك المتكامل المعزز' : 'Bahrain ● Your Integrated Hub'}
            </span>
          </div>
        </div>

        {/* Quick controls: Language & Admin status */}
        <div className="flex items-center gap-2">
          
          {/* Language Selection Toggle */}
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 font-bold text-slate-700 border border-slate-200/90 flex items-center gap-1 hover:text-slate-950 hover:bg-slate-200 cursor-pointer select-none transition"
          >
            <Globe size={12} className="text-amber-500" />
            <span className="font-bold">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Admin Indicator Gateway */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-250/90 p-1.5 px-3 rounded-xl text-xs text-slate-800">
              <span className="text-[10px] text-indigo-700 font-extrabold truncate max-w-[80px]">{user.name}</span>
              <button 
                onClick={onLogout} 
                className="hover:text-rose-600 text-slate-500 cursor-pointer" 
                title={isAr ? 'تسجيل الخروج' : 'Logout Admin'}
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
               onClick={onRequestLogin}
               className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/95 text-slate-700 font-extrabold cursor-pointer transition text-xs flex items-center gap-1"
            >
              <span>🔐</span>
              <span className="hidden sm:inline">{isAr ? 'إشراف' : 'Admin'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Row 2: Search Box & Departments List */}
      <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
        
        {/* Search Input directly above categories */}
        <div className="relative w-full">
          <span className={`absolute ${isAr ? 'right-4.5' : 'left-4.5'} top-1/2 -translate-y-1/2 text-slate-400`}>
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن عطر، لباس، أو سلعة متميزة...' : 'Search for perfume, clothing, premium items...'}
            className={`w-full text-xs sm:text-sm ${isAr ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'} py-3 bg-slate-50 text-slate-900 rounded-2xl border border-slate-200/90 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 shadow-xs placeholder-slate-400`}
          />
        </div>

        {/* Categories Horizontal Row - Horizontal scrolling as requested */}
        <div>
          <div className="text-[10.5px] font-black text-slate-400 mb-2 px-1 tracking-wider uppercase">
            {isAr ? 'أقسام المتجر المتكاملة' : 'STORE DEPARTMENTS'}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 w-full max-w-full">
            {categoryTabs.map((tab) => {
              const active = isTabActive(tab);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex-none px-4 py-2 rounded-full transition-all duration-300 cursor-pointer text-xs font-black border whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-red-600 via-rose-500 to-indigo-600 text-white border-transparent shadow-xs scale-[0.98]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{isAr ? tab.titleAr : tab.titleEn}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </header>
  );
}
