import { Product, PartnerCoupon, StoreSettings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // Categorie: cars (السيارات)
  {
    id: 'prod-cars-1',
    title: 'معطر السيارة الذكي S&L LED بمستشعر اهتزاز وهيدروجين فخم',
    titleEn: 'S&L Intelligent LED Hydrogen Car Freshener',
    price: 8.5,
    description: 'معطر سيارة دائم وتلقائي يثبت بفتحات التكييف، يتميز بمستشعرات اهتزاز ذكية للضخ عند الحركة وألوان ليد تفاعلية مذهلة.',
    descriptionEn: 'Premium car freshener with smart motion vibration sensors, auto-spraying when driving, with interactive multi-colors RGB LED line.',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400',
    category: 'cars',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cars-2',
    title: 'منظم مقاعد السيارة الخلفية الملكي المقاوم للمياه والأتربة',
    titleEn: 'Waterproof Royal Leather Backseat Organizer',
    price: 6.9,
    description: 'منظم جلدي مدمج متعدد الاستخدامات لحقن وتنظيم الأيقونات والأوراق والأجهزة اللوحية والمشروبات بمملكة البحرين.',
    descriptionEn: 'Premium leather backseat organizer supporting tablet mounts, cold drinks, cellphones, and document sheets.',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=400',
    category: 'cars',
    deliveryGroupId: 'location-manama',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cars-3',
    title: 'مظلة الزجاج الأمامي التلسكوبية العازلة لأشعة الشمس الحارقة',
    titleEn: 'Retractable Windshield Protection Sunshade',
    price: 4.8,
    description: 'تلسكوبية مضادة للأشعة فوق البنفسجية بنسبة 99٪، ممتازة لحماية أثاث السيارة ومقودها داخل الأجواء البحرينية الحارة.',
    descriptionEn: 'Easy retractable car sunshade protecting interior steering tools from the intense heat UV rays.',
    image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=400',
    category: 'cars',
    deliveryGroupId: 'location-manama',
    createdAt: new Date().toISOString()
  },

  // Categorie: home (المنزل)
  {
    id: 'prod-home-1',
    title: 'مبخرة نحاسية كلاسيكية فخمة بتطريزات بحرينية يدوية',
    titleEn: 'Luxury Classic Brass Incense Burner',
    price: 15.0,
    description: 'مبخرة نحاسية أثرية مصممة ومطرزة بزخارف دلمونية بحرينية يدوية متينة وآمنة تدوم مدى الحياة.',
    descriptionEn: 'Brass incense burner beautifully crafted with Dilmun-inspired ornaments, handmade strictly to last.',
    image: 'https://images.unsplash.com/photo-1602710839300-3059154884f1?auto=format&fit=crop&q=80&w=400',
    category: 'home',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-home-2',
    title: 'مرطب الجو الفاخر بلهب افتراضي ثلاثي الأبعاد وعلاج عطري',
    titleEn: 'Cozy virtual 3D Flame Mist Humidifier',
    price: 11.5,
    description: 'يعمل بالموجات فوق الصوتية لبخ رذاذ الزيوت العطرية، مع ألوان إضاءة تصنع لهب ناري مهدئ للأعصاب وخاطف للأبصار.',
    descriptionEn: 'Ultrasonic humidification companion simulating realistic warm burning flames with custom essential oils support.',
    image: 'https://images.unsplash.com/photo-1519183071298-a2962feb14f4?auto=format&fit=crop&q=80&w=400',
    category: 'home',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-home-3',
    title: 'صانع القهوة الإسبريسو واللاتيه المنزلي الاحترافي بضغط 15 بار',
    titleEn: 'S&L 15-Bar Professional Home Espresso Maker',
    price: 24.9,
    description: 'ماكينة إعداد القهوة السريعة بأكواب اللاتيه الرائعة مع أداة تكثيف الرغوة وحليب كريمي فائق التجانس.',
    descriptionEn: 'Premium 15-bar Italian pump espresso machine with integrated steam wand for dense dairy froths.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
    category: 'home',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },

  // Categorie: electronics (إلكترونيات)
  {
    id: 'prod-elec-1',
    title: 'سماعة الذهب اللاسلكية S&L ANC بعزل كامل للضوضاء الهدامة',
    titleEn: 'S&L ANC Gold Luxury Wireless Headphones',
    price: 21.0,
    description: 'استمع لأدق تفاصيل الموسيقى والألعاب مع تقنية حجب الضجيج الخارجي الفائقة وبطارية عملاقة تدوم 40 ساعة متواصلة.',
    descriptionEn: 'High Fidelity active noise cancelling wireless over-ear headphone with 40-hour deep battery cycle.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    category: 'electronics',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-elec-2',
    title: 'لوحة مفاتيح الألعاب الميكانيكية المضيئة RGB المقاومة للماء والأتربة',
    titleEn: 'S&L Compact Spill-Proof Mechanical RGB Keyboard',
    price: 14.5,
    description: 'أزرار استجابة فائقة السرعة مع تأثيرات إضاءة خلابة قابلة للتعديل وهيكل ألومنيوم فائق القوة والمقاومة للصدمات.',
    descriptionEn: 'High responsive tactile custom mechanical keyboard supporting extensive RGB setups and fluid resistance.',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400',
    category: 'electronics',
    deliveryGroupId: 'location-manama',
    createdAt: new Date().toISOString()
  },

  // Categorie: perfumes (العطور والبخور)
  {
    id: 'prod-perfumes-1',
    title: 'عطر مسك النخبة الأصلي بنفحات الياسمين والبارود الأبيض والعود لمتجر S&L',
    titleEn: 'Elite White Musk & Oud Classic Perfume',
    price: 19.9,
    description: 'ثبات فائق ورائحة ملكية تسحر القلوب وتجذب النفوس، العطر المثالي للمناسبات الفاخرة والاستخدام اليومي الفخم.',
    descriptionEn: 'An elite long-lasting traditional royal oud & musk fragrance designed for prestigious ceremonies.',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=400',
    category: 'perfumes',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-perfumes-2',
    title: 'رقاقات عود مروكي طبيعي فخم ومحسن للمناسبات الكبرى والأفراح',
    titleEn: 'Premium Maroki Natural Oud Wood Incense Pieces',
    price: 16.0,
    description: 'رائحة العود الفخم الترابية والدافئة الهادئة المناسبة لتبخير المنازل، الدواوين، والمساجد برائحة زكية مهدئة للأعصاب.',
    descriptionEn: 'Top selection Maroki natural oud incense chips offering dense aromatic smoke with highly calming wood smells.',
    image: 'https://images.unsplash.com/photo-1602710839300-3059154884f1?auto=format&fit=crop&q=80&w=400',
    category: 'perfumes',
    deliveryGroupId: 'location-riffa',
    createdAt: new Date().toISOString()
  },

  // Categorie: children (أطفال)
  {
    id: 'prod-kids-1',
    title: 'طائرة درون تصوير ذكية للأطفال والكبار بمستشعر حماية ضد الاصطدام والكسر',
    titleEn: 'Smart Collision-Protected Video Toy Drone',
    price: 18.2,
    description: 'سهلة التحكم والتحليق بمستشعرات مسافة ذكية تمنع اصطدامها بالجدران مع كاميرا بث حي مدمجة للهواتف.',
    descriptionEn: 'Fun easy-to-fly infrared guarded toy drone with automated obstacle avoids and live phone camera view feeds.',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=400',
    category: 'children',
    deliveryGroupId: 'location-muharraq',
    createdAt: new Date().toISOString()
  },

  // Categorie: games (العاب)
  {
    id: 'prod-games-1',
    title: 'جهاز ألعاب محمول كلاسيكي يحوي 10,000 لعبة زمن الطيبين بدقة HD عالية',
    titleEn: 'Retro Arcade Handheld Hub - 10k Retro Games HD',
    price: 12.9,
    description: 'استمتع بأقوى ذكريات الطفولة مع جهاز يدعم ألعاب سيجا، كمبيوتر العائلة، والسوبر نينتندو بشاشة ألوان مذهلة.',
    descriptionEn: 'Portable gaming device preloaded with thousands of retro console games supporting dynamic HD display outputs.',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=400',
    category: 'games',
    deliveryGroupId: 'location-muharraq',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-games-2',
    title: 'مسند وذراع تحكم ألعاب ذكي مضيء بليد RGB ملون مع منصة تبريد لاسلكية ليد',
    titleEn: 'Glowing RGB Controller Stand with Fast Wireless Charger',
    price: 9.8,
    description: 'منظم وتجهيز فاخر لذراع التحكم يحوي شاحن لاسلكي Qi سريع ويدعم إضاءات تفاعلية ووصلات USB إضافية.',
    descriptionEn: 'Aesthetic controller and headset hanger featuring RGB breathing lights plus integrated express smartphone wireless dock.',
    image: 'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&q=80&w=400',
    category: 'games',
    deliveryGroupId: 'location-manama',
    createdAt: new Date().toISOString()
  },

  // Categorie: rent (إيجار)
  {
    id: 'prod-rent-1',
    title: 'إيجار شاليه بحري خاص بمدينة الحد مع حمام سباحة داخلي وألعاب مائية عائلية للطلب',
    titleEn: 'Private Hidd Beachfront Chalet with Pool (Daily Rental)',
    price: 65.0,
    description: 'إيجار يومي فاخر لشاليه مجهز بالكامل يطل في بحر الحد بمملكة البحرين، يضم مجلسين واسعين ومطبخ عصري وألعاب للأطفال دافئة.',
    descriptionEn: 'Fabulous beachfront chalet located in Hidd with fully sanitary private pool and kids interactive plays bounds.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400',
    category: 'rent',
    deliveryGroupId: 'location-hidd',
    createdAt: new Date().toISOString()
  },

  // Categorie: clothes (الملابس)
  {
    id: 'prod-clothes-1',
    title: 'ثوب بحريني فاخر مطرز بخيوط ذهبية خفيفة للصيف والأعياد والمجالس',
    titleEn: 'Traditional Premium Embroidered Bahraini Thobe',
    price: 18.0,
    description: 'نسيج قطني ياباني فاخر وبارد، مريح للغاية ومقاوم للتجعد ومخيط بأيدي أمهر الخياطين المحليين بالمنامة.',
    descriptionEn: 'Luxurious light Japanese cotton thobe customized with subtle gold embroidery lines, anti-crease high stitch.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    category: 'clothes',
    deliveryGroupId: 'location-manama',
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
  storeName: 'S&L PREMIUM STORE',
  accentColor: '#8b5cf6',
  primaryBgColor: '#0b0424',
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
  deliveryFee: 3,
  googleSpreadsheetId: "",
  googleSpreadsheetUrl: "",
  googleFormId: "",
  googleFormUrl: "",
  telegramUsername: "@ShopSLbh",
  enableTelegramSync: true,
  enableSheetsSync: true
};
