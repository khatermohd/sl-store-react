export interface User {
  name: string;
  phone: string;
  email?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
}

export interface AdminAccount {
  email: string;
  name: string;
  password?: string;
}

export interface Product {
  id: string;
  code?: string; // Product code e.g. "01", "02", "03" starting with 01
  title: string;
  titleEn?: string;
  price: number;
  description: string;
  descriptionEn?: string;
  image?: string;
  category: string;
  videoUrl?: string;
  deliveryGroupId?: string; // Links products together for consolidated shipping (same group = 3 BHD once)
  merchantPhone?: string; // Uniquely stores the private supplier/merchant phone number for internal routing
  secretAddress?: string; // Secret internal warehouse address/info that only shows in the admin's invoice
  discount?: string; // Optional discount percentage e.g. "15%" or "20%"
  createdAt: string;
}

export interface PartnerCoupon {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  code: string;
  category: string;
  discount: string;
  logoUrl?: string;
}

export interface SocialLinks {
  whatsapp: string;
  instagram: string;
  twitter: string;
  snapchat: string;
  telephone: string;
  locationAddress: string;
  pickupInstructionsAr: string;
  pickupInstructionsEn: string;
}

export interface AdBanner {
  isActive: boolean;
  adType: 'personal' | 'adsense';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  linkUrl: string;
  imageUrl: string;
  adsenseClient: string;
  adsenseSlot: string;
  showOverlayText?: boolean;
}

export interface StoreSettings {
  storeName: string;
  storeLogoUrl?: string;
  accentColor: string;
  primaryBgColor: string;
  socials: SocialLinks;
  topAd: AdBanner;
  deliveryFee: number;
  googleSpreadsheetId?: string;
  googleSpreadsheetUrl?: string;
  googleFormId?: string;
  googleFormUrl?: string;
  telegramUsername?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  useCustomTelegramBot?: boolean;
  enableTelegramSync?: boolean;
  enableSheetsSync?: boolean;
}

export interface OrderItem {
  productId: string;
  titleAr: string;
  titleEn: string;
  price: number;
  quantity: number;
  merchantPhone?: string;
  secretAddress?: string;
}

export interface Order {
  id: string; // e.g. "L&S-4"
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMethod: 'delivery' | 'pickup';
  items: OrderItem[];
  itemsTotal: number;
  shippingFee: number;
  grandTotal: number;
  status: 'pending' | 'preparing' | 'dispatched' | 'delivered'; // "قيد الانتظار" | "قيد التحضير" | "جاري التوصيل" | "تم التسليم"
  createdAt: string;
}

