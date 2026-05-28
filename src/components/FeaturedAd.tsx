import { AdBanner } from '../types';
import { Sparkles, Phone, MessageSquare, ExternalLink, X, Clock } from 'lucide-react';
import { useState } from 'react';

interface FeaturedAdProps {
  ad: AdBanner;
  lang: 'ar' | 'en';
}

export default function FeaturedAd({ ad, lang }: FeaturedAdProps) {
  const [showModal, setShowModal] = useState(false);

  if (!ad.isActive) return null;

  const isAr = lang === 'ar';

  if (ad.adType === 'adsense') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        <div className="relative bg-[#160e3d]/90 border border-[#8b5cf6]/40 p-3 rounded-2xl overflow-hidden shadow-lg min-h-[90px] flex flex-col justify-center items-center text-center">
          {/* AdSense Live Layout Injected */}
          <div className="absolute inset-0 w-full h-full opacity-90 z-10 flex items-center justify-center">
            <ins className="adsbygoogle"
                 style={{ display: 'block', height: '90px', width: '100%', minHeight: '90px' }}
                 data-ad-client={ad.adsenseClient || 'ca-pub-1208489237840199'}
                 data-ad-slot={ad.adsenseSlot || '8033541109'}
                 data-ad-format="horizontal"
                 data-full-width-responsive="true"></ins>
          </div>

          {/* Underlay Placeholder */}
          <div className="relative z-0 pointer-events-none text-neutral-400 space-y-0.5 select-none font-medium">
            <span className="inline-flex items-center gap-1 bg-[#8b5cf6]/20 text-[#a78bfa] text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse">
              <Sparkles size={8} />
              <span>{isAr ? 'إعلان ممول بواسطة Google AdSense' : 'Sponsored by Google AdSense'} ⚡</span>
            </span>
            <p className="text-[10px] text-zinc-500">
              {isAr ? 'يتم تغذية الإعلانات بناءً على اهتماماتك' : 'Ads served based on relevant topics'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Personal Custom Ad Mode
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
      <div className="relative bg-gradient-to-r from-[#1b124a] via-[#12092e] to-[#0d0526] border border-[#8b5cf6]/30 text-white p-3 sm:p-4 rounded-2xl overflow-hidden shadow-xl hover:shadow-[#8b5cf6]/5 transition-all duration-300" dir={isAr ? 'rtl' : 'ltr'}>
        
        {/* Glow dots decoration */}
        <div className="absolute left-10 top-0 bottom-0 w-32 bg-radial from-[#bfdbfe]/5 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 bottom-0 top-0 w-32 bg-radial from-[#e879f9]/5 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {ad.imageUrl && (
              <div 
                className="w-full sm:w-28 h-20 shrink-0 rounded-xl overflow-hidden border border-[#8b5cf6]/35 cursor-pointer hover:scale-102 hover:border-[#d946ef]/50 transition-all duration-300"
                onClick={() => setShowModal(true)}
              >
                <img 
                  src={ad.imageUrl} 
                  alt="Ad Preview" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className={`space-y-1 flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
              <div className="flex flex-wrap items-center gap-1.5 justify-start">
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] text-white text-[9px] px-2.5 py-0.5 rounded-md font-bold uppercase animate-bounce">
                  <Sparkles size={8} />
                  <span>{isAr ? 'إعلان ترويجي مميز 🏆' : 'Special Feature Ad 🏆'}</span>
                </span>
              </div>
              
              <h2 className="text-xs sm:text-sm font-black tracking-tight mt-1 text-white leading-tight">
                {isAr ? ad.titleAr : ad.titleEn}
              </h2>
              <p className="text-neutral-300 text-[10px] sm:text-xs max-w-2xl leading-relaxed">
                {isAr ? ad.descriptionAr : ad.descriptionEn}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="self-start md:self-center shrink-0 bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] hover:from-[#d946ef] hover:to-[#8b5cf6] text-white font-bold text-[10px] sm:text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all duration-200 transform active:scale-95 cursor-pointer"
          >
            <span>{isAr ? 'تفاصيل الإعلان 🌐' : 'Ad Details 🌐'}</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* Ad Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-[#12092e] border border-[#8b5cf6]/40 text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header image slider/cover if any, else visual gradient */}
            <div className="h-44 bg-gradient-to-br from-[#1b124a] to-[#0d0526] relative flex items-center justify-center overflow-hidden border-b border-[#8b5cf6]/30">
              {ad.imageUrl ? (
                <img 
                  src={ad.imageUrl} 
                  alt="Ad Cover" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[#a78bfa] text-center space-y-1">
                  <div className="text-4xl">📢</div>
                  <div className="text-xs font-bold">S&L Ad Space</div>
                </div>
              )}
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className={`p-5 space-y-4 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-[#d946ef] bg-[#d946ef]/10 px-2.5 py-1 rounded-full border border-[#d946ef]/30 inline-block mb-2">
                  {isAr ? 'عروض الشركاء والعملاء' : 'Clients & Partners Offers'}
                </span>
                <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                  {isAr ? ad.titleAr : ad.titleEn}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {isAr ? ad.descriptionAr : ad.descriptionEn}
                </p>
              </div>

              {/* Direct call-to-action buttons */}
              {ad.linkUrl && (
                <div className="pt-2">
                  <a
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] hover:from-[#d945ee] text-white text-center font-bold py-3 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>{isAr ? 'تواصل للاستفادة من الإعلان 💬' : 'Contact for Promo Benefit 💬'}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
