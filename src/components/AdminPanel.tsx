import React, { useState, useEffect } from 'react';
import { User, Product, PartnerCoupon, StoreSettings, AdminAccount } from '../types';
import { Wrench, Plus, Trash2, Edit2, ShieldAlert, Sparkles, Save, Mail, Key, Phone, Globe, Image, Film, UserPlus, Users } from 'lucide-react';

interface AdminPanelProps {
  user: User | null;
  storeSettings: StoreSettings;
  onSaveStoreSettings: (settings: StoreSettings) => void;
  products: Product[];
  onSaveProductsList: (updated: Product[]) => void;
  coupons: PartnerCoupon[];
  onSaveCouponsList: (updated: PartnerCoupon[]) => void;
  lang: 'ar' | 'en';
}

export default function AdminPanel({
  user,
  storeSettings,
  onSaveStoreSettings,
  products,
  onSaveProductsList,
  coupons,
  onSaveCouponsList,
  lang
}: AdminPanelProps) {
  const isAr = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'products' | 'coupons' | 'moderators'>('settings');

  // Multi-moderator states
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => {
    const saved = localStorage.getItem('sl_admin_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    const defaultMasterEmail = (import.meta as any).env.VITE_ADMIN_EMAIL || '';
    const masterName = defaultMasterEmail ? defaultMasterEmail.split('@')[0] : 'admin';
    return [
      { email: defaultMasterEmail, name: `المشرف الرئيسي ${masterName}` }
    ];
  });

  // Moderator inputs
  const [newModEmail, setNewModEmail] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newModPassword, setNewModPassword] = useState('');

  // 1. Store settings state
  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [storeLogo, setStoreLogo] = useState(storeSettings.storeLogoUrl || '');
  const [wpNum, setWpNum] = useState(storeSettings.socials.whatsapp);
  const [insta, setInsta] = useState(storeSettings.socials.instagram);
  const [twit, setTwit] = useState(storeSettings.socials.twitter);
  const [snap, setSnap] = useState(storeSettings.socials.snapchat);
  const [tel, setTel] = useState(storeSettings.socials.telephone);
  const [adr, setAdr] = useState(storeSettings.socials.locationAddress);
  const [pickupAr, setPickupAr] = useState(storeSettings.socials.pickupInstructionsAr);
  const [pickupEn, setPickupEn] = useState(storeSettings.socials.pickupInstructionsEn);
  
  // Ad top settings
  const [adActive, setAdActive] = useState(storeSettings.topAd.isActive);
  const [adType, setAdType] = useState(storeSettings.topAd.adType);
  const [adTitleAr, setAdTitleAr] = useState(storeSettings.topAd.titleAr);
  const [adTitleEn, setAdTitleEn] = useState(storeSettings.topAd.titleEn);
  const [adDescAr, setAdDescAr] = useState(storeSettings.topAd.descriptionAr);
  const [adDescEn, setAdDescEn] = useState(storeSettings.topAd.descriptionEn);
  const [adLink, setAdLink] = useState(storeSettings.topAd.linkUrl);
  const [adImg, setAdImg] = useState(storeSettings.topAd.imageUrl);
  const [adClient, setAdClient] = useState(storeSettings.topAd.adsenseClient);
  const [adSlot, setAdSlot] = useState(storeSettings.topAd.adsenseSlot);

  // 2. Product editing state (can use this for adding/editing a product)
  const [prodIdToEdit, setProdIdToEdit] = useState<string | null>(null);
  const [prodTitleAr, setProdTitleAr] = useState('');
  const [prodTitleEn, setProdTitleEn] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDescAr, setProdDescAr] = useState('');
  const [prodDescEn, setProdDescEn] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState('clothes');
  const [prodVideo, setProdVideo] = useState('');
  const [prodGroup, setProdGroup] = useState('');
  const [prodMerchantPhone, setProdMerchantPhone] = useState('');
  const [prodSecretAddress, setProdSecretAddress] = useState('');

  // Custom Dynamic Warehouses
  const [customWarehouses, setCustomWarehouses] = useState<{ id: string, name: string }[]>(() => {
    const saved = localStorage.getItem('sl_custom_warehouses');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [];
  });
  const [newWarehouseName, setNewWarehouseName] = useState('');

  // Dual-press confirming bypass states for iframe
  const [adminToDeleteEmail, setAdminToDeleteEmail] = useState<string | null>(null);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [couponToDeleteId, setCouponToDeleteId] = useState<string | null>(null);

  // 3. Coupon editing state
  const [coupIdToEdit, setCoupIdToEdit] = useState<string | null>(null);
  const [coupTitleAr, setCoupTitleAr] = useState('');
  const [coupTitleEn, setCoupTitleEn] = useState('');
  const [coupDescAr, setCoupDescAr] = useState('');
  const [coupDescEn, setCoupDescEn] = useState('');
  const [coupCode, setCoupCode] = useState('');
  const [coupCategory, setCoupCategory] = useState('food');
  const [coupDiscount, setCoupDiscount] = useState('');

  // Orders Administration State
  const [orders, setOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('sl_all_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [];
  });

  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);

  const getArabicMonthName = (monthIndex: number): string => {
    const monthsAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return monthsAr[monthIndex] || '';
  };

  const getEnglishMonthName = (monthIndex: number): string => {
    const monthsEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthsEn[monthIndex] || '';
  };

  const getMonthlyStats = () => {
    const statsMap: Record<string, { count: number; revenue: number; year: number; month: number }> = {};
    
    orders.forEach(ord => {
      if (!ord.createdAt) return;
      try {
        const d = new Date(ord.createdAt);
        if (isNaN(d.getTime())) return;
        
        const yr = d.getFullYear();
        const mo = d.getMonth(); // 0-11
        const key = `${yr}-${String(mo + 1).padStart(2, '0')}`;
        
        if (!statsMap[key]) {
          statsMap[key] = { count: 0, revenue: 0, year: yr, month: mo };
        }
        
        statsMap[key].count += 1;
        statsMap[key].revenue += ord.grandTotal || 0;
      } catch (_) {}
    });
    
    const sortedKeys = Object.keys(statsMap).sort((a, b) => b.localeCompare(a));
    
    return sortedKeys.map(key => {
      const entry = statsMap[key];
      const displayLabel = isAr 
        ? `${getArabicMonthName(entry.month)} ${entry.year}`
        : `${getEnglishMonthName(entry.month)} ${entry.year}`;
        
      return {
        monthKey: key,
        displayLabel,
        count: entry.count,
        totalRevenue: entry.revenue
      };
    });
  };

  // Reload orders on activeTab / open state changes from Express Server Database
  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      fetch('/api/orders')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed backend GET");
        })
        .then(data => {
          // Sort descending by creation timestamp
          const sorted = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(sorted);
          localStorage.setItem('sl_all_orders', JSON.stringify(sorted));
        })
        .catch(err => {
          console.warn("Express server offline; pulling local storage backup", err);
          const saved = localStorage.getItem('sl_all_orders');
          if (saved) {
            try { setOrders(JSON.parse(saved)); } catch (_) {}
          }
        });
    }
  }, [isOpen, activeTab]);

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    // Send state update to Express backend
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => {
      if (!res.ok) throw new Error("Server failed update status");
      return res.json();
    })
    .catch(err => {
      console.error("Failed to sync status with server database", err);
    });

    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    setOrders(updated);
    localStorage.setItem('sl_all_orders', JSON.stringify(updated));
    
    // Sync with sl_my_orders for instant local feedback if in same browser
    const existingMyOrdersRaw = localStorage.getItem('sl_my_orders');
    if (existingMyOrdersRaw) {
      try {
        const myOrders = JSON.parse(existingMyOrdersRaw);
        const updatedMy = myOrders.map((ord: any) => {
          if (ord.id === orderId) {
            return { ...ord, status: newStatus };
          }
          return ord;
        });
        localStorage.setItem('sl_my_orders', JSON.stringify(updatedMy));
      } catch (_) {}
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    // Run deletion request in server database
    fetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    }).catch(err => console.error("Could not sync deletion with server db", err));

    const updated = orders.filter(ord => ord.id !== orderId);
    setOrders(updated);
    localStorage.setItem('sl_all_orders', JSON.stringify(updated));
    setOrderToDeleteId(null);
    
    // Sync with sl_my_orders for instant local feedback if on identical browser
    const existingMyOrdersRaw = localStorage.getItem('sl_my_orders');
    if (existingMyOrdersRaw) {
      try {
        const myOrders = JSON.parse(existingMyOrdersRaw);
        const updatedMy = myOrders.filter((ord: any) => ord.id !== orderId);
        localStorage.setItem('sl_my_orders', JSON.stringify(updatedMy));
      } catch (_) {}
    }
  };

  // Save admin credentials
  const [adminEmailInput, setAdminEmailInput] = useState(() => localStorage.getItem('sl_admin_email') || (import.meta as any).env.VITE_ADMIN_EMAIL || '');
  const [adminPassInput, setAdminPassInput] = useState(() => localStorage.getItem('sl_admin_password') || (import.meta as any).env.VITE_ADMIN_PASSWORD || '');

  if (!user || !user.isAdmin) return null;

  // Persist moderators list on change
  const saveAdminAccounts = (updated: AdminAccount[]) => {
    setAdminAccounts(updated);
    localStorage.setItem('sl_admin_accounts', JSON.stringify(updated));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStoreSettings({
      storeName: storeName.trim() || 'S&L',
      storeLogoUrl: storeLogo.trim() || undefined,
      accentColor: storeSettings.accentColor,
      primaryBgColor: storeSettings.primaryBgColor,
      deliveryFee: storeSettings.deliveryFee,
      socials: {
        whatsapp: wpNum.trim(),
        instagram: insta.trim(),
        twitter: twit.trim(),
        snapchat: snap.trim(),
        telephone: tel.trim(),
        locationAddress: adr.trim(),
        pickupInstructionsAr: pickupAr.trim(),
        pickupInstructionsEn: pickupEn.trim()
      },
      topAd: {
        isActive: adActive,
        adType: adType,
        titleAr: adTitleAr.trim(),
        titleEn: adTitleEn.trim(),
        descriptionAr: adDescAr.trim(),
        descriptionEn: adDescEn.trim(),
        linkUrl: adLink.trim(),
        imageUrl: adImg.trim(),
        adsenseClient: adClient.trim(),
        adsenseSlot: adSlot.trim()
      }
    });

    // Also persist base credentials
    localStorage.setItem('sl_admin_email', adminEmailInput.trim());
    localStorage.setItem('sl_admin_password', adminPassInput.trim());

    alert(isAr ? '✅ تم حفظ إعدادات المتجر وبيانات التواصل بنجاح!' : '✅ Store Settings and credentials saved successfully!');
  };

  const handleAddModerator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModEmail.trim() || !newModPassword.trim() || !newModName.trim()) {
      alert(isAr ? 'يرجى ملى كافة حقول المشرف' : 'Please fill all moderator fields');
      return;
    }
    const exists = adminAccounts.some(acc => acc.email.toLowerCase() === newModEmail.trim().toLowerCase());
    if (exists) {
      alert(isAr ? 'هذا الإيميل مضاف مسبقاً كمشرف!' : 'Moderator email already exists!');
      return;
    }
    const updated = [...adminAccounts, {
      email: newModEmail.trim().toLowerCase(),
      name: newModName.trim(),
      password: newModPassword.trim()
    }];
    saveAdminAccounts(updated);
    setNewModEmail('');
    setNewModName('');
    setNewModPassword('');
    alert(isAr ? '👑 تم إضافة المشرف الجديد بنجاح!' : '👑 New Moderator added successfully!');
  };

  const handleRemoveModerator = (email: string) => {
    const masterEmail = localStorage.getItem('sl_admin_email') || (import.meta as any).env.VITE_ADMIN_EMAIL || '';
    if (masterEmail && email.toLowerCase() === masterEmail.toLowerCase()) {
      alert(isAr ? 'لا يمكن حذف المشرف الرئيسي العام!' : 'Cannot delete the main administrator!');
      return;
    }
    const updated = adminAccounts.filter(acc => acc.email !== email);
    saveAdminAccounts(updated);
    setAdminToDeleteEmail(null);
  };

  const handleAddWarehouse = () => {
    if (!newWarehouseName.trim()) return;
    const newId = `location-custom-${Date.now()}`;
    const updatedGroup = [...customWarehouses, { id: newId, name: newWarehouseName.trim() }];
    setCustomWarehouses(updatedGroup);
    localStorage.setItem('sl_custom_warehouses', JSON.stringify(updatedGroup));
    setProdGroup(newId);
    setNewWarehouseName('');
  };

  const handleAddOrEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitleAr.trim() || !prodPrice || !prodDescAr.trim() || !prodImage.trim()) {
      alert(isAr ? 'يرجى ملى الحقول الإلزامية مثل العنوان والسعر وصورة السلعة' : 'Please provide mandatory inputs like price, title and image.');
      return;
    }

    if (prodIdToEdit) {
      // Edit mode
      const updated = products.map(p => {
        if (p.id === prodIdToEdit) {
          return {
            ...p,
            title: prodTitleAr.trim(),
            titleEn: prodTitleEn.trim() || prodTitleAr.trim(),
            price: parseFloat(prodPrice),
            description: prodDescAr.trim(),
            descriptionEn: prodDescEn.trim() || prodDescAr.trim(),
            image: prodImage.trim(),
            category: prodCategory,
            videoUrl: prodVideo.trim() || undefined,
            deliveryGroupId: prodGroup.trim() || undefined,
            merchantPhone: prodMerchantPhone.trim() || undefined,
            secretAddress: prodSecretAddress.trim() || undefined
          };
        }
        return p;
      });
      onSaveProductsList(updated);
      alert(isAr ? '✓ تم تعديل السلعة بنجاح!' : '✓ Product edited successfully!');
    } else {
      // Add mode
      // Calculate next sequential code continuing from the highest existing code in products
      let maxCodeNum = 0;
      products.forEach(p => {
        if (p.code) {
          const num = parseInt(p.code, 10);
          if (!isNaN(num) && num > maxCodeNum) {
            maxCodeNum = num;
          }
        }
      });
      const nextCode = String(maxCodeNum + 1).padStart(2, '0');

      const newProd: Product = {
        id: `custom-sl-${Date.now()}`,
        code: nextCode,
        title: prodTitleAr.trim(),
        titleEn: prodTitleEn.trim() || prodTitleAr.trim(),
        price: parseFloat(prodPrice),
        description: prodDescAr.trim(),
        descriptionEn: prodDescEn.trim() || prodDescAr.trim(),
        image: prodImage.trim(),
        category: prodCategory,
        videoUrl: prodVideo.trim() || undefined,
        deliveryGroupId: prodGroup.trim() || undefined,
        merchantPhone: prodMerchantPhone.trim() || undefined,
        secretAddress: prodSecretAddress.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      onSaveProductsList([newProd, ...products]);
      alert(isAr ? '🚀 تم إضافة المنتج الجديد للمتجر بنجاح!' : '🚀 New product registered successfully!');
    }

    // Reset Form
    setProdIdToEdit(null);
    setProdTitleAr('');
    setProdTitleEn('');
    setProdPrice('');
    setProdDescAr('');
    setProdDescEn('');
    setProdImage('');
    setProdCategory('clothes');
    setProdVideo('');
    setProdGroup('');
    setProdMerchantPhone('');
    setProdSecretAddress('');
  };

  const handleEditProductClick = (p: Product) => {
    setProdIdToEdit(p.id);
    setProdTitleAr(p.title);
    setProdTitleEn(p.titleEn || '');
    setProdPrice(p.price.toString());
    setProdDescAr(p.description);
    setProdDescEn(p.descriptionEn || '');
    setProdImage(p.image || '');
    setProdCategory(p.category);
    setProdVideo(p.videoUrl || '');
    setProdGroup(p.deliveryGroupId || '');
    setProdMerchantPhone(p.merchantPhone || '');
    setProdSecretAddress(p.secretAddress || '');
    
    // Jump to products editing forms
    setActiveTab('products');
    document.getElementById('admin-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    onSaveProductsList(updated);
    setProductToDeleteId(null);
  };

  const handleAddOrEditCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupTitleAr.trim() || !coupCode.trim() || !coupDiscount.trim() || !coupDescAr.trim()) {
      alert(isAr ? 'يرجى ملى كافة حقول الكوبون الإلزامية' : 'Please provide all mandatory coupon fields.');
      return;
    }

    if (coupIdToEdit) {
      // Edit
      const updated = coupons.map(c => {
        if (c.id === coupIdToEdit) {
          return {
            ...c,
            titleAr: coupTitleAr.trim(),
            titleEn: coupTitleEn.trim() || coupTitleAr.trim(),
            descriptionAr: coupDescAr.trim(),
            descriptionEn: coupDescEn.trim() || coupDescAr.trim(),
            code: coupCode.trim().toUpperCase(),
            category: coupCategory,
            discount: coupDiscount.trim()
          };
        }
        return c;
      });
      onSaveCouponsList(updated);
      alert(isAr ? '✓ تم تحديث كوبون الخصم!' : '✓ Coupon updated!');
    } else {
      // Add
      const newCoup: PartnerCoupon = {
        id: `coup-sl-${Date.now()}`,
        titleAr: coupTitleAr.trim(),
        titleEn: coupTitleEn.trim() || coupTitleAr.trim(),
        descriptionAr: coupDescAr.trim(),
        descriptionEn: coupDescEn.trim() || coupDescAr.trim(),
        code: coupCode.trim().toUpperCase(),
        category: coupCategory,
        discount: coupDiscount.trim()
      };
      onSaveCouponsList([newCoup, ...coupons]);
      alert(isAr ? '🚀 تم إضافة كوبون الشريك الجديد بنجاح!' : '🚀 New partner coupon registered!');
    }

    // Reset Form
    setCoupIdToEdit(null);
    setCoupTitleAr('');
    setCoupTitleEn('');
    setCoupDescAr('');
    setCoupDescEn('');
    setCoupCode('');
    setCoupCategory('food');
    setCoupDiscount('');
  };

  const handleEditCouponClick = (c: PartnerCoupon) => {
    setCoupIdToEdit(c.id);
    setCoupTitleAr(c.titleAr);
    setCoupTitleEn(c.titleEn);
    setCoupDescAr(c.descriptionAr);
    setCoupDescEn(c.descriptionEn);
    setCoupCode(c.code);
    setCoupCategory(c.category);
    setCoupDiscount(c.discount);

    setActiveTab('coupons');
    document.getElementById('admin-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteCoupon = (id: string) => {
    const updated = coupons.filter(c => c.id !== id);
    onSaveCouponsList(updated);
    setCouponToDeleteId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4" id="admin-form-anchor" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Trigger block */}
      <div className="bg-gradient-to-r from-[#1b124a] to-[#0a0322] border-r-4 border-[#d946ef] rounded-2xl p-4.5 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8b5cf6] to-[#d946ef] flex items-center justify-center text-xl shadow-lg border border-[#a78bfa]/30">
            ⚙️
          </div>
          <div className={`${isAr ? 'text-right' : 'text-left'}`}>
            <h2 className="text-sm sm:text-base font-black text-white">
              {isAr ? 'لوحة المشرف العام وإدارة المتجر 👑' : 'System Administration Console 👑'}
            </h2>
            <p className="text-[11px] text-[#ff00a0]">
              {isAr ? `مسؤول المتجر: ${user.name} | التحكم الشامل مفعّل` : `Admin User: ${user.name} | Total controls active`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white font-black py-2.5 px-6 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md"
        >
          {isOpen ? (isAr ? 'إغلاق الإدارة ❌' : 'Close Console ❌') : (isAr ? 'فتح التحكم الشامل بالمتجر 🛠️' : 'Access General Controls 🛠️')}
        </button>
      </div>

      {/* Main Panel Content */}
      {isOpen && (
        <div className="bg-[#12092e] border border-[#8b5cf6]/30 rounded-3xl mt-4 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          {/* Section Selector */}
          <div className="flex bg-[#160e3d] p-1.5 rounded-2xl gap-2 overflow-x-auto scrollbar-none border border-[#8b5cf6]/20 mb-6">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                activeTab === 'settings' ? 'bg-[#8b5cf6] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              ⚙️ {isAr ? 'إعدادات الموقع والتواصل' : 'Store Settings & Socials'}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                activeTab === 'products' ? 'bg-[#8b5cf6] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              📦 {isAr ? 'إدارة المنتجات والأقسام' : 'Manage Products'}
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-4.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                activeTab === 'coupons' ? 'bg-[#8b5cf6] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🏷️ {isAr ? 'إدارة كوبونات خصم المحلات' : 'Manage Partner Coupons'}
            </button>
            <button
              onClick={() => setActiveTab('moderators')}
              className={`px-4.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                activeTab === 'moderators' ? 'bg-[#8b5cf6] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              👥 {isAr ? 'إضافة وتعديل المشرفين' : 'Add Moderators'}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer relative ${
                activeTab === 'orders' ? 'bg-[#ff007f] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              📋 {isAr ? 'الطلبات والعمليات الفورية ' : 'Operations & Tracking'}
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse border border-[#12092e]">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Store settings form */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Core Store Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{isAr ? 'اسم المتجر:' : 'Store Name:'}</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 bg-[#160e3d] text-white border border-[#8b5cf6]/25 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{isAr ? 'رابط شعار المتجر (شعار مخصص):' : 'Custom Store Logo URL:'}</label>
                  <input
                    type="text"
                    value={storeLogo}
                    onChange={(e) => setStoreLogo(e.target.value)}
                    placeholder="https://images.unsplash.com/your-logo.png"
                    className="w-full text-xs sm:text-sm p-3 bg-[#160e3d] text-white border border-[#8b5cf6]/25 rounded-xl outline-none font-mono text-left"
                  />
                </div>
              </div>

              {/* Master Email & Password modification */}
              <div className="p-4 bg-[#1b124a]/50 rounded-2xl border border-[#cbd5e1]/10 space-y-4">
                <h4 className="text-xs font-black text-[#5df6be] flex items-center gap-2">
                  <Key size={14} />
                  <span>{isAr ? 'تعديل البريد الإلكتروني والرقم السري للمشرف الأول:' : 'Master Admin Web Credentials:'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">{isAr ? 'البريد الإلكتروني المعتمر:' : 'Login Master Email:'}</label>
                    <input
                      type="email"
                      required
                      value={adminEmailInput}
                      onChange={(e) => setAdminEmailInput(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">{isAr ? 'الرقم السري للإدارة العامة:' : 'Login Master Password:'}</label>
                    <input
                      type="text"
                      required
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Social Channels Contact Info */}
              <div className="p-4 bg-[#1b124a]/30 rounded-2xl border border-[#cbd5e1]/10 space-y-4">
                <h4 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d946ef] to-[#bfdbfe]">
                  📞 {isAr ? 'حسابات التواصل الاجتماعي وتفاصيل الاتصال:' : 'Contact Channels:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'رقم الواتساب بالرمز الدولي (بدون +):' : 'WhatsApp Int. Number (no +):'}</label>
                    <input
                      type="number"
                      required
                      value={wpNum}
                      onChange={(e) => setWpNum(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'رابط حساب الانستجرام:' : 'Instagram Username:'}</label>
                    <input
                      type="text"
                      value={insta}
                      onChange={(e) => setInsta(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'رابط حساب سناب شات:' : 'Snapchat Username:'}</label>
                    <input
                      type="text"
                      value={snap}
                      onChange={(e) => setSnap(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'رابط حساب تويتر/إكس:' : 'Twitter Username:'}</label>
                    <input
                      type="text"
                      value={twit}
                      onChange={(e) => setTwit(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'هاتف المحل الأرضي (ثابت):' : 'Landline Shop Tel:'}</label>
                    <input
                      type="text"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none text-left"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'عنوان الموقع الجغرافي للمحل:' : 'Store Physical Address:'}</label>
                    <input
                      type="text"
                      value={adr}
                      onChange={(e) => setAdr(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Pickup Instruction Textareas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">{isAr ? 'تعليمات الاستلام من المحل (العربية):' : 'Pickup Instructions (Arabic):'}</label>
                    <textarea
                      rows={2}
                      value={pickupAr}
                      onChange={(e) => setPickupAr(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#b1a0f9] block mb-1">{isAr ? 'تعليمات الاستلام من المحل (English):' : 'Pickup Instructions (English):'}</label>
                    <textarea
                      rows={2}
                      value={pickupEn}
                      onChange={(e) => setPickupEn(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#160e3d] text-white border border-[#8b5cf6]/20 rounded-xl outline-none resize-none text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Promotional Top Ad Placements Settings */}
              <div className="p-4 bg-[#1b124a]/20 rounded-2xl border border-[#cbd5e1]/10 space-y-4 text-right">
                <h4 className="text-xs font-black text-[#ff00a0] flex items-center gap-2">
                  📢 <span>{isAr ? 'التحكم بالمساحة الإعلانية في الأعلى (جوجل أدسنس أو ترويجي):' : 'Top Promotional / Google AdSense Settings:'}</span>
                </h4>
                
                <div className="flex justify-between items-center bg-[#12092e] p-3 rounded-xl border border-[#8b5cf6]/20">
                  <span className="text-xs font-bold text-zinc-300">{isAr ? 'حالة البانر الإعلاني:' : 'Banner Active Status:'}</span>
                  <button
                    type="button"
                    onClick={() => setAdActive(!adActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black text-white transition ${
                      adActive ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {adActive ? (isAr ? 'تم النشر ✓' : 'Active ✓') : (isAr ? 'مخفي 🛑' : 'Disabled 🛑')}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-300 block mb-1.5">{isAr ? 'نوع شفرة الإعلان:' : 'Ad Core System:'}</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#12092e] p-1 rounded-xl border border-[#8b5cf6]/20 max-w-sm">
                    <button
                      type="button"
                      onClick={() => setAdType('personal')}
                      className={`py-1 rounded-lg text-[10px] font-semibold ${adType === 'personal' ? 'bg-[#8b5cf6] text-white' : 'text-zinc-400'}`}
                    >
                      📝 {isAr ? 'إعلان مخصص يدوي' : 'Custom Banner'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdType('adsense')}
                      className={`py-1 rounded-lg text-[10px] font-semibold ${adType === 'adsense' ? 'bg-[#8b5cf6] text-white' : 'text-zinc-400'}`}
                    >
                      ⚡ Google AdSense
                    </button>
                  </div>
                </div>

                {adType === 'personal' ? (
                  <div className="space-y-3.5 bg-[#12092e]/40 p-3 rounded-xl border border-[#8b5cf6]/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">{isAr ? 'العنوان الترويجي (العربية):' : 'Promo Title (Arabic):'}</label>
                        <input
                          type="text"
                          value={adTitleAr}
                          onChange={(e) => setAdTitleAr(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">{isAr ? 'English Promo Title:' : 'Promo Title (English):'}</label>
                        <input
                          type="text"
                          value={adTitleEn}
                          onChange={(e) => setAdTitleEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">{isAr ? 'الوصف الترويجي (العربية):' : 'Promo Description (Arabic):'}</label>
                        <textarea
                          rows={2}
                          value={adDescAr}
                          onChange={(e) => setAdDescAr(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">{isAr ? 'English Promo Description:' : 'Promo Description (English):'}</label>
                        <textarea
                          rows={2}
                          value={adDescEn}
                          onChange={(e) => setAdDescEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl resize-none text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">{isAr ? 'رابط توجيه المعاينة (مثلا رقم واتساب أو رابط خارجي):' : 'Promo External Target URL:'}</label>
                        <input
                          type="text"
                          value={adLink}
                          onChange={(e) => setAdLink(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl text-left font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">{isAr ? 'صورة البانر الإعلاني (رابط URL أو رفع من هاتفك):' : 'Promo Banner Image (URL or Upload):'}</label>
                        <input
                          type="text"
                          value={adImg}
                          onChange={(e) => setAdImg(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl text-left font-mono"
                        />
                        <div className="mt-2 flex items-center justify-between gap-2 p-2 bg-[#1b124a]/40 rounded-xl border border-[#8b5cf6]/20">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 active:scale-95 transition text-[10px] font-black text-black px-3 py-1.5 rounded-xl shadow-md select-none">
                            <span>📸 {isAr ? 'رفع صورة البانر من الاستوديو' : 'Upload Banner from Studio'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const r = new FileReader();
                                  r.onloadend = () => {
                                    if (typeof r.result === 'string') {
                                      setAdImg(r.result);
                                    }
                                  };
                                  r.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {adImg && (
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] text-emerald-400 font-extrabold">{isAr ? '✓ جاهزة' : '✓ Loaded'}</span>
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40">
                                <img src={adImg} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#12092e]/40 p-3 rounded-xl border border-[#8b5cf6]/10">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-405 block mb-1">Google AdSense Client ID (ca-pub-xxx):</label>
                      <input
                        type="text"
                        value={adClient}
                        onChange={(e) => setAdClient(e.target.value)}
                        className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-405 block mb-1">Google AdSense Slot ID (90xxxxx):</label>
                      <input
                        type="text"
                        value={adSlot}
                        onChange={(e) => setAdSlot(e.target.value)}
                        className="w-full text-xs p-2.5 bg-[#12092e] text-white border border-[#8b5cf6]/20 rounded-xl font-mono text-left"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#8b5cf6] hover:bg-[#d946ef] text-white font-black py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-[#8b5cf6]/10 cursor-pointer"
              >
                💾 {isAr ? 'حفظ وحماية كافة تغييرات المتجر والمشرف' : 'Save General Store Settings & Credentials'}
              </button>

            </form>
          )}

          {/* Tab 2: Products configuration */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* Product Creation details */}
              <form onSubmit={handleAddOrEditProduct} className="p-4 bg-[#1b124a]/40 rounded-2xl border border-[#8b5cf6]/20 space-y-4">
                <h4 className="text-xs font-black text-[#d946ef] flex items-center gap-1.5 border-b border-[#cbd5e1]/10 pb-2">
                  <Plus size={14} />
                  <span>{prodIdToEdit ? (isAr ? 'تحديث وتعديل سلعة بالمتجر:' : 'Edit Product Particulars:') : (isAr ? 'إدراج سلعة أو منتج جديد فوري:' : 'Add New E-Store Product:')}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'عنوان السلعة باللغة العربية:' : 'Product Name (Arabic):'}</label>
                    <input
                      type="text"
                      required
                      value={prodTitleAr}
                      onChange={(e) => setProdTitleAr(e.target.value)}
                      placeholder="جاكيت رياضي فاخر"
                      className="w-full text-xs sm:text-sm p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'العنوان باللغة الإنجليزية (English Title):' : 'Product Name (English):'}</label>
                    <input
                      type="text"
                      value={prodTitleEn}
                      onChange={(e) => setProdTitleEn(e.target.value)}
                      placeholder="Luxury Athletic Jacket"
                      className="w-full text-xs sm:text-sm p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'السعر بالدينار البحريني (د.ب):' : 'Price (BHD):'}</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="12.5"
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'تصنيف السلعة:' : 'Product Department:'}</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl outline-none"
                    >
                      <option value="clothes">👕 {isAr ? 'الملابس الرجالية والنسائية' : 'Clothes & Outfits'}</option>
                      <option value="perfumes">💨 {isAr ? 'العطور والبخور والعود' : 'Perfumes & Incense'}</option>
                      <option value="watches">⌚ {isAr ? 'ساعات فاخرة وأصلية' : 'Luxury Watches'}</option>
                      <option value="electronics">💻 {isAr ? 'أجهزة إلكترونية وهواتف' : 'Electronics'}</option>
                      <option value="home">🛋️ {isAr ? 'المنزل والأثاث متميز' : 'Home Furniture'}</option>
                      <option value="games">🎮 {isAr ? 'ألعاب إلكترونية وبلايستيشن' : 'Games & Playstation'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-300 block mb-1">
                      {isAr ? 'هاتف التاجر/المورد للمنتج (خاص و سري):' : 'Private Merchant WhatsApp (Hidden):'}
                    </label>
                    <input
                      type="text"
                      value={prodMerchantPhone}
                      onChange={(e) => setProdMerchantPhone(e.target.value)}
                      placeholder="97339442011"
                      className="w-full text-xs p-3 bg-[#12092e] text-amber-200 border border-amber-500/30 rounded-xl outline-none font-mono text-left"
                    />
                    <span className="text-[8px] text-zinc-400 block mt-1">*{isAr ? 'خاص ومخفي عن الزوار يسهل تواصلك مع الموردين' : 'Confidential, used to route supplier requests'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#f43f5e] block mb-1">
                      {isAr ? 'موقع وعنوان السلعة السري (سري ومخفي عن العميل):' : 'Secret Physical Location / Address (Confidential):'}
                    </label>
                    <input
                      type="text"
                      value={prodSecretAddress}
                      onChange={(e) => setProdSecretAddress(e.target.value)}
                      placeholder={isAr ? 'مثال: مستودع الرفاع، الرف رقم ٣' : 'e.g. Riffa Warehouse, Shelf 3'}
                      className="w-full text-xs p-3 bg-[#12092e] text-red-100 border border-[#f43f5e]/30 rounded-xl outline-none"
                    />
                    <span className="text-[8px] text-zinc-400 block mt-1">*{isAr ? 'يظهر فقط في كشف المبيعات والطلب لتسهيل تجميع المنتجات من الموردين' : 'Only printed in the administrator copy of invoices'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'رابط صورة السلعة فوتوغرافية (URL أو رفع من هاتفك):' : 'Product Photo (URL or Upload):'}</label>
                    <input
                      type="text"
                      required
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      placeholder="https://images.unsplash.com/clothing.jpg"
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl font-mono text-left"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2 p-2 bg-[#1b124a]/40 rounded-xl border border-[#8b5cf6]/20">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 active:scale-95 transition text-[10px] font-black text-black px-3.5 py-2 rounded-xl shadow-lg leading-none shrink-0 select-none">
                        <span>📸 {isAr ? 'اختر صورة من استوديو الهاتف' : 'Pick from Phone Studio'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => {
                                if (typeof r.result === 'string') {
                                  setProdImage(r.result);
                                }
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      
                      {prodImage && (
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-emerald-400 font-extrabold">{isAr ? '✓ جاهزة' : '✓ Loaded'}</span>
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40">
                            <img src={prodImage} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'رابط فيديو السلعة (YouTube أو رابط مباشر MP4 - اختياري):' : 'YouTube or direct MP4 video link (Optional):'}</label>
                    <input
                      type="text"
                      value={prodVideo}
                      onChange={(e) => setProdVideo(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl font-mono text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'وصف تفصيلي للسلعة (العربية):' : 'Detailed Description (Arabic):'}</label>
                    <textarea
                      rows={3}
                      required
                      value={prodDescAr}
                      onChange={(e) => setProdDescAr(e.target.value)}
                      placeholder="أدخل مواصفات السلعة وحالتها ومميزاتها بالتفصيل..."
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#b1a0f9] block mb-1">{isAr ? 'وصف تفصيلي بالإنجليزية (English Description):' : 'English Detailed Description:'}</label>
                    <textarea
                      rows={3}
                      value={prodDescEn}
                      onChange={(e) => setProdDescEn(e.target.value)}
                      placeholder="Specify material, size, brand, fit details..."
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl resize-none text-left font-sans"
                    />
                  </div>
                </div>

                {/* Consolidated vs Independent Shipping Setup Restored */}
                <div className="bg-[#12092e]/40 p-4 rounded-xl border border-[#8b5cf6]/20 space-y-3">
                  <span className="text-[10px] font-black text-[#5df6be] block">
                    {isAr ? '🚛 خيارات تجميع الشحن للسلعة (مدمج أو منفرد):' : '🚛 Shipping Type for this Item (Consolidated or Solo):'}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-300 block mb-1">
                        {isAr ? 'مستودع الشحن التجميعي المدمج (اختر أو اتركه فارغاً لشحن منفرد):' : 'Consolidated Shipping Warehouse (Or leave empty for Solo/Independent):'}
                      </label>
                      <select
                        value={prodGroup}
                        onChange={(e) => setProdGroup(e.target.value)}
                        className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#cbd5e1]/10 rounded-xl outline-none"
                      >
                        <option value="">{isAr ? '🚚 شحن منفرد مستقل (يتحمل تكلفة شحن خاصة منفردة)' : '🚚 Solo / Independent Shipping (Carries independent fee)'}</option>
                        <option value="A-riffa">{isAr ? '📦 مستودع الرفاع التجميعي (A-riffa)' : '📦 Consolidated Group Riffa (A-riffa)'}</option>
                        <option value="B-manama">{isAr ? '📦 مستودع المنامة التجميعي (B-manama)' : '📦 Consolidated Group Manama (B-manama)'}</option>
                        <option value="C-muharraq">{isAr ? '📦 مستودع المحرق التجميعي (C-muharraq)' : '📦 Consolidated Group Muharraq (C-muharraq)'}</option>
                        {customWarehouses.map(wh => (
                          <option key={wh.id} value={wh.id}>📦 {wh.name}</option>
                        ))}
                      </select>
                      <span className="text-[8.5px] text-zinc-400 block mt-1">
                        {isAr 
                          ? '* دمج المنتجات بنفس المستودع يجعل العميل يدفع قيمة شحن واحدة للكل (مثلا 3.000 د.ب للمجموعة كاملة).'
                          : '* Items assigned to the same warehouse ID will share only one delivery fee for the entire checkout order.'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-300 block">
                        {isAr ? 'أو أضف مستودع دمج جديد غير مدرج:' : 'Or Create/Register a New Consolidated Warehouse ID:'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWarehouseName}
                          onChange={(e) => setNewWarehouseName(e.target.value)}
                          placeholder={isAr ? 'مثال: مستودع سترة' : 'e.g. Sitra Consolidated'}
                          className="flex-1 text-xs p-2.5 bg-[#12092e] text-white border border-[#cbd5e1]/10 rounded-xl placeholder-zinc-500 text-right"
                        />
                        <button
                          type="button"
                          onClick={handleAddWarehouse}
                          className="bg-[#8b5cf6] hover:bg-[#d946ef] text-white text-[10.5px] font-black px-4.5 rounded-xl cursor-pointer transition active:scale-95"
                        >
                          {isAr ? 'إدراج 🗳#' : 'Add 🗳#'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end leading-none">
                  {prodIdToEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setProdIdToEdit(null);
                        setProdTitleAr('');
                        setProdTitleEn('');
                        setProdPrice('');
                        setProdDescAr('');
                        setProdDescEn('');
                        setProdImage('');
                        setProdCategory('clothes');
                        setProdVideo('');
                        setProdGroup('');
                        setProdMerchantPhone('');
                      }}
                      className="bg-zinc-700 hover:bg-zinc-650 px-5 rounded-xl text-xs font-black text-white"
                    >
                      {isAr ? 'إلغاء التعديل التراجع' : 'Cancel Edit'}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] text-white font-black py-3 px-6 rounded-xl text-xs sm:text-sm shadow-md transition"
                  >
                    🚀 {prodIdToEdit ? (isAr ? 'حفظ تعديلات السلعة الحالية' : 'Save Changes') : (isAr ? 'إدراج السلعة في متجر S&L' : 'Publish to S&L E-Store')}
                  </button>
                </div>
              </form>

              {/* Products Directory Grid of actual items */}
              <div className="space-y-3">
                <span className="text-xs font-black text-white block">
                  {isAr ? `قائمة سلع المتجر المسجلة حالياً (${products.length}):` : `Active Store Registered Items (${products.length}):`}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <div 
                      key={p.id}
                      className="bg-[#160e3d]/80 border border-[#8b5cf6]/25 p-3 rounded-2xl flex justify-between items-center gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={p.image} 
                          alt="" 
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#8b5cf6]/20 bg-[#12092e]"
                        />

                        <div className={`min-w-0 ${isAr ? 'text-right' : 'text-left'}`}>
                          <h4 className="text-xs font-black text-white truncate leading-snug">{isAr ? p.title : (p.titleEn || p.title)}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold font-mono">
                            {p.price} BHD | {p.category} | {p.deliveryGroupId ? `📦 ${p.deliveryGroupId}` : `🚚 ${isAr ? 'موقع منفرد' : 'independent'}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditProductClick(p)}
                          className="p-2 rounded-lg bg-[#1b124a]/80 text-[#bfdbfe] hover:bg-[#8b5cf6] hover:text-white border border-[#8b5cf6]/30 transition"
                          title={isAr ? 'تعديل السلعة' : 'Edit Product'}
                        >
                          <Edit2 size={12} />
                        </button>

                        {productToDeleteId === p.id ? (
                          <div className="flex items-center gap-1 bg-[#22072a] border border-red-500/40 p-1 rounded-lg animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-black px-2 py-1 rounded-md text-[10px] cursor-pointer"
                            >
                              {isAr ? 'حذف ✓' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDeleteId(null)}
                              className="bg-zinc-705 hover:bg-zinc-650 text-zinc-300 px-1.5 py-1 rounded-md text-[9px] cursor-pointer"
                            >
                              {isAr ? 'تراجع' : 'X'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setProductToDeleteId(p.id)}
                            className="p-2 rounded-lg bg-[#1b124a]/80 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 transition cursor-pointer"
                            title={isAr ? 'شطب السلعة' : 'Delete Product'}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Local Partner coupons */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 text-right">
              
              {/* Form to add or edit partner coupon */}
              <form onSubmit={handleAddOrEditCoupon} className="p-4 bg-[#1b124a]/40 rounded-2xl border border-[#8b5cf6]/20 space-y-4">
                <h4 className="text-xs font-black text-[#cbd5e1] flex items-center gap-1.5 border-b border-[#cbd5e1]/10 pb-2">
                  <span>🎟️</span>
                  <span>{coupIdToEdit ? (isAr ? 'تحديث بيانات كوبون شريك:' : 'Edit Partner Coupon Information:') : (isAr ? 'إدراج كود خصم شريك (محلات أو مطاعم):' : 'Add Local Partner Coupon Code:')}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'الاسم الترويجي للكوبون بالعربية:' : 'Coupon Title (Arabic):'}</label>
                    <input
                      type="text"
                      required
                      value={coupTitleAr}
                      onChange={(e) => setCoupTitleAr(e.target.value)}
                      placeholder="خصم 30٪ لدى مطعم البندر"
                      className="w-full text-xs sm:text-sm p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'اسم الكوبون بالإنجليزية (English Title):' : 'Coupon Title (English):'}</label>
                    <input
                      type="text"
                      value={coupTitleEn}
                      onChange={(e) => setCoupTitleEn(e.target.value)}
                      placeholder="30% Off Bandar Seafood"
                      className="w-full text-xs sm:text-sm p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'الرمز البرمجي للكوبون (كود الخصم):' : 'Discount Promo Code:'}</label>
                    <input
                      type="text"
                      required
                      value={coupCode}
                      onChange={(e) => setCoupCode(e.target.value)}
                      placeholder="BANDAR30"
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl text-left font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'قيمة الخصم المعلنة (مثلا 30٪ أو 5 د.ب):' : 'Promo Value (e.g., 30%):'}</label>
                    <input
                      type="text"
                      required
                      value={coupDiscount}
                      onChange={(e) => setCoupDiscount(e.target.value)}
                      placeholder="30%"
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'تصنيف خصم الشريك:' : 'Promo Category:'}</label>
                    <select
                      value={coupCategory}
                      onChange={(e) => setCoupCategory(e.target.value)}
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl cursor-pointer"
                    >
                      <option value="food">🥗 {isAr ? 'مطاعم ومأكولات ومقاهي' : 'Food, Cafes & Restaurants'}</option>
                      <option value="health">🦷 {isAr ? 'عيادات أسنان وعناية وصحة' : 'Health & Dental Clinic'}</option>
                      <option value="shopping">👜 {isAr ? 'متاجر ملابس وترفيه وتسوق' : 'Shopping Stores & Leisure'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-300 block mb-1">{isAr ? 'وصف تفصيلي لشروط الاستفادة (العربية):' : 'Description Rules (Arabic):'}</label>
                    <textarea
                      rows={2}
                      required
                      value={coupDescAr}
                      onChange={(e) => setCoupDescAr(e.target.value)}
                      placeholder="الخصم ساري على كافة الوجبات غداء عائلية طيلة الأسبوع..."
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#b1a0f9] block mb-1">{isAr ? 'وصف تفصيلي بالإنجليزية (English Rules):' : 'English Description Rules:'}</label>
                    <textarea
                      rows={2}
                      value={coupDescEn}
                      onChange={(e) => setCoupDescEn(e.target.value)}
                      placeholder="Discount valid on all dine-in main course dishes..."
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl resize-none text-left"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 leading-none">
                  {coupIdToEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoupIdToEdit(null);
                        setCoupTitleAr('');
                        setCoupTitleEn('');
                        setCoupDescAr('');
                        setCoupDescEn('');
                        setCoupCode('');
                        setCoupCategory('food');
                        setCoupDiscount('');
                      }}
                      className="bg-zinc-700 hover:bg-zinc-650 px-5 rounded-xl text-xs font-black text-white"
                    >
                      {isAr ? 'تراجع' : 'Cancel'}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] text-white font-black py-3 px-6 rounded-xl text-xs sm:text-sm shadow-md cursor-pointer"
                  >
                    🚀 {coupIdToEdit ? (isAr ? 'أكد وحفّظ الكوبون المعدّل' : 'Update Coupon') : (isAr ? 'نشر كود الكوبون فورا' : 'Publish Partner Coupon')}
                  </button>
                </div>
              </form>

              {/* Coupons Directory list */}
              <div className="space-y-3 pt-4">
                <span className="text-xs font-black text-white block">
                  {isAr ? `الكوبونات النشطة حالياً بالنظام (${coupons.length}):` : `Active Discount Coupons List (${coupons.length}):`}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((c) => (
                    <div 
                      key={c.id}
                      className="bg-[#160e3d]/80 border border-[#8b5cf6]/25 p-3 rounded-2xl flex justify-between items-center gap-3"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-2xl">🎫</span>
                        <div className="min-w-0 text-right">
                          <h4 className="text-xs font-black text-white truncate leading-snug">{isAr ? c.titleAr : c.titleEn}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold font-mono">
                            {isAr ? 'كود:' : 'CODE:'} <span className="text-[#5df6be]">{c.code}</span> | {isAr ? 'الخصم:' : 'Discount:'} {c.discount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCouponClick(c)}
                          className="p-2 rounded-lg bg-[#1b124a]/85 text-[#bfdbfe] hover:bg-[#8b5cf6] hover:text-white border border-[#8b5cf6]/30 transition"
                          title={isAr ? 'تعديل الكوبون' : 'Edit Coupon'}
                        >
                          <Edit2 size={12} />
                        </button>

                        {couponToDeleteId === c.id ? (
                          <div className="flex items-center gap-1 bg-[#22072a] border border-red-500/40 p-1 rounded-lg animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-black px-2 py-1 rounded-md text-[10px] cursor-pointer"
                            >
                              {isAr ? 'حذف ✓' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCouponToDeleteId(null)}
                              className="bg-zinc-705 hover:bg-zinc-650 text-zinc-300 px-1.5 py-1 rounded-md text-[9px] cursor-pointer"
                            >
                              {isAr ? 'تراجع' : 'X'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCouponToDeleteId(c.id)}
                            className="p-2 rounded-lg bg-[#1b124a]/85 text-red-400 hover:bg-red-650 hover:text-white border border-red-500/20 transition cursor-pointer"
                            title={isAr ? 'شطب الكوبون' : 'Delete Coupon'}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab 4: Multi-Moderators */}
          {activeTab === 'moderators' && (
            <div className="space-y-6">
              
              {/* Form to append moderators */}
              <form onSubmit={handleAddModerator} className="p-4 bg-[#1b124a]/40 rounded-2xl border border-[#8b5cf6]/20 space-y-4">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-[#cbd5e1]/10 pb-2">
                  <UserPlus size={14} className="text-[#bfdbfe]" />
                  <span>{isAr ? 'إدراج مشرف أخصائي جديد (moderator account):' : 'Add New Moderator Account:'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">{isAr ? 'اسم المشرف بالكامل:' : 'Moderator Name:'}</label>
                    <input
                      type="text"
                      required
                      value={newModName}
                      onChange={(e) => setNewModName(e.target.value)}
                      placeholder="مثال: يوسف جناحي"
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">{isAr ? 'البريد الإلكتروني للوجين:' : 'Moderator Login Email:'}</label>
                    <input
                      type="email"
                      required
                      value={newModEmail}
                      onChange={(e) => setNewModEmail(e.target.value)}
                      placeholder="mod@sl-store.bh"
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">{isAr ? 'الرقم السري للمشرف الجديد:' : 'Moderator Password:'}</label>
                    <input
                      type="text"
                      required
                      value={newModPassword}
                      onChange={(e) => setNewModPassword(e.target.value)}
                      placeholder="•••••••••"
                      className="w-full text-xs p-3 bg-[#12092e] text-white border border-[#8b5cf6]/30 rounded-xl font-mono text-left"
                    />
                  </div>
                </div>

                <div className="flex justify-end p-1">
                  <button
                    type="submit"
                    className="bg-[#8b5cf6] hover:bg-[#d946ef] text-white font-black py-2.5 px-6 rounded-xl text-xs sm:text-sm shadow-md transition"
                  >
                    👑 {isAr ? 'تسجيل وإدراج المشرف الجديد بالنظام' : 'Add Moderator Account'}
                  </button>
                </div>
              </form>

              {/* Moderators directory */}
              <div className="space-y-3">
                <span className="text-xs font-black text-white block">
                  👥 {isAr ? 'حسابات هيئة الإشراف والإدارة العامة للموقع:' : 'Registered System Administrators:'}
                </span>

                <div className="bg-[#12092e]/50 border border-[#8b5cf6]/25 rounded-2xl overflow-hidden shadow-md">
                  <div className="grid grid-cols-3 bg-[#160e3d] p-3 border-b border-[#cbd5e1]/10 text-[10.5px] font-black text-zinc-400">
                    <div>{isAr ? 'المسمى والاسم الكامل' : 'Full Name'}</div>
                    <div>{isAr ? 'البريد الإلكتروني للمشرف' : 'Login Email'}</div>
                    <div className="text-center">{isAr ? 'التحكم الإداري' : 'Controls'}</div>
                  </div>

                  <div className="divide-y divide-[#8b5cf6]/10 text-xs sm:text-sm text-white">
                    {/* Primary System Admin */}
                    <div className="grid grid-cols-3 p-3 items-center">
                      <div className="font-extrabold text-[#5df6be] flex items-center gap-1">
                        <span>👑</span>
                        <span>{isAr ? `المطور الرئيسي ${localStorage.getItem('sl_admin_email')?.split('@')[0] || (import.meta as any).env.VITE_ADMIN_EMAIL?.split('@')[0] || 'Admin'}` : `Main Admin ${localStorage.getItem('sl_admin_email')?.split('@')[0] || (import.meta as any).env.VITE_ADMIN_EMAIL?.split('@')[0] || 'Admin'}`}</span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-300">{localStorage.getItem('sl_admin_email') || (import.meta as any).env.VITE_ADMIN_EMAIL || ''}</div>
                      <div className="text-center">
                        <span className="text-[10px] bg-[#d946ef]/20 text-[#f5d0fe] border border-[#d946ef]/45 px-2 py-0.5 rounded-full font-bold">
                          {isAr ? 'سلطة مطلقة' : 'Owner'}
                        </span>
                      </div>
                    </div>

                    {/* Additional Moderators */}
                    {adminAccounts.filter(acc => acc.email !== (localStorage.getItem('sl_admin_email') || (import.meta as any).env.VITE_ADMIN_EMAIL || '')).map((acc) => (
                      <div key={acc.email} className="grid grid-cols-3 p-3 items-center">
                        <div className="font-extrabold text-zinc-205">{acc.name}</div>
                        <div className="font-mono text-[11px] text-zinc-450">{acc.email}</div>
                        <div className="text-center flex items-center justify-center gap-2 overflow-x-hidden">
                          <span className="text-[10px] bg-[#12092e] text-zinc-300 border border-[#8b5cf6]/35 px-2 py-0.5 rounded-md font-medium">
                            {isAr ? 'إشراف ثانوي' : 'Moderator'}
                          </span>
                          {adminToDeleteEmail === acc.email ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRemoveModerator(acc.email)}
                                className="bg-red-600 hover:bg-red-700 text-white font-black rounded-lg px-2 py-1 text-[9.5px] cursor-pointer shadow-sm"
                              >
                                {isAr ? 'تأكيد الحذف ⚠️' : 'Confirm?'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAdminToDeleteEmail(null)}
                                className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg px-1.5 py-1 text-[9px] cursor-pointer"
                              >
                                {isAr ? 'تراجع' : 'Cancel'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAdminToDeleteEmail(acc.email)}
                              className="text-red-400 hover:text-red-200 border border-red-500/20 rounded px-2 py-0.5 font-bold cursor-pointer text-[10px]"
                            >
                              {isAr ? 'حذف' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 5: Incoming Orders & Activity Logging */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#cbd5e1]/10 pb-4">
                <div>
                  <h4 className="text-sm font-black text-[#5df6be] flex items-center gap-2">
                    <span>📥</span>
                    <span>{isAr ? 'العمليات وسجلات المعاملات الفورية لطلبات المتجر' : 'Real-time Store Orders & Operations Log'}</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {isAr ? 'بوابة المشرفين لمراجعة الفواتير وحالات التحرير، ومعلومات سرية عن مخابئ السلع وهواتف الموردين.' : 'Review invoice sheets, product coordinates & merchant phone details below.'}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    if (window.confirm(isAr ? 'هل أنت متأكد من مسح كافة سجلات وتفاصيل المعاملات من السيرفر وفي المتصفح؟' : 'Flush entire transaction history from server & cache?')) {
                      fetch('/api/orders-clear', { method: 'DELETE' })
                        .then(() => {
                          setOrders([]);
                          localStorage.setItem('sl_all_orders', '[]');
                          localStorage.setItem('sl_my_orders', '[]');
                          alert(isAr ? '✓ تم مسح وتصفير أرشيف الطلبات بالكامل من السيرفر والكاش!' : '✓ All orders storage records were flushed successfully!');
                        })
                        .catch(err => console.error(err));
                    }
                  }}
                  className="text-[10px] text-red-400 hover:text-red-200 border border-red-500/20 hover:bg-red-500/10 transition px-2.5 py-1.5 rounded-lg font-black cursor-pointer shadow-sm"
                >
                  🗑️ {isAr ? 'تصفير كافة سجلات الطلبات المخزنة' : 'Flush All Orders'}
                </button>
              </div>

              {/* Monthly Orders Summary & Statistics Card Dashboard */}
              <div className="bg-[#12092e]/90 p-4 rounded-2xl border border-[#8b5cf6]/20 space-y-3 text-right" dir="rtl">
                <div className="flex justify-between items-center border-b border-[#cbd5e1]/5 pb-2">
                  <h5 className="text-[12px] font-black text-amber-300 flex items-center gap-1.5">
                    <span>📊</span>
                    <span>{isAr ? 'خلاصة تعداد وحجم مبيعات الطلبات الفورية حسب الشهر:' : 'Monthly Orders Counting & Value Summary:'}</span>
                  </h5>
                  <span className="bg-[#ff007f]/10 text-[#ff007f] text-[9.5px] font-black px-2 py-0.5 rounded-md">
                    {orders.length} {isAr ? 'إجمالي الطلبات' : 'Total Orders'}
                  </span>
                </div>
                
                {getMonthlyStats().length === 0 ? (
                  <p className="text-[10.5px] text-zinc-400 text-center py-2.5">
                    {isAr ? 'لا تتوفر أي طلبات مدونة في الأرشيف حالياً لعرض إحصائيات الأشهر.' : 'No archived orders detected to summarize.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {getMonthlyStats().map((stat) => (
                      <div key={stat.monthKey} className="bg-[#160e3d]/80 p-3.5 rounded-xl border border-[#cbd5e1]/5 flex flex-col justify-between gap-1.5 transition duration-250 hover:border-[#8b5cf6]/45">
                        <div className="flex justify-between items-center sm:gap-4">
                          <span className="text-[11.5px] font-black text-[#5df6be]">{stat.displayLabel}</span>
                          <span className="bg-[#8b5cf6]/15 text-[#a78bfa] text-[9px] font-black px-1.5 py-0.5 rounded font-mono">{stat.monthKey}</span>
                        </div>
                        <div className="space-y-1 pt-1 border-t border-[#cbd5e1]/5">
                          <div className="flex justify-between items-baseline text-[10.5px]">
                            <span className="text-zinc-400">{isAr ? 'عدد الطلبات:' : 'Orders Count:'}</span>
                            <span className="font-mono text-xs font-black text-white">{stat.count}</span>
                          </div>
                          <div className="flex justify-between items-baseline text-[10.5px]">
                            <span className="text-zinc-400">{isAr ? 'مجموع القيمة:' : 'Total amount:'}</span>
                            <span className="font-mono text-[11px] font-black text-amber-300">{stat.totalRevenue.toFixed(3)} {isAr ? 'د.ب' : 'BHD'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="bg-[#1b124a]/20 border border-[#8b5cf6]/15 rounded-2xl p-8 text-center space-y-2">
                  <div className="text-3xl">📭</div>
                  <h5 className="font-extrabold text-white text-xs sm:text-sm">
                    {isAr ? 'لا توجد معاملات شراء حالية بعد' : 'No order logs recorded yet'}
                  </h5>
                  <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                    {isAr ? 'عندما يقوم أي عميل بإتمام الدفع والشراء في السلة، ستظهر تفاصيل فاتورته الكاملة وتفاصيل الموردين هنا تلقائياً!' : 'Real-time invoice papers will append here as users finalize their checkout baskets.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord: any) => (
                    <div 
                      key={ord.id} 
                      className={`p-4 bg-[#160e3d]/95 border ${
                        ord.status === 'pending' ? 'border-[#ff0080]/40 bg-[#ff0080]/5' : 'border-[#8b5cf6]/25'
                      } rounded-2xl space-y-4`}
                    >
                      {/* Top Header of the invoice card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#cbd5e1]/10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-2xl font-black text-amber-300 font-mono tracking-wide">{ord.id}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold capitalize ${
                              ord.status === 'pending' 
                                ? 'bg-[#ff0080]/20 text-[#ff75c9] border border-[#ff0080]/30'
                                : ord.status === 'preparing'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : ord.status === 'dispatched'
                                ? 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30 animate-pulse'
                                : 'bg-[#059669]/15 text-[#34d399] border border-[#059669]/30'
                            }`}>
                              {ord.status === 'pending' && (isAr ? '📝 قيد الانتظار' : 'Pending Request')}
                              {ord.status === 'preparing' && (isAr ? '👨‍🍳 قيد التحضير والتجهيز' : 'Preparing Order')}
                              {ord.status === 'dispatched' && (isAr ? '🚚 المندوب قيد التوصيل' : 'Out for Delivery')}
                              {ord.status === 'delivered' && (isAr ? '✅ تم التسليم بنجاح للعميل' : 'Delivered Successfully')}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-450 block font-mono">
                            {isAr ? 'تاريخ المعاملة:' : 'Timestamp:'} {new Date(ord.createdAt).toLocaleString(isAr ? 'ar-BH' : 'en-US')}
                          </span>
                        </div>

                        {/* Order Deletion Header Controls */}
                        <div className="flex items-center gap-2 w-full sm:w-auto self-end">
                          {orderToDeleteId === ord.id ? (
                            <div className="flex items-center gap-1 shrink-0 bg-[#12092e] p-1 border border-red-500/30 rounded-xl">
                              <button
                                onClick={() => handleDeleteOrder(ord.id)}
                                className="bg-red-650 hover:bg-red-700 text-white font-black px-2.5 py-1.5 rounded-xl text-[9.5px] cursor-pointer"
                              >
                                {isAr ? 'نعم!' : 'Delete'}
                              </button>
                              <button
                                onClick={() => setOrderToDeleteId(null)}
                                className="bg-zinc-750 text-zinc-300 font-bold px-2 py-1.5 rounded-xl text-[9px] cursor-pointer"
                              >
                                {isAr ? 'تراجع' : 'No'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setOrderToDeleteId(ord.id)}
                              className="bg-[#12092e] hover:bg-red-500/15 border border-red-500/35 text-red-400 font-black p-1.5 rounded-xl text-[10px] cursor-pointer"
                              title={isAr ? 'حذف الطلب نهائيا' : 'Delete Order ID'}
                            >
                              🗑️ {isAr ? 'مسح السجل' : 'Delete ID'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Customer info & Delivery Address details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#12092e]/60 p-3 rounded-2xl border border-[#8b5cf6]/15 text-xs text-white">
                        <div className="space-y-1.5 text-right">
                          <span className="text-[10px] text-zinc-400 block font-black border-b border-[#cbd5e1]/10 pb-0.5">{isAr ? '👤 العميل والاتصال:' : 'Client Contacts:'}</span>
                          <p className="font-extrabold">{isAr ? 'اسم الزبون:' : 'Customer Name:'} <span className="text-[#5df6be]">{ord.customerName}</span></p>
                          <p className="font-bold flex items-center gap-1.5 justify-end">
                            <a 
                              href={`https://wa.me/${ord.customerPhone.replace(/\D/g, '').length === 8 ? '973' + ord.customerPhone.replace(/\D/g, '') : ord.customerPhone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-amber-300 font-mono underline hover:text-white"
                            >
                              {ord.customerPhone} 🟢
                            </a>
                            <span>{isAr ? 'هاتف الاتصال:' : 'Call/WhatsApp:'}</span>
                          </p>
                        </div>

                        <div className="space-y-1.5 text-right">
                          <span className="text-[10px] text-zinc-400 block font-black border-b border-[#cbd5e1]/10 pb-0.5">{isAr ? '🚗 ميثاق التوصيل والخدمة:' : 'Fulfillment Coordinates:'}</span>
                          <p className="font-bold">
                            {isAr ? 'طريقة الاستلام:' : 'Deliver Method:'} 
                            <span className="text-[#d946ef] font-extrabold"> {ord.deliveryMethod === 'delivery' ? (isAr ? 'توصيل للمنزل 🚗' : 'Courier Home Delivery') : (isAr ? 'استلام من المحل مجاناً 🏪' : 'Free Shop Pickup')}</span>
                          </p>
                          {ord.deliveryMethod === 'delivery' && (
                            <p className="font-medium text-zinc-200">
                              {isAr ? 'عنوان التوصيل:' : 'Residential Address:'} <span className="font-semibold text-zinc-100">{ord.customerAddress}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Items details containing Confidential info */}
                      <div className="space-y-2 text-right">
                        <span className="text-[10px] text-zinc-450 block font-black">{isAr ? '📦 كشف المنتجات المطلوبة وتفاصيل المواقع السرية للمدير:' : 'Confidential Supplier and Product Routing Details:'}</span>
                        <div className="divide-y divide-[#8b5cf6]/20 bg-[#12092e]/40 rounded-2xl border border-[#8b5cf6]/15 overflow-hidden">
                          {ord.items.map((item: any, i: number) => (
                            <div key={item.productId || i} className="p-3 text-xs text-zinc-100 flex flex-col gap-1.5">
                              <div className="flex justify-between font-extrabold text-[#bfdbfe] flex-wrap gap-1">
                                <span className="font-mono text-[#5df6be]">{item.quantity} × {item.price.toFixed(3)} د.ب</span>
                                <span>{i + 1}. {isAr ? item.titleAr : item.titleEn}</span>
                              </div>
                              
                              {/* Confidential supplier information */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] bg-[#22072a]/45 p-2 rounded-xl border border-red-500/15 text-zinc-300 text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <span className="font-mono text-white bg-[#12092e]/85 border border-[#8b5cf6]/10 px-1.5 py-0.5 rounded-lg">{item.secretAddress || (isAr ? 'غير مدرج' : 'Unspecified')}</span>
                                  <span className="font-bold text-red-300">📍 {isAr ? 'موقع تخزين السلعة السري:' : 'Confidential Storage Point:'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 justify-end">
                                  {item.merchantPhone ? (
                                    <a 
                                      href={`https://wa.me/${item.merchantPhone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-[#bfdbfe] underline hover:text-white"
                                    >
                                      +{item.merchantPhone}
                                    </a>
                                  ) : (
                                    <span className="opacity-50 font-mono">{isAr ? 'غير متوفر' : 'Unavailable'}</span>
                                  )}
                                  <span className="font-bold text-red-300">📞 {isAr ? 'هاتف المورد/التاجر:' : 'Confidential Merchant cell:'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Visual Stepper & Instant Action Buttons */}
                      <div className="bg-[#12092e]/80 p-4 rounded-2xl border border-[#8b5cf6]/20 space-y-3.5 text-right font-sans" dir="rtl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pb-2 border-b border-[#cbd5e1]/5">
                          <span className="text-[11px] font-black text-[#5df6be] flex items-center gap-1.5">
                            <span>⚡</span>
                            <span>{isAr ? 'ترس التوجيه وتحديث حالة ومعالجة الطلب فوراً للعميل:' : 'Control & Broadcast Status to Client:'}</span>
                          </span>
                          <span className="text-[9px] text-[#cbd5e1]/40 font-mono">
                            {isAr ? 'اضغط لتحديث شاشة الزبون بالثواني' : 'Push state variables instantly'}
                          </span>
                        </div>

                        {/* Visual Step Stepper Status Grid Indicators */}
                        <div className="grid grid-cols-4 gap-1.5 text-[10px] sm:text-xs font-black text-center">
                          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${ord.status === 'pending' ? 'bg-[#ff0080]/15 text-[#ff75c9] border-[#ff0080]/40 ring-2 ring-[#ff0080]/20' : 'bg-[#12092e]/40 text-zinc-500 border-[#cbd5e1]/5'}`}>
                            <span className="text-sm">📝</span>
                            <span>{isAr ? 'قيد الانتظار' : 'Pending'}</span>
                          </div>
                          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${ord.status === 'preparing' ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 ring-2 ring-amber-500/25' : 'bg-[#12092e]/40 text-zinc-500 border-[#cbd5e1]/5'}`}>
                            <span className="text-sm">👨‍🍳</span>
                            <span>{isAr ? 'قيد التحضير' : 'Preparing'}</span>
                          </div>
                          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${ord.status === 'dispatched' ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 ring-2 ring-blue-500/25' : 'bg-[#12092e]/40 text-zinc-500 border-[#cbd5e1]/5'}`}>
                            <span className="text-sm">🚚</span>
                            <span>{isAr ? 'المندوب قيد التوصيل' : 'Dispatched'}</span>
                          </div>
                          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${ord.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 ring-2 ring-emerald-500/25' : 'bg-[#12092e]/40 text-zinc-500 border-[#cbd5e1]/5'}`}>
                            <span className="text-sm">✅</span>
                            <span>{isAr ? 'تم الاستلام' : 'Delivered'}</span>
                          </div>
                        </div>

                        {/* Action buttons prompt */}
                        <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                          
                          {/* Left quick selector dropdown for fallback/manual state */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9.5px] text-zinc-400 font-bold">{isAr ? 'تغيير مباشر مخصص:' : 'Set manually:'}</span>
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="text-[10px] bg-[#12092e] text-[#5df6be] font-black border border-[#8b5cf6]/30 px-2 py-1 rounded-lg outline-none cursor-pointer"
                            >
                              <option value="pending">📝 {isAr ? 'قيد الانتظار' : 'Pending'}</option>
                              <option value="preparing">👨‍🍳 {isAr ? 'قيد التجهيز' : 'Preparing'}</option>
                              <option value="dispatched">🚚 {isAr ? 'المندوب قيد التوصيل' : 'Dispatched'}</option>
                              <option value="delivered">✅ {isAr ? 'مستلم ومدفوع' : 'Delivered'}</option>
                            </select>
                          </div>

                          {/* Right big rapid action button */}
                          <div className="flex gap-2">
                            {ord.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                                className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-[11px] sm:text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-95 hover:shadow-amber-500/10"
                              >
                                <span>👨‍🍳</span>
                                <span className="underline decoration-black decoration-2">{isAr ? 'استلام وقبول الطلب وبدء التحضير' : 'Accept & Begin Preparing'}</span>
                              </button>
                            )}

                            {ord.status === 'preparing' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, 'dispatched')}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-[11px] sm:text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-95 hover:shadow-blue-500/10"
                              >
                                <span>🚚</span>
                                <span className="underline decoration-white decoration-2">{isAr ? 'تسليم الشحنة للمندوب وخروجه فوراً' : 'Hand to Courier Driver'}</span>
                              </button>
                            )}

                            {ord.status === 'dispatched' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] sm:text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-95 hover:shadow-emerald-500/10"
                              >
                                <span>✅</span>
                                <span className="underline decoration-white decoration-2">{isAr ? 'تأكيد التسليم للشحنة وتسكير الفاتورة' : 'Confirm Successful Delivery'}</span>
                              </button>
                            )}

                            {ord.status === 'delivered' && (
                              <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 rounded-xl text-[10.5px] text-[#5df6be] font-bold flex items-center gap-1.5">
                                <span>🏆</span>
                                <span>{isAr ? 'تم استلام وتوصيل هذا الطلب وتوثيق الدورة بنجاح!' : 'Order fully resolved and archived.'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subtotals card */}
                      <div className="bg-[#12092e]/90 p-3.5 rounded-xl border border-[#cbd5e1]/10 flex flex-wrap justify-between items-center text-xs gap-2">
                        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                          <span>{isAr ? 'مجموع المنتجات:' : 'Basket Subtotal:'} <span className="font-mono font-extrabold text-white">{ord.itemsTotal.toFixed(3)} د.ب</span></span>
                          {ord.deliveryMethod === 'delivery' && (
                            <span>{isAr ? 'رسوم التوصيل المدمج:' : 'Consolidated Shipping:'} <span className="font-mono font-extrabold text-white">{ord.shippingFee.toFixed(3)} د.ب</span></span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10.5px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                            {isAr ? 'الحساب الإجمالي المستحق:' : 'Grand Total Due:'}
                          </span>
                          <span className="font-mono font-black text-amber-300 text-sm sm:text-base pr-2 select-all tracking-wide">
                            {ord.grandTotal.toFixed(3)} {isAr ? 'د.ب' : 'BHD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
