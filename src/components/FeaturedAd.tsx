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
        <div className="relative bg-white border border-slate-200 p-3 rounded-2xl overflow-hidden shadow-xs min-h-[90px] flex flex-col justify-center items-center text-center">
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
          <div className="relative z-0 pointer-events-none text-slate-400 space-y-0.5 select-none font-medium">
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse">
              <Sparkles size={8} />
              <span>{isAr ? 'إعلان ممول بواسطة Google AdSense' : 'Sponsored by Google AdSense'} ⚡</span>
            </span>
            <p className="text-[10px] text-slate-500">
              {isAr ? 'يتم تغذية الإعلانات بناءً على اهتماماتك' : 'Ads served based on relevant topics'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Personal Custom Ad Mode
  const isVideo = ad.imageUrl && (
    ad.imageUrl.toLowerCase().endsWith('.mp4') || 
    ad.imageUrl.toLowerCase().endsWith('.webm') || 
    ad.imageUrl.toLowerCase().endsWith('.mov') ||
    ad.imageUrl.toLowerCase().includes('/video/') ||
    ad.imageUrl.toLowerCase().includes('stream') ||
    ad.imageUrl.toLowerCase().startsWith('data:video/')
  );

  const adContent = (
    <div className="relative w-full overflow-hidden border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 bg-slate-950 h-[155px] sm:h-[240px] md:h-[300px] flex items-center justify-center">
      {/* Premium blurred backdrop for cinematic cohesion and edge-filling */}
      {ad.imageUrl && !isVideo && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-35 scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${ad.imageUrl})` }}
        />
      )}
      
      {isVideo ? (
        <video 
          key={ad.imageUrl}
          src={ad.imageUrl} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="relative z-10 w-full h-full object-contain block"
        />
      ) : ad.imageUrl ? (
        <img 
          src={ad.imageUrl} 
          alt={isAr ? ad.titleAr : ad.titleEn} 
          referrerPolicy="no-referrer"
          className="relative z-10 w-full h-full object-contain block"
        />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <span className="text-slate-400 text-xs font-bold">
            {isAr ? 'مساحة إعلانية' : 'AD SPACE'}
          </span>
        </div>
      )}

      {/* Styled written text promo in front of the ad, absolute at the bottom, bg-transparent so it never obscures the video/image */}
      {ad.showOverlayText !== false && (ad.titleAr || ad.titleEn || ad.descriptionAr || ad.descriptionEn) && (
        <div className="absolute bottom-1 inset-x-0 bg-transparent px-4 py-2 text-white flex flex-col justify-end transition-all z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="inline-flex items-center justify-center bg-[#da291c] text-white text-[9.5px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
              ⚡ {isAr ? 'عرض مميز' : 'SPECIAL PROMO'}
            </span>
            {(isAr ? ad.titleAr : ad.titleEn) && (
              <h4 className="text-xs sm:text-sm font-black text-white hover:scale-[1.01] transition-transform" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.95), -1px -1px 3px rgba(0,0,0,0.95), 1px -1px 3px rgba(0,0,0,0.95), -1px 1px 3px rgba(0,0,0,0.95)" }}>
                {isAr ? ad.titleAr : ad.titleEn}
              </h4>
            )}
          </div>
          {(isAr ? ad.descriptionAr : ad.descriptionEn) && (
            <p className="text-[10px] sm:text-[11px] text-slate-100 leading-relaxed font-bold tracking-wide" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.95), -1px -1px 3px rgba(0,0,0,0.95), 1px -1px 3px rgba(0,0,0,0.95), -1px 1px 3px rgba(0,0,0,0.95)" }}>
              {isAr ? ad.descriptionAr : ad.descriptionEn}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (ad.linkUrl) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        <a 
          href={ad.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full cursor-pointer hover:scale-[1.005] duration-200"
        >
          {adContent}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
      {adContent}
    </div>
  );
}
