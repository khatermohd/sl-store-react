import { useState } from 'react';
import { PartnerCoupon } from '../types';
import { Copy, Check, Search, Filter, Tag, ArrowUpRight } from 'lucide-react';

interface OffersSectionProps {
  lang: 'ar' | 'en';
  coupons: PartnerCoupon[];
}

export default function OffersSection({ lang, coupons }: OffersSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'health' | 'shopping'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isAr = lang === 'ar';

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const categories = [
    { id: 'all', titleAr: 'الكل', titleEn: 'All' },
    { id: 'food', titleAr: '🥗 مطاعم ومقاهي', titleEn: '🥗 Food & Cafes' },
    { id: 'health', titleAr: '🦷 صحة وعناية', titleEn: '🦷 Health & Care' },
    { id: 'shopping', titleAr: '👜 تسوق وترفيه', titleEn: '👜 Shopping & Leisure' }
  ];

  const filteredCoupons = coupons.filter(c => {
    const title = isAr ? c.titleAr : c.titleEn;
    const desc = isAr ? c.descriptionAr : c.descriptionEn;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Search Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
            <span>كوبونات خصم حصرية لشركائنا 🎟️</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            {isAr 
              ? 'احصل على أكواد خصم حصرية وموثقة من قبلنا للاستفادة منها عند الشراء مباشرة من المحلات والمطاعم المذكورة.' 
              : 'Unlock exclusive codes verified by S&L to use directly at partnered local businesses.'}
          </p>
        </div>

        {/* Search input */}
        <div className="relative max-w-xs w-full">
          <span className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`}>
            <Search size={15} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن كود، مطعم، أو عيادة...' : 'Search coupon, store, café...'}
            className={`w-full text-xs sm:text-sm ${isAr ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} py-2.5 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition placeholder-slate-400`}
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer border ${
              activeCategory === cat.id
                ? 'bg-slate-900 text-white border-transparent shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isAr ? cat.titleAr : cat.titleEn}
          </button>
        ))}
      </div>

      {/* Coupons grid */}
      {filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((c) => {
            const hasCopied = copiedCode === c.code;

            return (
              <div 
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-indigo-500 transition-all duration-300 relative overflow-hidden group shadow-xs"
              >
                {/* Decorative cut-outs representing a ticket coupon on light bg */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8fafc] border-r border-slate-200/50"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8fafc] border-l border-slate-200/50"></div>

                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-250/90 px-2 py-0.5 rounded-md inline-block">
                      {isAr ? 'قيمة الخصم:' : 'Discount Value:'} {c.discount}
                    </span>
                    <h3 className="font-black text-xs sm:text-[13.5px] text-slate-850 pt-2 leading-relaxed">
                      {isAr ? c.titleAr : c.titleEn}
                    </h3>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      {isAr ? c.descriptionAr : c.descriptionEn}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-lg shrink-0">
                    {c.category === 'food' ? '🥗' : c.category === 'health' ? '🦷' : '👜'}
                  </div>
                </div>

                {/* Ticket code copy segment */}
                <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 text-left">
                    <span className="text-[8px] text-slate-400 block uppercase tracking-wider font-mono">
                      {isAr ? 'رمز الكود البرمجي:' : 'COUPON CODE:'}
                    </span>
                    <span className="font-mono text-xs sm:text-[13px] font-black text-emerald-700 block tracking-wide select-all">
                      {c.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(c.code)}
                    className={`px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black flex items-center gap-1.5 transition-all outline-none cursor-pointer border ${
                      hasCopied
                        ? 'bg-emerald-600 border-transparent text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {hasCopied ? (
                      <>
                        <Check size={11} />
                        <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>{isAr ? 'نسخ الكود' : 'Copy Code'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3 max-w-sm mx-auto shadow-xs">
          <div className="text-3xl">🎫</div>
          <h4 className="font-black text-slate-800 text-xs sm:text-sm">
            {isAr ? 'لا توجد خصومات متوفرة حالياً' : 'No discount codes found'}
          </h4>
          <p className="text-[10px] text-zinc-400">
            {isAr ? 'يرجى مراجعة تصنيف آخر أو تصفية البحث.' : 'Try changing your category filters.'}
          </p>
        </div>
      )}

    </div>
  );
}
