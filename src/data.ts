import { Product, PartnerCoupon, StoreSettings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // Group A - Manama Warehouse (Linked)
  {
    id: 'prod-1',
    title: 'جاكيت شتوي أنيق رمادي',
    titleEn: 'Elegant Grey Winter Jacket',
    price: 18,
    description: 'جاكيت عالي الجودة ومقاوم للحرارة والرياح، مريح جداً ولائق بجميع المناسبات.',
    descriptionEn: 'Premium high-quality windproof winter jacket, very comfortable and elegant for all occasions.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    category: 'clothes',
    deliveryGroupId: 'location-manama',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    title: 'حذاء رياضي مريح أسود',
    titleEn: 'Comfortable Black Running Shoe',
    price: 12,
    description: 'حذاء رياضي مدعم بوسادة مريحة، ممتاز للمشي الرياضي والركض الطويل.',
    descriptionEn: 'Ergonomic athletic shoe with soft cushioning, excellent for walking and long runs.',
    image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=400',
    category: 'clothes',
    deliveryGroupId: 'location-manama',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    title: 'قبعة صوفية كلاسيكية كحلي',
    titleEn: 'Classic Beanie Navy Blue',
    price: 3.5,
    description: 'قبعة صوفية توفر عزلاً حرارياً ممتازاً ومظهراً مميزاً خلال الأيام الباردة.',
    descriptionEn: 'Classic knit beanie providing great insulation and style during cold weather.',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?auto=format&fit=crop&q=80&w=400',
    category: 'clothes',
    deliveryGroupId: 'location-manama',
    createdAt: new Date().toISOString()
  },

  // Group B - Riffa Perfume Lab (Linked)
  {
    id: 'prod-4',
    title: 'دهن العود الملكي معتق',
    titleEn: 'Royal Aged Oud Oil',
    price: 45,
    description: 'دهن عود أصلي معتق ذو رائحة ترابية دافئة تدوم لأيام، خيار الشخصيات الراقية.',
    descriptionEn: 'Original aged oud oil with warm earthy scent that lasts for days, favorite for elite minds.',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=400',
    category: 'perfumes',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    title: 'مبخرة نحاسية كلاسيكية فخمة',
    titleEn: 'Luxury Classic Brass Incense Burner',
    price: 15,
    description: 'مبخرة نحاسية مصممة ومطرزة بزخارف دلمونية بحرينية يدوية تدوم مدى الحياة.',
    descriptionEn: 'Brass incense burner beautifully crafted with Dilmun-inspired ornaments, handmade to last.',
    image: 'https://images.unsplash.com/photo-1602710839300-3059154884f1?auto=format&fit=crop&q=80&w=400',
    category: 'perfumes',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },

  // Unlinked items (Unique shipping location)
  {
    id: 'prod-6',
    title: 'ساعة رولكس صبمارينر إطار سراميك',
    titleEn: 'Rolex Submariner Ceramic Bezel',
    price: 5200,
    description: 'ساعة رولكس أصلية بحالة الوكالة مع الصندوق والشهادة الأصلية، كنز جامع للساعات.',
    descriptionEn: 'Original Rolex timepiece in pristine condition with original box and papers, collector’s gem.',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400',
    category: 'watches',
    videoUrl: 'https://www.youtube.com/watch?v=kR60g3X6E84',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-7',
    title: 'آيفون 15 برو ماكس تيتانيوم - 250 جيجا',
    titleEn: 'iPhone 15 Pro Max Titanium - 256GB',
    price: 360,
    description: 'جهاز في حالة ممتازة جداً، بطارية 95٪، مستخدم بصورة طفيفة مع الضمان.',
    descriptionEn: 'Device in excellent condition, 95% battery health, slightly used with Bahrain agency warranty.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400',
    category: 'electronics',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_COUPONS: PartnerCoupon[] = [
  {
    id: 'coup-1',
    titleAr: 'خصم 30٪ لدى مطعم البندر للمأكولات البحرية',
    titleEn: '30% Discount at Al-Bandar Seafood',
    descriptionAr: 'كود خصم حصري لمشتركي متجرنا على كافة أطباق الأسماك والربيان الطازجة بفروع مملكة البحرين.',
    descriptionEn: 'Exclusive discount code for our store visitors on all fresh fish dishes in Bahrain branches.',
    code: 'BANDAR30',
    category: 'food',
    discount: '30%'
  },
  {
    id: 'coup-2',
    titleAr: 'خصم 15٪ لدى عيادة جناحي الطبية للأسنان',
    titleEn: '15% Off at Janyahi Dental Clinic',
    descriptionAr: 'استفد من كود الخصم في مركز المنامة للعلاج التجميلي والوقائي للأسنان وتبييض القنوات بامتياز.',
    descriptionEn: 'Claim this discount at Manama branch for cosmetic and preventive dental fillings and whitening.',
    code: 'JANAHI15',
    category: 'health',
    discount: '15%'
  },
  {
    id: 'coup-3',
    titleAr: 'توصيل مجاني لطلبك من كافيه دلمون بالرفاع',
    titleEn: 'Free Delivery on Delmon Cafe Riffa',
    descriptionAr: 'احصل على توصيل منزلي مجاني لجميع طلبات القهوة المختصة والحلويات البحرينية الأصيلة.',
    descriptionEn: 'Get free home delivery for all specialized coffee orders & authentic Bahraini sweets.',
    code: 'DELMONFREE',
    category: 'food',
    discount: 'د.ب 0 التوصيل'
  }
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'S&L',
  accentColor: '#8b5cf6', // Indigo Violet resembling image
  primaryBgColor: '#0b0424', // Ultra rich deep violet dark mode 
  socials: {
    whatsapp: '37120456',
    instagram: 'SL.Store.BH',
    twitter: 'SL_Store_BH',
    snapchat: 'SL.snap',
    telephone: '17442011',
    locationAddress: 'ضواحي مدينة الرفاع، مجمع 905، مملكة البحرين',
    pickupInstructionsAr: 'موقع المحل: الرفاع الغربي بالقرب من جامع الدوسري. ساعات الاستلام من 4:00 عصراً وحتى 10:00 مساءً.',
    pickupInstructionsEn: 'Shop location: West Riffa near Al-Dossary Mosque. Pickup times: 4:00 PM to 10:00 PM.'
  },
  topAd: {
    isActive: true,
    adType: 'personal',
    titleAr: '🎉 عروض مهرجان الصيف الكبرى في متجر S&L البحريني!',
    titleEn: '🎉 S&L Bahrain Grand Summer Festival Offers!',
    descriptionAr: 'خصومات حصرية تبدأ من 15٪ وتصل إلى 50٪ على العطور الفاخرة والملابس المختارة. فرع الرفاع مفتوح الآن!',
    descriptionEn: 'Exclusive discounts starting from 15% up to 50% on luxury perfumes and selected clothes. West Riffa branch open now!',
    linkUrl: 'https://wa.me/97337120456',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200',
    adsenseClient: 'ca-pub-1208489237840199',
    adsenseSlot: '8033541109'
  },
  deliveryFee: 3
};
