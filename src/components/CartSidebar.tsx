import { Product, StoreSettings, Order, OrderItem, User } from '../types';
import { ShoppingBag, X, Trash2, Plus, Minus, Send, CheckCircle, Sparkles, ClipboardList, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { syncOrderToFirestore } from '../lib/firebaseStore';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  storeSettings: StoreSettings;
  lang: 'ar' | 'en';
  onLogin?: (user: User) => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  storeSettings,
  lang,
  onLogin
}: CartSidebarProps) {
  const isAr = lang === 'ar';
  
  // Checkout form details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [generatedOrderNo, setGeneratedOrderNo] = useState('');
  const [adminWpLink, setAdminWpLink] = useState('');
  const [clientWpLink, setClientWpLink] = useState('');
  const [finalClientPhone, setFinalClientPhone] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Verification OTP state right inside Sidebar (if customer is not logged in)
  const [sessionVerified, setSessionVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [showSimulatedSms, setShowSimulatedSms] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Sidebar Tabs Layout
  const [sidebarTab, setSidebarTab] = useState<'cart' | 'history'>('cart');
  const [myOrdersHistory, setMyOrdersHistory] = useState<Order[]>([]);
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualSearchError, setManualSearchError] = useState('');
  const [manualSearching, setManualSearching] = useState(false);

  // Sync / Prefill with local storage user session on mount/open
  useEffect(() => {
    if (isOpen) {
      const savedUser = localStorage.getItem('sl_user_session');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.phone) {
            setCustomerPhone(parsed.phone);
            setCustomerName(parsed.name || '');
            setSessionVerified(true);
          }
        } catch (_) {}
      } else {
        // Not logged in. Do not reset if already typed by user
      }
    }
  }, [isOpen]);

  // Sync my orders list to check statuses on server
  useEffect(() => {
    if (isOpen) {
      const savedMy = localStorage.getItem('sl_my_orders');
      if (savedMy) {
        try {
          const myOrders: Order[] = JSON.parse(savedMy);
          setMyOrdersHistory(myOrders);

          // Poll orders to see active status
          Promise.all(
            myOrders.map(async (myOrd) => {
              try {
                const res = await fetch(`/api/orders/${myOrd.id}`);
                if (res.ok) {
                  return await res.json();
                }
              } catch (_) {}
              return null;
            })
          ).then((srvOrders) => {
            let hasChange = false;
            const synced = myOrders.map((myOrd) => {
              const srvOrd = srvOrders.find((s) => s && s.id === myOrd.id);
              if (srvOrd && srvOrd.status !== myOrd.status) {
                hasChange = true;
                return { ...myOrd, status: srvOrd.status };
              }
              const savedAll = localStorage.getItem('sl_all_orders');
              if (savedAll) {
                try {
                  const allOrders: Order[] = JSON.parse(savedAll);
                  const masterOrd = allOrders.find(o => o.id === myOrd.id);
                  if (masterOrd && masterOrd.status !== myOrd.status) {
                    hasChange = true;
                    return { ...myOrd, status: masterOrd.status };
                  }
                } catch (_) {}
              }
              return myOrd;
            });

            if (hasChange) {
              localStorage.setItem('sl_my_orders', JSON.stringify(synced));
              setMyOrdersHistory(synced);
            }
          });
        } catch (e) {
          console.error("Failed to sync history statuses", e);
        }
      }
    }
  }, [isOpen, checkoutComplete, sidebarTab]);

  // Polling every 7 seconds for tracked orders if active
  useEffect(() => {
    if (isOpen && sidebarTab === 'history' && myOrdersHistory.length > 0) {
      const interval = setInterval(() => {
        Promise.all(
          myOrdersHistory.map(async (myOrd) => {
            try {
              const res = await fetch(`/api/orders/${myOrd.id}`);
              if (res.ok) {
                return await res.json();
              }
            } catch (_) {}
            return null;
          })
        ).then((srvOrders) => {
          let hasChange = false;
          const synced = myOrdersHistory.map((myOrd) => {
            const srvOrd = srvOrders.find((s) => s && s.id === myOrd.id);
            if (srvOrd && srvOrd.status !== myOrd.status) {
              hasChange = true;
              return { ...myOrd, status: srvOrd.status };
            }
            return myOrd;
          });
          if (hasChange) {
            localStorage.setItem('sl_my_orders', JSON.stringify(synced));
            setMyOrdersHistory(synced);
          }
        });
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sidebarTab, myOrdersHistory]);

  if (!isOpen) return null;

  // Items sum
  const itemsTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Consolidation Logic helper
  const linkedGroupsSet = new Set<string>();
  cartItems.forEach(item => {
    if (item.product.deliveryGroupId) {
      linkedGroupsSet.add(item.product.deliveryGroupId);
    }
  });

  const baseFee = storeSettings.deliveryFee !== undefined ? storeSettings.deliveryFee : 2;
  
  let unlinkedBatchCount = 0;
  cartItems.forEach(item => {
    if (!item.product.deliveryGroupId) {
      unlinkedBatchCount += 1;
    }
  });
  
  const calculatedShipping = deliveryMethod === 'pickup'
    ? 0
    : (linkedGroupsSet.size * baseFee) + (unlinkedBatchCount * baseFee);

  const grandTotal = itemsTotal + calculatedShipping;

  // Clean phone number for WhatsApp redirects
  const getCleanPhoneForWa = (phone: string) => {
    let clean = phone.replace(/\s+/g, '').replace(/[+\-()]/g, '');
    if (clean.startsWith('00')) {
      clean = clean.substring(2);
    }
    if (clean.length === 8) {
      clean = '973' + clean;
    }
    return clean;
  };

  // Trigger simulated Inline SMS requesting
  const handleRequestInlineOtp = () => {
    setOtpError('');
    const phoneClean = customerPhone.trim();
    const nameClean = customerName.trim();

    if (!nameClean) {
      alert(isAr ? '⚠️ يرجى إدخال اسم العميل أولاً قبل التحقق.' : '⚠️ Enter name before phone verification.');
      return;
    }
    if (!phoneClean || phoneClean.length < 6) {
      alert(isAr ? '⚠️ يرجى إدخال رقم هاتف صحيح أولاً.' : '⚠️ Enter a valid phone number before verification.');
      return;
    }

    setVerifyingPhone(true);
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setVerifyingPhone(false);
      setShowSimulatedSms(false);
    }, 800);
  };

  // Verify Inline OTP Code
  const handleVerifyInlineOtp = () => {
    setOtpError('');
    if (enteredOtp === generatedOtp) {
      setSessionVerified(true);
      setOtpSent(false);
      
      // Auto register/sign-in this session
      const mockUser = {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        isVerified: true,
        isAdmin: false
      };
      localStorage.setItem('sl_user_session', JSON.stringify(mockUser));
      alert(isAr ? '✅ تم التحقق بنجاح وتوثيق رقم هاتفك! يمكنك إرسال الطلب الآن.' : '✅ Verified successfully! Your phone number is authenticated.');
    } else {
      setOtpError(isAr ? '❌ الرمز المدخل غير صحيح! راجع النافذة العلوية.' : '❌ Mismatched code! Try again.');
    }
  };

  // Checkout order submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      alert(isAr ? 'يرجى كتابة الاسم ورقم الهاتف للمتابعة' : 'Please provide your name and phone number');
      return;
    }

    // Automatically verify the session & log in during checkout if not already authenticated!
    if (!sessionVerified) {
      const mockUser: User = {
        name: trimmedName,
        phone: trimmedPhone,
        isVerified: true,
        isAdmin: false
      };
      
      // Save newly authenticated customer to general local ledger
      const existingRaw = localStorage.getItem('sl_registered_customers') || '[]';
      let existingList = [];
      try {
        existingList = JSON.parse(existingRaw);
      } catch (_) {}
      
      const isNew = !existingList.some((c: any) => c.phone === mockUser.phone);
      if (isNew) {
        existingList.push({
          name: mockUser.name,
          phone: mockUser.phone,
          email: '',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('sl_registered_customers', JSON.stringify(existingList));
      }

      localStorage.setItem('sl_user_session', JSON.stringify(mockUser));
      setSessionVerified(true);
      if (onLogin) {
        onLogin(mockUser);
      }
    }

    if (deliveryMethod === 'delivery' && !customerAddress.trim()) {
      alert(isAr ? 'يرجى كتابة عنوان التوصيل بالتفصيل' : 'Please provide your delivery address');
      return;
    }

    // Generate Order ID
    const currentCounter = localStorage.getItem('sl_order_counter');
    let nextNum = 1;
    if (currentCounter) {
      try {
        const parsed = parseInt(currentCounter, 10);
        if (!isNaN(parsed) && parsed > 0) {
          nextNum = parsed + 1;
        }
      } catch (_) {}
    }
    localStorage.setItem('sl_order_counter', nextNum.toString());
    const orderNo = `L&S-${nextNum}`;
    setGeneratedOrderNo(orderNo);

    // Format Messages
    let allProds: Product[] = [];
    try {
      const savedProds = localStorage.getItem('sl_products_list');
      if (savedProds) {
        allProds = JSON.parse(savedProds);
      }
    } catch (_) {}

    // Customer confirmation
    let custMsg = `🎉 *شكراً لطلبكم من متجر S&L المتميز! طلبك رقم: ${orderNo}* 🎉\n`;
    custMsg += `لقد تم تسجيل واستلام طلبك بنجاح.\n`;
    custMsg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    custMsg += `👤 *بيانات طلبك:*\n`;
    custMsg += `  • الاسم: ${customerName}\n`;
    custMsg += `  • الهاتف: ${customerPhone}\n`;
    custMsg += `  • طريقة الاستلام: ${deliveryMethod === 'delivery' ? 'توصيل للمنزل 🚗' : 'الاستلام من المحل بدون توصيل 🏪'}\n`;
    if (deliveryMethod === 'delivery') {
      custMsg += `  • العنوان: ${customerAddress}\n`;
    }

    custMsg += `\n📦 *الطلبات المشتراة:*\n`;
    cartItems.forEach((item, index) => {
      const title = isAr ? item.product.title : (item.product.titleEn || item.product.title);
      const matched = allProds.find(p => p.id === item.product.id);
      const itemCode = matched?.code || item.product.code || String(index + 1).padStart(2, '0');
      custMsg += `${index + 1}. *${title}*  [كود: ${itemCode}]\n`;
      custMsg += `   الكمية: ${item.quantity} × السعر: ${item.product.price} د.ب \n`;
    });

    custMsg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    custMsg += `💰 *السعر والملخص المالي:*\n`;
    custMsg += `  • السعر الإجمالي للمنتجات: ${parseFloat(itemsTotal.toFixed(3))} د.ب\n`;
    if (deliveryMethod === 'delivery') {
      custMsg += `  • رسوم التوصيل المضافة: ${parseFloat(calculatedShipping.toFixed(3))} د.ب\n`;
    } else {
      custMsg += `  • التوصيل: بدون توصيل (استلام مجاني من المحل) 🏪\n`;
    }
    custMsg += `  • *المجموع الإجمالي النهائي: ${parseFloat(grandTotal.toFixed(3))} د.ب*\n\n`;
    
    if (deliveryMethod === 'pickup') {
      custMsg += `📍 *تعليمات استلام طلبك من المحل:* \n${isAr ? storeSettings.socials.pickupInstructionsAr : storeSettings.socials.pickupInstructionsEn}\n\n`;
    }
    custMsg += `💬 نسعد بخدمتكم دائماً في متجر S&L البحريني! ✨`;

    // Admin message config
    let adminMsg = `👑 *طلب إداري جديد - رقم الطلب: ${orderNo}* 👑\n`;
    adminMsg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    adminMsg += `👤 *بيانات العميل الموثق:*\n`;
    adminMsg += `  • الاسم: ${customerName}\n`;
    adminMsg += `  • الهاتف: ${customerPhone} (جوال مؤكد بالرمز OTP)\n`;
    adminMsg += `  • طريقة الاستلام: ${deliveryMethod === 'delivery' ? 'توصيل للمنزل 🚗' : 'الاستلام من المحل بدون توصيل 🏪'}\n`;
    if (deliveryMethod === 'delivery') {
      adminMsg += `  • العنوان: ${customerAddress}\n`;
    }
    
    adminMsg += `\n📦 *كشف الأصناف والمستودعات الإدارية:* \n`;
    cartItems.forEach((item, index) => {
      const title = isAr ? item.product.title : (item.product.titleEn || item.product.title);
      const matched = allProds.find(p => p.id === item.product.id);
      const itemCode = matched?.code || item.product.code || String(index + 1).padStart(2, '0');
      adminMsg += `${index + 1}. *${title}*  [كود: ${itemCode}]\n`;
      adminMsg += `   الكمية: ${item.quantity} × السعر: ${item.product.price} د.ب\n`;
      if (item.product.deliveryGroupId) {
        adminMsg += `   📦 مستودع الدمج: ${item.product.deliveryGroupId}\n`;
      }
      if (item.product.secretAddress) {
        adminMsg += `   🏠 *الموقع السري:* ${item.product.secretAddress}\n`;
      }
      if (item.product.merchantPhone) {
        adminMsg += `   👤 *هاتف التاجر المورد:* +${item.product.merchantPhone}\n`;
      }
    });

    const newOrder: Order = {
      id: orderNo,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: deliveryMethod === 'delivery' ? customerAddress.trim() : '',
      deliveryMethod: deliveryMethod,
      items: cartItems.map(item => ({
        productId: item.product.id,
        titleAr: item.product.title,
        titleEn: item.product.titleEn || item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        merchantPhone: item.product.merchantPhone,
        secretAddress: item.product.secretAddress,
      })),
      itemsTotal: itemsTotal,
      shippingFee: calculatedShipping,
      grandTotal: grandTotal,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Store orders
    const existingOrdersRaw = localStorage.getItem('sl_all_orders');
    let existingOrders: Order[] = [];
    if (existingOrdersRaw) {
      try { existingOrders = JSON.parse(existingOrdersRaw); } catch (_) {}
    }
    existingOrders.unshift(newOrder);
    localStorage.setItem('sl_all_orders', JSON.stringify(existingOrders));

    // Client history
    const existingMyOrdersRaw = localStorage.getItem('sl_my_orders');
    let existingMyOrders: Order[] = [];
    if (existingMyOrdersRaw) {
      try { existingMyOrders = JSON.parse(existingMyOrdersRaw); } catch (_) {}
    }
    existingMyOrders.unshift(newOrder);
    localStorage.setItem('sl_my_orders', JSON.stringify(existingMyOrders));

    // APIs
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.error(err));

    syncOrderToFirestore(newOrder).catch(err => console.error(err));

    // WhatsApp forwarding Setup
    let rawClientPhone = customerPhone.replace(/\D/g, '');
    if (rawClientPhone.length === 8) {
      rawClientPhone = '973' + rawClientPhone;
    }
    setFinalClientPhone(rawClientPhone);

    const storePhone = '97337120456';
    const finalClientUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(custMsg)}`;
    const adminWhatsAppNum = '97366603354';
    const finalAdminUrl = `https://wa.me/${adminWhatsAppNum}?text=${encodeURIComponent(adminMsg)}`;
    
    setAdminWpLink(finalAdminUrl);
    setClientWpLink(finalClientUrl);
    setCompletedOrder(newOrder);
    setCheckoutComplete(true);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderId.trim()) return;
    setManualSearching(true);
    setManualSearchError('');

    try {
      const sanitizedId = manualOrderId.trim().toUpperCase();
      const res = await fetch(`/api/orders/${sanitizedId}`);
      if (res.ok) {
        const foundOrder = await res.json();
        
        const savedMy = localStorage.getItem('sl_my_orders');
        let currentMy: Order[] = [];
        if (savedMy) {
          try { currentMy = JSON.parse(savedMy); } catch (_) {}
        }
        
        const filtered = currentMy.filter(o => o.id !== foundOrder.id);
        filtered.unshift(foundOrder);
        
        localStorage.setItem('sl_my_orders', JSON.stringify(filtered));
        setMyOrdersHistory(filtered);
        setManualOrderId('');
        setManualSearchError(isAr ? '🎉 تم العثور على طلبك وإضافته لقائمة التتبع!' : '🎉 Order found and appended to tracking feed!');
        
        setTimeout(() => setManualSearchError(''), 4000);
      } else {
        setManualSearchError(isAr ? '❌ لم نجد أي طلب بهذا الرقم، يرجى التحقق وإعادة المحاولة.' : '❌ Order not found. Check and retry.');
      }
    } catch (err) {
      setManualSearchError(isAr ? '⚠️ عطلاً في الاتصال بالسيرفر حالياً.' : '⚠️ Connection error.');
    } finally {
      setManualSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Overlay background black */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Cart Content - PURE LIGHT THEME SLATE */}
      <div 
        className="relative w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl border-l border-slate-200 animate-in slide-in-from-left md:slide-in-from-right duration-250 text-slate-800"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header toolbar with segmented tabs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-600">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">S&L BAHRAIN PREMIUM BAG</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setSidebarTab('cart'); }}
              className={`py-2 rounded-xl font-black text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition select-none cursor-pointer ${
                sidebarTab === 'cart'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/30'
              }`}
            >
              <ShoppingBag size={12} />
              <span>{isAr ? 'سلتي الحالية' : 'Active Bag'}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono ${sidebarTab === 'cart' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {cartItems.length}
              </span>
            </button>
            <button
              onClick={() => { setSidebarTab('history'); }}
              className={`py-2 rounded-xl font-black text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition select-none cursor-pointer ${
                sidebarTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/30'
              }`}
            >
              <ClipboardList size={12} />
              <span>{isAr ? 'متابعة وتتبع طلباتي' : 'Track Orders'}</span>
              {myOrdersHistory.length > 0 && (
                <span className="bg-white/25 text-white text-[9.5px] font-mono font-black px-1.5 rounded-full">
                  {myOrdersHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic content depending on currently active sidebarTab */}
        {sidebarTab === 'history' ? (
          /* Real-time Order Tracking Screen for Customers */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            
            {/* Manual Order Tracker by ID Bar */}
            <form onSubmit={handleManualSearch} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2 text-right" dir="rtl">
              <label className="text-[11px] font-black text-slate-800 block">
                🔍 {isAr ? 'استعلام وتتبع يدوي لأي رقم طلب خارجي:' : 'Manual Order Status Lookup by Reference ID:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  placeholder={isAr ? 'مثال: SL4823' : 'e.g. SL4823'}
                  className="flex-1 text-center bg-slate-50 text-indigo-700 font-mono font-black text-xs p-2 rounded-xl outline-none border border-slate-200 uppercase"
                />
                <button
                  type="submit"
                  disabled={manualSearching || !manualOrderId.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-4 rounded-xl transition active:scale-95 shrink-0 cursor-pointer"
                >
                  {manualSearching ? '...' : (isAr ? 'تتبع ⚡' : 'Track')}
                </button>
              </div>
              {manualSearchError && (
                <p className={`text-[10px] text-center font-semibold leading-relaxed ${manualSearchError.includes('🎉') ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {manualSearchError}
                </p>
              )}
            </form>

            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-[11px] font-black text-slate-800 block">📦 {isAr ? 'طلباتك السابقة قيد المتابعة والتجهيز:' : 'Your Tracked Order Records:'}</span>
              {myOrdersHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(isAr ? 'هل أنت متأكد من مسح تاريخ تتبع طلباتك من هاتفك؟' : 'Clear tracked history from this browser?')) {
                      setMyOrdersHistory([]);
                      localStorage.setItem('sl_my_orders', '[]');
                    }
                  }}
                  className="text-[9px] text-red-600 bg-red-50 px-2 py-0.5 rounded-md hover:bg-red-100 border border-red-200 cursor-pointer"
                >
                  {isAr ? 'مسح تتبع الهستوري' : 'Clear History'}
                </button>
              )}
            </div>

            {myOrdersHistory.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2 mt-4">
                <div className="text-3xl">🗳️</div>
                <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                  {isAr ? 'لا توجد طلبات سابقة لتتبعها' : 'No order logs recorded'}
                </h5>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {isAr ? 'بمجرد تسجيلك للطلب الأول من السلة المدمجة، ستظهر شاشة تتبع حالتها المباشرة من الفرز للشحن فوراً هنا!' : 'A live progress tracker will append here as you authorize your purchases.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrdersHistory.map((ord) => (
                  <div key={ord.id} className="p-4.5 bg-white rounded-2xl border border-slate-200 space-y-3.5 shadow-xs">
                    {/* Header receipt code */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 font-mono tracking-wider">{ord.id}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          {new Date(ord.createdAt).toLocaleDateString(isAr ? 'ar-BH' : 'en-US')} - {new Date(ord.createdAt).toLocaleTimeString(isAr ? 'ar-BH' : 'en-US')}
                        </span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                        ord.status === 'pending' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                          : ord.status === 'preparing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : ord.status === 'dispatched'
                          ? 'bg-blue-50 text-blue-600 border border-blue-200 animate-bounce'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                      }`}>
                        {ord.status === 'pending' && (isAr ? '📝 في انتظار الفرز' : 'Pending Request')}
                        {ord.status === 'preparing' && (isAr ? '👨‍🍳 يجري التجهيز والترتيب' : 'Preparing')}
                        {ord.status === 'dispatched' && (isAr ? '🚚 المندوب قيد التوصيل' : 'Out for Delivery')}
                        {ord.status === 'delivered' && (isAr ? '✅ تم التسليم بنجاح لكم' : 'Delivered')}
                      </span>
                    </div>

                    {/* Items inside tracking list */}
                    <div className="space-y-1.5 text-right">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[10.5px] font-medium border-b border-slate-50 pb-1">
                          <span className="font-mono text-slate-500">{it.quantity} × {parseFloat(it.price.toFixed(3))} د.ب</span>
                          <span className="text-slate-800">{isAr ? it.titleAr : it.titleEn}</span>
                        </div>
                      ))}
                    </div>

                    {/* Service coordinates and billing totals */}
                    <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] flex justify-between items-center text-slate-600 border border-slate-200 text-right">
                      <div className="text-left font-mono">
                        {isAr ? 'المجموع النهائي:' : 'Total due:'} 
                        <span className="font-black text-indigo-600 text-xs pr-1 font-mono">{parseFloat(ord.grandTotal.toFixed(3))} د.ب</span>
                      </div>
                      <div>
                        {isAr ? 'الاستلام:' : 'Method:'} 
                        <span className="text-slate-800 font-extrabold font-sans"> {ord.deliveryMethod === 'delivery' ? (isAr ? 'توصيل للمنزل 🚗' : 'Courier delivery') : (isAr ? 'استلام من المحل 🏪' : 'Pickup')}</span>
                      </div>
                    </div>

                    {/* Interactive Vertical Timeline Stepper */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-3" dir="rtl">
                      <span className="text-[9px] font-black text-indigo-700 block text-right border-b border-slate-100 pb-1 uppercase tracking-wider">
                        {isAr ? '📋 تسلسل ومراحل تجهيز طلبك:' : '📋 Live Action Procedures Tracking:'}
                      </span>
                      
                      <div className="relative pr-3 border-r border-slate-200 space-y-4">
                        {/* Step 1: Placed / Created */}
                        <div className="relative">
                          <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">✓</span>
                          <div className="text-right pr-2">
                            <h6 className="text-[10.5px] font-black text-emerald-600">
                              {isAr ? 'تم إرسال وحفظ الطلب بنجاح' : 'Order Placed Successfully'}
                            </h6>
                            <p className="text-[9px] text-slate-555 leading-normal">
                              {isAr 
                                ? `تم تسجيل طلبك وحفظه على المتجر برقم التتبع الفردي #${ord.id}.` 
                                : `Registered inside database as individual tracking ID #${ord.id}.`}
                            </p>
                          </div>
                        </div>

                        {/* Step 2: Accepted / Received by Admin */}
                        <div className="relative">
                          {['preparing', 'dispatched', 'delivered'].includes(ord.status) ? (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">✓</span>
                          ) : (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white animate-pulse">⏳</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${['preparing', 'dispatched', 'delivered'].includes(ord.status) ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isAr ? 'استقبال وقبول الطلب من الإدارة' : 'Accepted & Received by Store'}
                            </h6>
                            <p className="text-[9px] text-slate-555 leading-normal">
                              {['preparing', 'dispatched', 'delivered'].includes(ord.status) ? (
                                isAr ? '✓ استلم المشرف طلبك رسمياً وجاري مراجعته والتحقق منه.' : '✓ Staff accepted and confirmed your transaction receipt.'
                              ) : (
                                isAr ? 'في انتظار استقبال وقبول المشرف لتنشيط بدء التجهيز.' : 'Awaiting manual manager check was submitted.'
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Step 3: Sourcing / Preparing */}
                        <div className="relative">
                          {['dispatched', 'delivered'].includes(ord.status) ? (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">✓</span>
                          ) : ord.status === 'preparing' ? (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-indigo-600 flex items-center justify-center text-[7px] text-white animate-pulse">⚡</span>
                          ) : (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-slate-300 flex items-center justify-center text-[8px] text-slate-400">⚪</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${['dispatched', 'delivered'].includes(ord.status) ? 'text-emerald-600' : ord.status === 'preparing' ? 'text-indigo-600' : 'text-slate-400'}`}>
                              {isAr ? 'فرز الأصناف وتجهيز الشحنة' : 'Sorting & Protective Packaging'}
                            </h6>
                            <p className="text-[9px] text-slate-555 leading-normal">
                              {['dispatched', 'delivered'].includes(ord.status) ? (
                                isAr ? '✓ تم تجميع جميع السلع وتغليفها وضمها لشحنة موحدة.' : '✓ All goods packed and routed for pickup.'
                              ) : ord.status === 'preparing' ? (
                                isAr ? '⚡ يجري الآن سحب المنتجات من الرفوف في المستودعات وتنسيق شحنها.' : '⚡ Staff is currently gathering products from designated shelves.'
                              ) : (
                                isAr ? 'في انتظار دور تجميع وتغليف طرد المنتجات.' : 'Will launch as soon as the manager accepts.'
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Dispatch Courier */}
                        <div className="relative">
                          {ord.status === 'delivered' ? (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">✓</span>
                          ) : ord.status === 'dispatched' ? (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white">🚚</span>
                          ) : (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-slate-300 flex items-center justify-center text-[8px] text-slate-400">⚪</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${ord.status === 'delivered' ? 'text-emerald-600' : ord.status === 'dispatched' ? 'text-blue-555' : 'text-slate-400'}`}>
                              {isAr ? 'المندوب قيد التوصيل للعنوان' : 'Dispatched with Express Courier'}
                            </h6>
                            <p className="text-[9px] text-slate-555 leading-normal">
                              {ord.status === 'delivered' ? (
                                isAr ? '✓ غادرت الشحنة بنجاح وتم الاستلام.' : '✓ S&L package delivered successfully.'
                              ) : ord.status === 'dispatched' ? (
                                isAr ? '🚚 الشحنة مع المندوب الآن ومقيدة للتوصيل فوراً لموقعك ومسكنك!' : '🚚 Courier driver received the package & is now en route!'
                              ) : (
                                isAr ? 'سيتم التسليم للمندوب فور الانتهاء من التغليف.' : 'Awaiting dispatch assignment.'
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Step 5: Delivered Successfully */}
                        <div className="relative pb-0.5">
                          {ord.status === 'delivered' ? (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">✓</span>
                          ) : (
                            <span className="absolute -right-[17px] top-1 w-3 h-3 rounded-full bg-slate-300 flex items-center justify-center text-[8px] text-slate-400">⚪</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${ord.status === 'delivered' ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {isAr ? 'تم استلام وتوصيل طلبك بالكامل 🎉' : 'Delivered & Completed 🎉'}
                            </h6>
                            <p className="text-[9px] text-slate-555 leading-normal">
                              {ord.status === 'delivered' ? (
                                isAr ? '🎉 مبروك! تم تسليم طلبكم بنجاح وجاهز لاستعماله، نسعد جداً بخدمتكم في متجرنا!' : '🎉 Package arrived! Thank you for choosing S&L Store Bahrain.'
                              ) : (
                                isAr ? 'في انتظار وصول الشحنة للموقع للتوقيع والتسديد.' : 'Awaiting courier drop-off.'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : checkoutComplete ? (
          /* Quiet Checkout Successful view - Elegant Invoice with no WhatsApp button or banner */
          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-center flex flex-col justify-between bg-slate-50" dir="rtl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shrink-0 animate-scale-in">
                <CheckCircle size={24} />
              </div>
              
              <div className="space-y-1">
                <span className="text-[12px] text-emerald-650 uppercase tracking-widest block font-black">
                  {isAr ? '✓ تم تسجيل طلبك بنجاح!' : '✓ ORDER PLACED SUCCESSFULLY!'}
                </span>
                <span className="text-[10px] text-slate-500 block pb-1 border-b border-slate-200">
                  {isAr ? 'تم استلام وتوثيق طلبك، شكراً لتعاملك معنا!' : 'Your order has been recorded successfully!'}
                </span>
              </div>

              {/* Beautiful Visual Invoice Card */}
              <div className="relative bg-white border border-slate-200 rounded-3xl p-5 text-right space-y-3.5 shadow-md select-none" dir="rtl">
                {/* Invoice Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{isAr ? 'فاتورة شراء موثقة' : 'Receipt / Invoice'}</h4>
                    <span className="text-[9px] text-slate-450 font-mono">
                      {completedOrder ? new Date(completedOrder.createdAt).toLocaleString('ar-BH') : new Date().toLocaleString('ar-BH')}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] text-indigo-600 block uppercase font-bold">{isAr ? 'رقم الطلب' : 'ORDER ID'}</span>
                    <span className="text-sm font-black text-slate-900 font-mono tracking-wider">
                      {completedOrder ? completedOrder.id : generatedOrderNo}
                    </span>
                  </div>
                </div>

                {/* Customer Info segment */}
                <div className="text-[10.5px] space-y-1.5 text-slate-600 border-b border-dashed border-slate-200 pb-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-450">{isAr ? 'اسم العميل:' : 'Customer Name:'}</span>
                    <span className="font-extrabold text-slate-800">{completedOrder ? completedOrder.customerName : customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">{isAr ? 'هاتف التواصل:' : 'Phone Number:'}</span>
                    <span className="font-bold text-slate-800 font-mono" dir="ltr">{completedOrder ? completedOrder.customerPhone : customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">{isAr ? 'طريقة الاستلام:' : 'Delivery Plan:'}</span>
                    <span className="font-bold text-slate-800">
                      {completedOrder?.deliveryMethod === 'delivery' ? (isAr ? 'توصيل للمنزل 🚗' : 'Home Delivery 🚗') : (isAr ? 'استلام من المحل 🏪' : 'Pickup at Store 🏪')}
                    </span>
                  </div>
                  {completedOrder?.deliveryMethod === 'delivery' && (completedOrder.customerAddress || customerAddress) && (
                    <div className="flex flex-col text-right pt-0.5">
                      <span className="text-slate-450 mb-0.5">{isAr ? 'العنوان لعنوانك المعتمد:' : 'Delivery Address:'}</span>
                      <span className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[9.5px] leading-relaxed text-slate-600">
                        {completedOrder ? completedOrder.customerAddress : customerAddress}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items loop list */}
                <div className="space-y-2 border-b border-dashed border-slate-200 pb-2.5">
                  <span className="text-[9px] font-black text-slate-800 uppercase block">{isAr ? 'تفاصيل السلع المشتراة:' : 'Billed Items:'}</span>
                  <div className="max-h-[145px] overflow-y-auto space-y-1.5 pr-0.5">
                    {(completedOrder ? completedOrder.items : cartItems.map(c => ({
                      titleAr: c.product.title,
                      titleEn: c.product.titleEn || c.product.title,
                      price: c.product.price,
                      quantity: c.quantity
                    }))).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] leading-tight">
                        <div className="text-left font-mono text-slate-550">
                          <span>{item.quantity} × {parseFloat(item.price.toFixed(3))}</span>
                          <span className="text-[9px] mr-1">د.ب</span>
                        </div>
                        <span className="text-slate-800 truncate max-w-[190px] font-medium text-right">
                          {isAr ? item.titleAr : (item.titleEn || item.titleAr)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="space-y-1 text-[11px] text-slate-650">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-450">{isAr ? 'إجمالي قيمة المنتجات:' : 'Subtotal:'}</span>
                    <span className="font-mono">{parseFloat((completedOrder ? completedOrder.itemsTotal : itemsTotal).toFixed(3))} د.ب</span>
                  </div>
                  
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-450">{isAr ? 'تكاليف التوصيل المضافة:' : 'Delivery Fee:'}</span>
                    <span className="font-mono">
                      {completedOrder 
                        ? (completedOrder.shippingFee === 0 ? (isAr ? 'استلام مجاني' : '0 د.ب') : `${parseFloat(completedOrder.shippingFee.toFixed(3))} د.ب`)
                        : (calculatedShipping === 0 ? (isAr ? 'استلام مجاني' : '0 د.ب') : `${parseFloat(calculatedShipping.toFixed(3))} د.ب`)
                      }
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span className="text-slate-700">{isAr ? 'المجموع المستحق الكلي:' : 'Total Amount:'}</span>
                    <span className="font-mono text-indigo-600 text-[13px] tracking-wide">
                      {parseFloat((completedOrder ? completedOrder.grandTotal : grandTotal).toFixed(3))} د.ب
                    </span>
                  </div>
                </div>

                {/* Certified Stamp */}
                <div className="absolute right-3.5 bottom-12 opacity-[0.12] select-none pointer-events-none transform -rotate-12 border-4 border-emerald-600 text-emerald-600 font-black text-center px-4 py-1.5 rounded-xl uppercase text-xs tracking-wider">
                  S&L APPROVED
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onClearCart();
                  setSidebarTab('history');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-3 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
              >
                <span>📦</span>
                <span>{isAr ? 'متابعة وتتبع حالة هذا الطلب الآن' : 'Track Order Status Now'}</span>
              </button>

              <button
                onClick={() => {
                  onClearCart();
                  setCustomerName('');
                  setCustomerPhone('');
                  setCustomerAddress('');
                  setCompletedOrder(null);
                  setCheckoutComplete(false);
                  setSidebarTab('cart');
                  onClose();
                }}
                className="w-full bg-slate-200/80 hover:bg-slate-200 text-slate-700 font-extrabold py-3 rounded-xl text-xs transition cursor-pointer border border-slate-300"
              >
                🧹 {isAr ? 'العودة للمتجر وبدء شراء جديد' : 'Return to Shop & Start Over'}
              </button>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty state */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50">
            <div className="text-4xl">🛒</div>
            <h4 className="font-black text-slate-800 text-xs sm:text-sm">
              {isAr ? 'سلّتك فارغة تماماً' : 'Your cart is empty'}
            </h4>
            <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
              {isAr ? 'ابدأ تصفح أقسام متجر S&L البحريني واملأ سلّتك بأجمل المنتجات والخصومات التجميعية المدمجة!' : 'Browse S&L sections and add products to get combined local shipping!'}
            </p>
          </div>
        ) : (
          /* Products List inside cart */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            
            {/* Shipping promotion badge */}
            {calculatedShipping < (cartItems.length * baseFee) && deliveryMethod === 'delivery' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-right flex items-center gap-2 text-emerald-800">
                <Sparkles size={14} className="shrink-0 text-emerald-600 animate-pulse" />
                <span className="text-[10.5px] font-black leading-snug">
                  {isAr 
                    ? `وفرت شحن مجاري! تم دمج شحن بعض المنتجات نظراً لوجودهم في نفس المستودع.` 
                    : `Group benefits active! Consolidated shipping applied to items in same location.`}
                </span>
              </div>
            )}

            {/* Items list */}
            <div className="space-y-3">
              {cartItems.map((item) => {
                const title = isAr ? item.product.title : (item.product.titleEn || item.product.title);
                const hasGroup = !!item.product.deliveryGroupId;
                
                return (
                  <div 
                    key={item.product.id}
                    className="bg-white border border-slate-200/80 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-slate-350 transition text-right"
                  >
                    <img 
                      src={item.product.image} 
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-100"
                    />

                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="text-xs font-black text-slate-900 truncate">{title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {parseFloat(item.product.price.toFixed(3))} BHD {isAr ? 'د.ب' : 'BHD'}
                      </p>
                      
                      {/* Bundle info tag */}
                      {hasGroup ? (
                        <span className="inline-block text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-sm mt-1">
                          📦 {isAr ? 'مربوط تجميعياً' : 'Consolidated Group'}
                        </span>
                      ) : (
                        <span className="inline-block text-[8.5px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm mt-1">
                          🚚 {isAr ? 'شحن مستقل' : 'Independent'}
                        </span>
                      )}
                    </div>

                    {/* Numeric control triggers */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 hover:text-slate-950 text-slate-500 cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-800 font-mono">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 hover:text-slate-950 text-slate-500 cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Remove completely */}
                      <button
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={10} />
                        <span className="scale-90">{isAr ? 'إزالة' : 'Remove'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Receipt Summary Calculation plate */}
            <div className="bg-white border border-slate-250 rounded-2xl p-4.5 space-y-3 shadow-xs">
              <h4 className="font-extrabold text-[12px] text-slate-950 border-b border-slate-100 pb-2 flex items-center gap-1 justify-end">
                <span>{isAr ? 'الملخص والدفع' : 'Order Financial Summary'}</span>
                <span>📊</span>
              </h4>

              <div className="space-y-2 text-xs">
                {/* Method selector buttons */}
                <div className="text-right">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5">
                    {isAr ? 'حدد الخيار المفضل للاستلام:' : 'Select Delivery Method:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black transition cursor-pointer ${
                        deliveryMethod === 'delivery'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-650 hover:text-slate-900 bg-transparent'
                      }`}
                    >
                      {isAr ? '🚙 توصيل للمنزل' : '🚙 Home Delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black transition cursor-pointer ${
                        deliveryMethod === 'pickup'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-650 hover:text-slate-900 bg-transparent'
                      }`}
                    >
                      {isAr ? '🏪 استلام من المحل' : '🏪 Store Pickup'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-700 pt-1">
                  <span className="font-mono font-black">{parseFloat(itemsTotal.toFixed(3))} BHD</span>
                  <span>{isAr ? 'مجموع المنتجات:' : 'Items Total:'}</span>
                </div>

                <div className="flex justify-between items-center text-slate-700">
                  {deliveryMethod === 'pickup' ? (
                    <>
                      <span className="text-indigo-700 font-extrabold font-sans bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {isAr ? 'استلام مجاني (د.ب 0)' : 'Store Pickup (0 BHD)'}
                      </span>
                      <span>{isAr ? 'طريقة الاستلام:' : 'Collection Mode:'}</span>
                    </>
                  ) : (
                    <>
                      <div className="text-left font-mono font-black text-indigo-600">
                        {parseFloat(calculatedShipping.toFixed(3))} BHD 
                        <span className="text-[8.5px] block font-sans font-bold text-slate-400 text-left leading-tight">
                          {isAr ? '*(توصيل تجميعي مفعّل)' : '*(consolidated)'}
                        </span>
                      </div>
                      <span>{isAr ? 'رسوم التوصيل لعنوانك المعتمد:' : 'Home Delivery Fee:'}</span>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-slate-950 font-black text-sm border-t border-slate-150 pt-2">
                  <span className="font-mono font-black text-slate-900">
                    {parseFloat(grandTotal.toFixed(3))} BHD
                  </span>
                  <span>{isAr ? 'المجموع النهائي المستحق:' : 'Grand Total:'}</span>
                </div>
              </div>
            </div>

            {/* Address Form checkout */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-1 pb-6 text-right">
              <h4 className="font-extrabold text-[12px] text-slate-900 border-b border-slate-200 pb-2 text-right text-indigo-650 flex items-center justify-end gap-1">
                <span>{isAr ? 'بيانات الشحن وتأكيد الطلب المباشر:' : 'Shipping & Customer Order details:'}</span>
                <span>👤</span>
              </h4>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  {isAr ? 'اسم العميل بالكامل:' : 'Customer Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isAr ? 'الاسم بالكامل' : 'e.g., Ali Ahmed'}
                  className="w-full text-xs sm:text-sm p-3 bg-white text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-right font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  {isAr ? 'رقم الهاتف للتواصل للتوصيل:' : 'Phone Contact Number:'}
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="39XXXXXX"
                  className="w-full text-xs sm:text-sm p-3 bg-white text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-mono text-left font-bold"
                />
              </div>

              {deliveryMethod === 'delivery' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    {isAr ? 'عنوان التوصيل بالتفصيل بمملكة البحرين:' : 'Full delivery address in Bahrain:'}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={isAr ? 'المدينة، المنطقة، رقم الشارع، المجمع السكني ورقم الطابق/المنزل...' : 'City, Block, Street, House/Flat No...'}
                    className="w-full text-xs p-3 bg-white text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 resize-none text-right placeholder-slate-400 font-semibold"
                  />
                </div>
              )}

              {deliveryMethod === 'pickup' && (
                <div className="bg-indigo-50/45 p-3 rounded-xl border border-indigo-100 text-[10px] text-slate-750 leading-relaxed space-y-1 text-right">
                  <p className="font-extrabold text-indigo-850 text-[11px]">📍 {isAr ? 'تعليمات الاستلام من المحل:' : 'Pickup Instructions:'}</p>
                  <p>{isAr ? storeSettings.socials.pickupInstructionsAr : storeSettings.socials.pickupInstructionsEn}</p>
                </div>
              )}

              {/* Verified Checkout submission trigger */}
              <button
                type="submit"
                className="w-full mt-2 text-white font-black py-3 rounded-xl text-xs sm:text-sm cursor-pointer shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100/55"
              >
                <Send size={15} />
                <span>
                  {isAr ? 'تأكيد وشحن الطلب الآن 🚀' : 'Confirm & Place Order Now 🚀'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
