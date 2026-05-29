import { Home, Search, ShoppingCart, User as UserIcon } from 'lucide-react';

interface BottomNavBarProps {
  lang: 'ar' | 'en';
  cartCount: number;
  onHomeClick: () => void;
  onSearchClick: () => void;
  onCartClick: () => void;
  onAccountClick: () => void;
  activeTab: 'products' | 'coupons';
  activeCategory: string;
  isSearchActive: boolean;
}

export default function BottomNavBar({
  lang,
  cartCount,
  onHomeClick,
  onSearchClick,
  onCartClick,
  onAccountClick,
  activeTab,
  activeCategory,
  isSearchActive
}: BottomNavBarProps) {
  const isAr = lang === 'ar';

  // Determine active item
  const isHome = activeTab === 'products' && activeCategory === 'all' && !isSearchActive;

  return (
    <div id="bottom-nav-bar" className="fixed bottom-0 inset-x-0 bg-neutral-950/90 backdrop-blur-2xl border-t border-[#8b5cf6]/25 py-2 px-4 flex justify-around items-center z-50 text-white pb-safe-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.5)]">
      
      {/* 1. الرئيسية / Home */}
      <button
        onClick={onHomeClick}
        className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition duration-200 active:scale-95 flex-1 ${
          isHome ? 'text-amber-400 font-extrabold' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Home size={19} className={isHome ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
        <span className="text-[10px] tracking-tight">
          {isAr ? 'الرئيسية' : 'Home'}
        </span>
      </button>

      {/* 2. بحث / Search */}
      <button
        onClick={onSearchClick}
        className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition duration-200 active:scale-95 flex-1 relative ${
          isSearchActive ? 'text-amber-400 font-extrabold' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Search size={19} className={isSearchActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
        <span className="text-[10px] tracking-tight">
          {isAr ? 'بحث' : 'Search'}
        </span>
      </button>

      {/* 3. السلة / Cart */}
      <button
        onClick={onCartClick}
        className="flex flex-col items-center gap-1 py-1 cursor-pointer transition duration-200 active:scale-95 flex-1 text-zinc-400 hover:text-white relative"
      >
        <div className="relative">
          <ShoppingCart size={19} className="stroke-[1.8px]" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[8px] font-mono font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-neutral-950">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">
          {isAr ? 'السلة' : 'Cart'}
        </span>
      </button>

      {/* 4. الحساب / Account */}
      <button
        onClick={onAccountClick}
        className="flex flex-col items-center gap-1 py-1 cursor-pointer transition duration-200 active:scale-95 flex-1 text-zinc-400 hover:text-white"
      >
        <UserIcon size={19} className="stroke-[1.8px]" />
        <span className="text-[10px] tracking-tight">
          {isAr ? 'الحساب' : 'Account'}
        </span>
      </button>

    </div>
  );
}
