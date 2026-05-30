import { useState } from 'react';
import { Product } from '../types';
import { Search, ShoppingCart, Play, Check, Tag, Eye, X, HelpCircle, Sparkles } from 'lucide-react';

interface ProductsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  lang: 'ar' | 'en';
  deliveryFee?: number;
  activeCategory?: string;
  setActiveCategory?: (category: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  hideCategoryBar?: boolean;
}

export default function ProductsSection({
  products,
  onAddToCart,
  lang,
  deliveryFee = 3,
  activeCategory: externalActiveCategory,
  setActiveCategory: externalSetActiveCategory,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  hideCategoryBar = false
}: ProductsSectionProps) {
  const isAr = lang === 'ar';
  
  const [localSearchQuery, localSetSearchQuery] = useState('');
  const [localActiveCategory, localSetActiveCategory] = useState<string>('all');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = externalSetSearchQuery !== undefined ? externalSetSearchQuery : localSetSearchQuery;

  const activeCategory = externalActiveCategory !== undefined ? externalActiveCategory : localActiveCategory;
  const setActiveCategory = externalSetActiveCategory !== undefined ? externalSetActiveCategory : localSetActiveCategory;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddedTip, setIsAddedTip] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const categories = [
    { id: 'all', titleAr: 'الكل', titleEn: 'All', image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=150&auto=format&fit=crop&q=60', emoji: '🏬' },
    { id: 'cars', titleAr: 'السيارات', titleEn: 'Cars', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=150&auto=format&fit=crop&q=60', emoji: '🚗' },
    { id: 'home', titleAr: 'المنزل', titleEn: 'Home', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=150&auto=format&fit=crop&q=60', emoji: '🏠' },
    { id: 'electronics', titleAr: 'إلكترونيات', titleEn: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=150&auto=format&fit=crop&q=60', emoji: '💻' },
    { id: 'perfumes', titleAr: 'العطور والبخور', titleEn: 'Fragrances', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=150&auto=format&fit=crop&q=60', emoji: '💨' },
    { id: 'children', titleAr: 'أطفال', titleEn: 'Children', image: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=150&auto=format&fit=crop&q=60', emoji: '👶' },
    { id: 'games', titleAr: 'العاب', titleEn: 'Video Games', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=60', emoji: '🎮' },
    { id: 'ladies', titleAr: 'قسم السيدات', titleEn: 'Women\'s Section', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=150&auto=format&fit=crop&q=60', emoji: '👜' },
    { id: 'clothes', titleAr: 'الملابس', titleEn: 'Clothes', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=150&auto=format&fit=crop&q=60', emoji: '👕' },
    { id: 'rent', titleAr: 'إيجار', titleEn: 'Rent', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&auto=format&fit=crop&q=60', emoji: '🔑' },
    { id: 'others', titleAr: 'أخرى', titleEn: 'Others', image: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=150&auto=format&fit=crop&q=60', emoji: '👜' }
  ];

  // Helper to format category title
  const getCategoryTitle = (catId: string) => {
    const found = categories.find(c => c.id === catId);
    if (found) return isAr ? found.titleAr : found.titleEn;
    return isAr ? 'أخرى' : 'Others';
  };

  const handleAddToCartWithAnimation = (product: Product) => {
    onAddToCart(product);
    setIsAddedTip(product.id);
    setTimeout(() => {
      setIsAddedTip(null);
    }, 1500);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const title = isAr ? p.title : (p.titleEn || p.title);
    const desc = isAr ? p.description : (p.descriptionEn || p.description);
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const knownCategories = ['cars', 'home', 'electronics', 'perfumes', 'children', 'games', 'ladies', 'clothes', 'rent'];
    let matchesCategory = true;
    if (activeCategory === 'all') {
      matchesCategory = true;
    } else if (activeCategory === 'others') {
      matchesCategory = p.category === 'others' || !knownCategories.includes(p.category);
    } else {
      matchesCategory = p.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  });

  // Find linked products (same deliveryGroupId) to display below chosen item
  const getLinkedProducts = (product: Product) => {
    if (!product.deliveryGroupId) return [];
    return products.filter(p => p.deliveryGroupId === product.deliveryGroupId && p.id !== product.id);
  };

  return (
    <div className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {!hideCategoryBar && (
        <>
          {/* Search Header - Only Search Box */}
          <div className="relative w-full max-w-xl mx-auto">
            <span className={`absolute ${isAr ? 'right-4.5' : 'left-4.5'} top-1/2 -translate-y-1/2 text-zinc-400`}>
              <Search size={17} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن عطر، لباس، أو ساعة فاخرة...' : 'Search for perfume, clothing, luxury watches...'}
              className={`w-full text-xs sm:text-sm ${isAr ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'} py-3 bg-[#12092e]/80 text-white rounded-2xl border border-[#8b5cf6]/35 outline-none focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] transition duration-200 shadow-md placeholder-zinc-500`}
            />
          </div>

          {/* Category filters as text-only modern chips without background images */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2.5 pt-1 font-sans">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-none px-4 py-2 rounded-full border text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] text-white border-transparent shadow-[0_0_12px_rgba(217,70,239,0.4)] scale-95'
                      : 'bg-[#160e3d]/70 text-zinc-350 border-[#8b5cf6]/20 hover:border-[#8b5cf6]/50 hover:bg-[#160e3d] hover:text-white'
                  }`}
                >
                  <span className="text-[13px] leading-none shrink-0 select-none pb-0.5">{cat.emoji}</span>
                  <span className="whitespace-nowrap">
                    {isAr ? cat.titleAr : cat.titleEn}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {filteredProducts.map((p) => {
            const title = isAr ? p.title : (p.titleEn || p.title);
            const desc = isAr ? p.description : (p.descriptionEn || p.description);
            const isAdded = isAddedTip === p.id;
            const hasVideo = !!p.videoUrl;
            
            return (
              <div 
                key={p.id}
                className="bg-[#12092e]/80 border border-[#8b5cf6]/15 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between hover:border-[#d946ef]/60 backdrop-blur-xs transition-all duration-300 relative group overflow-hidden shadow-md hover:shadow-[#bfdbfe]/5"
              >
                {/* Square Card Cover image with absolute badges */}
                <div 
                  className="aspect-square w-full bg-[#1b124a]/55 rounded-xl overflow-hidden relative cursor-pointer select-none"
                  onClick={() => setSelectedProduct(p)}
                >
                  <img 
                    src={p.image} 
                    alt={title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  
                  {/* Floating badges overlay inside image */}
                  <div className={`absolute top-1.5 ${isAr ? 'right-1.5' : 'left-1.5'} flex flex-col gap-1 z-10 pointer-events-none`}>
                    {hasVideo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoUrl(p.videoUrl || null);
                        }}
                        className="bg-gradient-to-r from-[#da291c] to-[#d946ef] hover:scale-105 transition text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm cursor-pointer pointer-events-auto"
                        title={isAr ? 'عرض فيديو المعاينة' : 'Play Video'}
                      >
                        <Play size={6} fill="currentColor" />
                        <span>{isAr ? 'عرض' : 'Play'}</span>
                      </button>
                    )}

                    {p.discount && (
                      <span className="bg-rose-600/95 border border-rose-500/30 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm inline-block">
                        🏷️ {isAr ? 'تخفيض' : 'Sale'} {p.discount}
                      </span>
                    )}
                  </div>

                  {/* Category overlay label */}
                  <span className={`absolute bottom-1.5 ${isAr ? 'left-1.5' : 'right-1.5'} bg-[#12092e]/85 border border-[#8b5cf6]/20 text-[8px] text-zinc-300 px-1.5 py-0.5 rounded-md`}>
                    {getCategoryTitle(p.category)}
                  </span>
                </div>

                {/* Card Body */}
                <div className="pt-2 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-[#cbd5e1]/10 border border-[#cbd5e1]/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        {isAr ? 'كود: ' : 'SKU: '}#{p.code || '00'}
                      </span>
                    </div>
                    <h3 
                      onClick={() => setSelectedProduct(p)}
                      className="font-black text-white text-[11px] sm:text-xs leading-tight cursor-pointer hover:text-[#d946ef] transition line-clamp-2 h-[28px] sm:h-[32px] overflow-hidden"
                      title={title}
                    >
                      {title}
                    </h3>
                    <p className="text-[10px] text-zinc-400 line-clamp-1 opacity-70 hidden sm:block">
                      {desc}
                    </p>
                  </div>

                  {/* Pricing and Cart add CTA (AliExpress Style compact tray) */}
                  <div className="border-t border-[#8b5cf6]/10 pt-1.5 flex items-center justify-between gap-1">
                    <div className="text-left font-mono">
                      <span className="text-[8.5px] text-zinc-500 block leading-none">
                        {isAr ? 'السعر:' : 'Price:'}
                      </span>
                      <span className="text-xs sm:text-[13.5px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-[#a78bfa] leading-none block mt-0.5">
                        {p.price.toFixed(3)} BHD
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCartWithAnimation(p)}
                      className={`h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg text-[9.5px] font-black cursor-pointer flex items-center gap-1 transition active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] hover:from-[#d946ef] hover:to-[#8b5cf6] text-white shadow-sm'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={9} />
                          <span className="hidden sm:inline">{isAr ? 'مضاف ✓' : 'Added ✓'}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={9} />
                          <span>{isAr ? 'أضف' : 'Add'}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#12092e]/40 border-2 border-dashed border-[#8b5cf6]/10 rounded-2xl p-16 text-center text-zinc-400 space-y-3 max-w-sm mx-auto">
          <div className="text-4xl text-[#8b5cf6]">🔍</div>
          <h4 className="font-black text-white text-xs sm:text-sm">
            {isAr ? 'لا توجد معروضات متاحة' : 'No products found'}
          </h4>
          <p className="text-[10px] text-zinc-500">
            {isAr ? 'يرجى مراجعة التهجئة أو تحديد قسم آخر.' : 'Try specifying another department tab.'}
          </p>
        </div>
      )}

      {/* AliExpress Detail & Combined Shipping Preview Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12092e] border border-[#8b5cf6]/40 text-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-[#1b124a]/85 text-zinc-300 hover:text-white border border-[#8b5cf6]/30 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Main Picture header */}
            <div className="h-56 sm:h-64 bg-slate-900 relative">
              <img 
                src={selectedProduct.image} 
                alt="" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-4 right-4 bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white text-[10px] font-black px-3 py-1 rounded-xl">
                {getCategoryTitle(selectedProduct.category)}
              </span>

              {selectedProduct.videoUrl && (
                <button
                  onClick={() => setActiveVideoUrl(selectedProduct.videoUrl || null)}
                  className="absolute bottom-4 left-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition shadow"
                >
                  <Play size={10} fill="currentColor" />
                  <span>{isAr ? 'شاهد فيديو المعاينة 🎬' : 'Watch Preview 🎬'}</span>
                </button>
              )}
            </div>

            {/* Details details text */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black tracking-widest text-[#d946ef] uppercase">S&L ORIGINAL SERIES</span>
                  <span className="bg-[#cbd5e1]/10 border border-[#cbd5e1]/20 text-amber-300 text-[10px] font-mono font-black px-2 py-0.5 rounded-md">
                    {isAr ? 'كود: ' : 'SKU: '} #{selectedProduct.code || '00'}
                  </span>
                </div>
                <h3 className="font-black text-sm sm:text-base text-white">{isAr ? selectedProduct.title : (selectedProduct.titleEn || selectedProduct.title)}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-normal bg-[#1b124a]/40 p-3 rounded-2xl border border-[#8b5cf6]/15">
                  {isAr ? selectedProduct.description : (selectedProduct.descriptionEn || selectedProduct.description)}
                </p>
              </div>



              {/* IMPORTANT: Link Products segment requested by user */}
              {/* "وعندما يقوم العميل بطلب احدهم يظهر له المنتجات الباقيه والتوصيل يكون مره وحده بسعر واحد" */}
              {selectedProduct.deliveryGroupId && (
                <div className="space-y-2.5 bg-[#1b124a]/20 p-3 rounded-2xl border border-[#8b5cf6]/10">
                  <span className="text-[11px] font-black text-[#5df6be] flex items-center gap-1">
                    <Sparkles size={11} className="text-[#5df6be] animate-bounce" />
                    <span>{isAr ? '📦 منتجات من نفس المستودع (وفر التوصيل):' : '📦 Products from the same warehouse (Combine Shipping):'}</span>
                  </span>

                  {getLinkedProducts(selectedProduct).length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-2.5">
                        {getLinkedProducts(selectedProduct).map(link => (
                          <div 
                            key={link.id}
                            className="bg-[#1b124a]/80 border border-[#8b5cf6]/20 p-2 rounded-xl flex items-center justify-between gap-2 hover:border-[#d946ef]/60 transition duration-200"
                          >
                            <div 
                              onClick={() => setSelectedProduct(link)}
                              className="min-w-0 flex items-center gap-2 cursor-pointer hover:opacity-95 flex-1"
                              title={isAr ? 'اضغط لعرض تفاصيل هذا المنتج 🔍' : 'Click to view details of this product 🔍'}
                            >
                              <img src={link.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#8b5cf6]/15" />
                              <div className="min-w-0">
                                <h4 className="text-[9.5px] font-extrabold text-white hover:text-[#d946ef] transition truncate leading-tight">{isAr ? link.title : (link.titleEn || link.title)}</h4>
                                <p className="text-[9px] text-[#5df6be] font-mono font-bold leading-none mt-0.5">{link.price} BHD</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToCartWithAnimation(link)}
                              className="p-1 px-1.5 rounded-md bg-[#8b5cf6] text-white hover:bg-[#d946ef] text-[8px] sm:text-[9px] font-black cursor-pointer shrink-0"
                            >
                              + {isAr ? 'أضف' : 'Add'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Prominent warning notice banner requested by user */}
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-[#d946ef]/15 via-[#8b5cf6]/15 to-[#0b0424] border border-[#d946ef]/30 text-center shadow-[0_0_12px_rgba(217,70,239,0.15)] animate-pulse">
                        <p className="text-[10px] sm:text-[11px] font-black text-amber-300 leading-normal">
                          {isAr 
                            ? '💡 أضف منتجات من نفس المستودع لتحصل عليها في شحنة واحدة وتوفر رسوم التوصيل الإضافية!'
                            : '💡 Add products from the same warehouse to get them in one shipment and save on extra delivery fees!'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-zinc-500">
                      {isAr ? 'باقي السلع المربوطة بمستودع التجميع تم بيعها بالكامل.' : 'All other linked product group stocks sold out details.'}
                    </p>
                  )}
                </div>
              )}

              {/* Action pricing strip */}
              {!selectedProduct.deliveryGroupId && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-black text-[11px]">
                    <span>🚚</span>
                    <span>{isAr ? 'توصيل منفرد مستقر للسلعة:' : 'Independent Solo Shipping:'}</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-300 leading-normal">
                    {isAr
                      ? `سعر توصيل هذه السلعة بشكل مستقل ومنفرد هو ${deliveryFee.toFixed(3)} د.ب للطلب بالكامل، لأنها تُشحن من مستودع خاص ولا يمكن دمجها مع مواقع أخرى.`
                      : `This item is shipped solo at ${deliveryFee.toFixed(3)} BHD per order due to being sourced from a separate supplier warehouse.`}
                  </p>
                </div>
              )}

              <div className="border-t border-[#8b5cf6]/20 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block">{isAr ? 'السعر الفردي:' : 'Individual Price:'}</span>
                  <span className="font-mono text-sm sm:text-base font-black text-[#5df6be]">{selectedProduct.price.toFixed(3)} BHD</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCartWithAnimation(selectedProduct)}
                    className="bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] hover:from-[#d946ef] hover:to-[#8b5cf6] text-white font-black py-2.5 px-6 rounded-xl text-xs sm:text-sm cursor-pointer shadow-md"
                  >
                    {isAddedTip === selectedProduct.id ? (isAr ? 'مضاف في السلة ✓' : 'Added to Cart ✓') : (isAr ? 'إضافة إلى سلّة الطلب' : 'Add to Shopping Cart')}
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="bg-[#1b124a] text-zinc-300 px-4 rounded-xl text-xs hover:text-white"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Embedded Video Player Modal */}
      {activeVideoUrl && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4 text-right"
          onClick={() => setActiveVideoUrl(null)}
        >
          <div 
            className="bg-[#12092e] border border-[#8b5cf6]/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#160e3d] p-4 border-b border-[#cbd5e1]/10 flex justify-between items-center">
              <h3 className="font-black text-xs sm:text-sm text-[#e879f9]">📹 {isAr ? 'معاينة فيديو السلعة التفصيلي' : 'Watch Product Preview Video'}</h3>
              <button 
                onClick={() => setActiveVideoUrl(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-[#8b5cf6]/20">
                {activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be') ? (
                  <iframe
                    src={(() => {
                      let id = '';
                      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                      const match = activeVideoUrl.match(regExp);
                      if (match && match[2].length === 11) {
                        id = match[2];
                      } else {
                        if (activeVideoUrl.includes('shorts/')) {
                          id = activeVideoUrl.split('shorts/')[1].split('?')[0].substr(0,11);
                        }
                      }
                      return `https://www.youtube.com/embed/${id}?autoplay=1`;
                    })()}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video src={activeVideoUrl} controls autoPlay className="w-full h-full object-contain"></video>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono text-center break-all">{activeVideoUrl}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
