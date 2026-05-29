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
  const isVideo = ad.imageUrl && (
    ad.imageUrl.toLowerCase().endsWith('.mp4') || 
    ad.imageUrl.toLowerCase().endsWith('.webm') || 
    ad.imageUrl.toLowerCase().endsWith('.mov') ||
    ad.imageUrl.toLowerCase().includes('/video/') ||
    ad.imageUrl.toLowerCase().includes('stream') ||
    ad.imageUrl.toLowerCase().startsWith('data:video/')
  );

  const adContent = (
    <div className="relative w-full overflow-hidden border border-[#8b5cf6]/35 rounded-2xl shadow-xl hover:shadow-[#d946ef]/10 hover:border-[#d946ef]/45 transition-all duration-300 bg-[#12092e]">
      {isVideo ? (
        <video 
          key={ad.imageUrl}
          src={ad.imageUrl} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-auto aspect-[16/6] md:aspect-[21/6] object-cover block"
        />
      ) : ad.imageUrl ? (
        <img 
          src={ad.imageUrl} 
          alt={isAr ? ad.titleAr : ad.titleEn} 
          referrerPolicy="no-referrer"
          className="w-full h-auto aspect-[16/6] md:aspect-[21/6] object-cover block"
        />
      ) : (
        <div className="w-full aspect-[16/6] md:aspect-[21/6] bg-gradient-to-r from-[#1b124a] to-[#0d0526] flex items-center justify-center">
          <span className="text-[#a78bfa] text-xs font-bold">
            {isAr ? 'مساحة إعلانية' : 'AD SPACE'}
          </span>
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
