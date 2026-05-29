import { X, Search, ShoppingCart, Check } from 'lucide-react';
import { Product } from '../types';
import { useState } from 'react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  products: Product[];
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  lang,
  products,
  onAddToCart,
  searchQuery,
  setSearchQuery
}: SearchModalProps) {
  const isAr = lang === 'ar';
  const [addedItem, setAddedItem] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time filtering matching search term
  const results = products.filter(p => {
    if (!searchQuery.trim()) return false;
    const title = isAr ? p.title : (p.titleEn || p.title);
    const desc = isAr ? p.description : (p.descriptionEn || p.description);
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAdd = (p: Product) => {
    onAddToCart(p);
    setAddedItem(p.id);
    setTimeout(() => {
      setAddedItem(null);
    }, 1200);
  };

  return (
    <div id="search-modal-overlay" className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-[100] flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-[#12092e] border border-[#8b5cf6]/40 p-4 sm:p-6 rounded-3xl w-full max-w-xl shadow-2xl relative animate-in slide-in-from-top-6 duration-300">
        
        {/* Close trigger */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} p-1.5 rounded-full bg-neutral-900 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer`}
        >
          <X size={15} />
        </button>

        <h3 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#d946ef] mb-3">
          {isAr ? 'ابحث في متجر S&L المتميز 🔍' : 'Search S&L Premium Store 🔍'}
        </h3>

        {/* Input box */}
        <div className="relative w-full mt-1">
          <span className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-400`}>
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'أدخل اسم العطر، الملابس، أو إكسسوارات السيارات...' : 'Enter perfume, clothing, or car accessories...'}
            className={`w-full text-xs sm:text-sm ${isAr ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'} py-3.5 bg-neutral-900 text-white font-bold rounded-2xl border border-[#8b5cf6]/35 outline-none focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] transition shadow-md placeholder-zinc-500`}
            autoFocus
          />
        </div>

        {/* Result summary */}
        <div className="mt-4 max-h-[350px] overflow-y-auto space-y-2 scrollbar-none">
          {searchQuery.trim() === '' ? (
            <p className="text-[10px] text-zinc-500 text-center py-6">
              {isAr ? 'ابدأ بكتابة الأحرف لتصفح النتائج فوراً...' : 'Start typing to search products in real-time...'}
            </p>
          ) : results.length > 0 ? (
            results.map((p) => {
              const title = isAr ? p.title : (p.titleEn || p.title);
              const isAdded = addedItem === p.id;
              return (
                <div 
                  key={p.id}
                  className="p-2.5 bg-neutral-900/60 border border-white/5 hover:border-[#8b5cf6]/30 rounded-xl flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={p.image} 
                      alt="" 
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-800 border border-white/5 shrink-0" 
                    />
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-extrabold text-white truncate">{title}</h4>
                      <p className="text-[11px] text-[#22c55e] font-mono font-bold mt-0.5">{p.price.toFixed(3)} BHD</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(p)}
                    className={`p-1.5 px-3 rounded-lg text-[9.5px] font-black cursor-pointer flex items-center gap-1 transition ${
                      isAdded ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white'
                    }`}
                  >
                    {isAdded ? <Check size={10} /> : <ShoppingCart size={10} />}
                    <span>{isAdded ? (isAr ? 'مضاف' : 'Added') : (isAr ? 'أضف' : 'Add')}</span>
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-zinc-500 text-center py-6">
              {isAr ? 'لا توجد نتائج موازية، جرب مرادفات أخرى!' : 'No matching results found for your query!'}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
