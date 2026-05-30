import { Product, StoreSettings, Order, OrderItem } from '../types';
import { ShoppingBag, X, Trash2, Plus, Minus, Send, CheckCircle, Sparkles, ClipboardList } from 'lucide-react';
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
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  storeSettings,
  lang
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

  // Sidebar Tabs Layout
  const [sidebarTab, setSidebarTab] = useState<'cart' | 'history'>('cart');
  const [myOrdersHistory, setMyOrdersHistory] = useState<Order[]>([]);
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualSearchError, setManualSearchError] = useState('');
  const [manualSearching, setManualSearching] = useState(false);

  // Sync my orders list with master database (from server API and fallback to localStorage)
  useEffect(() => {
    if (isOpen) {
      const savedMy = localStorage.getItem('sl_my_orders');
      if (savedMy) {
        try {
          const myOrders: Order[] = JSON.parse(savedMy);
          setMyOrdersHistory(myOrders);

          // Now poll the server for each of the tracked orders to get live status updates from admin
          Promise.all(
            myOrders.map(async (myOrd) => {
              try {
                const res = await fetch(`/api/orders/${myOrd.id}`);
                if (res.ok) {
                  return await res.json();
                }
              } catch (err) {
                console.warn("Server polling error", err);
              }
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
              // Fallback to local administrative sync if on same browser/session
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
          console.error("Failed to sync client order history statuses", e);
        }
      }
    }
  }, [isOpen, checkoutComplete, sidebarTab]);

  // Periodic polling every 7 seconds for tracked orders if active
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

  // 1. Calculate items total price
  const itemsTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // 2. Calculate shipping fees based on grouping rule
  // Rule: Same non-empty group = 3 BHD once.
  // Unlinked items (empty target location) = 3 BHD each.
  const linkedGroupsSet = new Set<string>();
  let unlinkedItemsCount = 0;

  cartItems.forEach(item => {
    // If the item has a delivery link group
    if (item.product.deliveryGroupId) {
      linkedGroupsSet.add(item.product.deliveryGroupId);
    } else {
      unlinkedItemsCount += item.quantity;
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

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      alert(isAr ? 'يرجى كتابة الاسم ورقم الهاتف للمتابعة' : 'Please provide your name and phone number');
      return;
    }

    if (deliveryMethod === 'delivery' && !customerAddress.trim()) {
      alert(isAr ? 'يرجى كتابة عنوان التوصيل' : 'Please provide your delivery address');
      return;
    }

    // Generate Order ID starting with L followed by an incrementing number
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

    // 1. Format Customer Message (Clean customer confirmation - NO confidential supplier phone or location)
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
    
    // Retrieve latest registered products list from localStorage to match official codes
    let allProds: Product[] = [];
    try {
      const savedProds = localStorage.getItem('sl_products_list');
      if (savedProds) {
        allProds = JSON.parse(savedProds);
      }
    } catch (_) {}

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
      custMsg += `  • رسوم التوصيل: ${parseFloat(calculatedShipping.toFixed(3))} د.ب\n`;
    } else {
      custMsg += `  • التوصيل: بدون توصيل (استلام مجاني من المحل) 🏪\n`;
    }
    custMsg += `  • *المجموع الإجمالي النهائي: ${parseFloat(grandTotal.toFixed(3))} د.ب*\n\n`;
    
    if (deliveryMethod === 'pickup') {
      custMsg += `📍 *تعليمات استلام طلبك من المحل:* \n${isAr ? storeSettings.socials.pickupInstructionsAr : storeSettings.socials.pickupInstructionsEn}\n\n`;
    }
    custMsg += `💬 نسعد بخدمتكم دائماً في متجر S&L البحريني! ✨`;

    // 2. Format Admin Message (General Manager invoice with EXACT SAME fields, PLUS secret suppliers and addresses info)
    let adminMsg = `👑 *طلب إداري جديد - رقم الطلب: ${orderNo}* 👑\n`;
    adminMsg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    adminMsg += `👤 *بيانات العميل:*\n`;
    adminMsg += `  • الاسم: ${customerName}\n`;
    adminMsg += `  • الهاتف: ${customerPhone}\n`;
    adminMsg += `  • طريقة الاستلام: ${deliveryMethod === 'delivery' ? 'توصيل للمنزل 🚗' : 'الاستلام من المحل بدون توصيل 🏪'}\n`;
    if (deliveryMethod === 'delivery') {
      adminMsg += `  • العنوان: ${customerAddress}\n`;
    }
    
    adminMsg += `\n📦 *الطلبات والموردين (كشف إداري سري):*\n`;
    cartItems.forEach((item, index) => {
      const title = isAr ? item.product.title : (item.product.titleEn || item.product.title);
      const matched = allProds.find(p => p.id === item.product.id);
      const itemCode = matched?.code || item.product.code || String(index + 1).padStart(2, '0');
      adminMsg += `${index + 1}. *${title}*  [كود: ${itemCode}]\n`;
      adminMsg += `   الكمية: ${item.quantity} × السعر: ${item.product.price} د.ب\n`;
      
      // Dynamic group tag if any
      if (item.product.deliveryGroupId) {
        adminMsg += `   📦 مستودع الدمج: ${item.product.deliveryGroupId}\n`;
      }
      
      // Include Private/Secret Location & merchant/supplier Phone as requested
      if (item.product.secretAddress) {
        adminMsg += `   🏠 *الموقع السري للسلعة:* ${item.product.secretAddress}\n`;
      } else {
        adminMsg += `   🏠 *الموقع السري للسلعة:* غير محدد\n`;
      }
      
      if (item.product.merchantPhone) {
        adminMsg += `   👤 *هاتف صاحب المنتج السري:* +${item.product.merchantPhone}\n`;
      } else {
        adminMsg += `   👤 *هاتف صاحب المنتج السري:* غير محدد\n`;
      }
    });

    // Create the Order Object to persist in the shared database
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

    // Store in general logs
    const existingOrdersRaw = localStorage.getItem('sl_all_orders');
    let existingOrders: Order[] = [];
    if (existingOrdersRaw) {
      try {
        existingOrders = JSON.parse(existingOrdersRaw);
      } catch (_) {}
    }
    existingOrders.unshift(newOrder);
    localStorage.setItem('sl_all_orders', JSON.stringify(existingOrders));

    // Store in client's device specific log
    const existingMyOrdersRaw = localStorage.getItem('sl_my_orders');
    let existingMyOrders: Order[] = [];
    if (existingMyOrdersRaw) {
      try {
        existingMyOrders = JSON.parse(existingMyOrdersRaw);
      } catch (_) {}
    }
    existingMyOrders.unshift(newOrder);
    localStorage.setItem('sl_my_orders', JSON.stringify(existingMyOrders));

    // Sync with server database for cross-device visibility
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.error("Server API offline; using local cache", err));

    // Sync with Firebase Firestore s cloud database
    syncOrderToFirestore(newOrder).catch(err => {
      console.error("Failed to sync new order to Cloud Firestore", err);
    });

    // Sanitize client phone number for record keeping
    let rawClientPhone = customerPhone.replace(/\D/g, '');
    if (rawClientPhone.length === 8) {
      rawClientPhone = '973' + rawClientPhone;
    }
    setFinalClientPhone(rawClientPhone);

    // Hardcode direct store number to 97337120456 as requested by the user
    const storePhone = '97337120456';

    const finalClientUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(custMsg)}`;
    
    // Admin raw preview URL for tracking if needed
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
        
        // Add into myOrdersHistory if not already present
        const savedMy = localStorage.getItem('sl_my_orders');
        let currentMy: Order[] = [];
        if (savedMy) {
          try { currentMy = JSON.parse(savedMy); } catch (_) {}
        }
        
        // Filter out any older duplicate of this order
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
        className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Cart Content */}
      <div 
        className="relative w-full max-w-md bg-[#12092e] h-full flex flex-col justify-between shadow-2xl border-l border-[#8b5cf6]/20 animate-in slide-in-from-left md:slide-in-from-right duration-300 shadow-purple-950/40"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header toolbar with segmented tabs */}
        <div className="p-3.5 border-b border-[#8b5cf6]/20 bg-[#160e3d] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#d946ef]">
              <Sparkles size={14} className="animate-spin duration-3000" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">S&L BAHRAIN PREMIUM</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white bg-[#12092e] transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-[#12092e]/80 p-1 rounded-xl border border-[#8b5cf6]/20">
            <button
              onClick={() => { setSidebarTab('cart'); }}
              className={`py-2 rounded-lg font-black text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition select-none cursor-pointer ${
                sidebarTab === 'cart'
                  ? 'bg-[#8b5cf6] text-white shadow-md shadow-purple-500/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag size={12} />
              <span>{isAr ? 'سلتي الحالية' : 'Active Bag'}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono ${sidebarTab === 'cart' ? 'bg-[#12092e] text-white' : 'bg-[#160e3d] text-zinc-400'}`}>
                {cartItems.length}
              </span>
            </button>
            <button
              onClick={() => { setSidebarTab('history'); }}
              className={`py-2 rounded-lg font-black text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition select-none cursor-pointer ${
                sidebarTab === 'history'
                  ? 'bg-[#ff0080] text-white shadow-md shadow-pink-500/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ClipboardList size={12} />
              <span>{isAr ? 'متابعة وتتبع طلباتي' : 'Track Orders'}</span>
              {myOrdersHistory.length > 0 && (
                <span className="bg-[#12092e] text-[#ff0080] text-[9.5px] font-mono font-black px-1.5 rounded-full">
                  {myOrdersHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic content depending on currently active sidebarTab */}
        {sidebarTab === 'history' ? (
          /* Real-time Order Tracking Screen for Customers */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Manual Order Tracker by ID Bar */}
            <form onSubmit={handleManualSearch} className="bg-[#160e3d]/80 p-3 rounded-2xl border border-[#8b5cf6]/20 space-y-2 text-right" dir="rtl">
              <label className="text-[10.5px] font-black text-zinc-200 block">
                🔍 {isAr ? 'استعلام وتتبع يدوي لأي رقم طلب خارجي:' : 'Manual Order Status Lookup by Reference ID:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  placeholder={isAr ? 'مثال: SL4823' : 'e.g. SL4823'}
                  className="flex-1 text-center bg-[#12092e] text-amber-300 font-mono font-black text-xs p-2 rounded-xl outline-none border border-[#cbd5e1]/10 uppercase"
                />
                <button
                  type="submit"
                  disabled={manualSearching || !manualOrderId.trim()}
                  className="bg-[#8b5cf6] hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs px-4 rounded-xl transition active:scale-95 shrink-0 cursor-pointer"
                >
                  {manualSearching ? '...' : (isAr ? 'تتبع ⚡' : 'Track')}
                </button>
              </div>
              {manualSearchError && (
                <p className={`text-[10px] text-center font-semibold leading-relaxed ${manualSearchError.includes('🎉') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {manualSearchError}
                </p>
              )}
            </form>

            <div className="flex justify-between items-center border-b border-[#cbd5e1]/10 pb-2">
              <span className="text-[11px] font-black text-[#5df6be] block">📦 {isAr ? 'طلباتك السابقة قيد المتابعة والتجهيز:' : 'Your Tracked Order Records:'}</span>
              {myOrdersHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(isAr ? 'هل أنت متأكد من مسح تاريخ تتبع طلباتك من هاتفك؟' : 'Clear tracked history from this browser?')) {
                      setMyOrdersHistory([]);
                      localStorage.setItem('sl_my_orders', '[]');
                    }
                  }}
                  className="text-[9px] text-[#ff0080] bg-[#ff0080]/10 px-2 py-0.5 rounded-md hover:bg-[#ff0080]/20 border border-[#ff0080]/20 cursor-pointer"
                >
                  {isAr ? 'مسح تتبع الهستوري' : 'Clear History'}
                </button>
              )}
            </div>

            {myOrdersHistory.length === 0 ? (
              <div className="p-8 text-center bg-[#1b124a]/20 rounded-2xl border border-[#cbd5e1]/10 space-y-2 mt-4">
                <div className="text-3xl">🗳️</div>
                <h5 className="font-extrabold text-white text-xs sm:text-sm">
                  {isAr ? 'لا توجد طلبات سابقة لتتبعها' : 'No order logs recorded'}
                </h5>
                <p className="text-[10px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  {isAr ? 'بمجرد تسجيلك للطلب الأول من السلة المدمجة، ستظهر شاشة تتبع حالتها التلقائية المباشرة من الفرز للشحن فوراً هنا!' : 'A live progress tracker will append here as you authorize your purchases.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrdersHistory.map((ord) => (
                  <div key={ord.id} className="p-3 bg-[#110729] rounded-2xl border border-[#8b5cf6]/20 space-y-3 shadow-md">
                    {/* Header receipt code */}
                    <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/10">
                      <div className="text-right">
                        <span className="text-sm font-black text-amber-300 font-mono tracking-wider">{ord.id}</span>
                        <span className="text-[9px] text-[#cbd5e1]/50 block font-mono">
                          {new Date(ord.createdAt).toLocaleDateString(isAr ? 'ar-BH' : 'en-US')} - {new Date(ord.createdAt).toLocaleTimeString(isAr ? 'ar-BH' : 'en-US')}
                        </span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                        ord.status === 'pending' 
                          ? 'bg-[#ff0080]/15 text-[#ff75c9] border border-[#ff0080]/30 animate-pulse'
                          : ord.status === 'preparing'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : ord.status === 'dispatched'
                          ? 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30 animate-bounce'
                          : 'bg-emerald-500/15 text-[#34d399] border border-emerald-500/30'
                      }`}>
                        {ord.status === 'pending' && (isAr ? '📝 في انتظار الفرز' : 'Pending Request')}
                        {ord.status === 'preparing' && (isAr ? '👨‍🍳 يجري التجهيز والترتيب' : 'Preparing')}
                        {ord.status === 'dispatched' && (isAr ? '🚚 المندوب قيد التوصيل' : 'Out for Delivery')}
                        {ord.status === 'delivered' && (isAr ? '✅ تم التسليم بنجاح لكم' : 'Delivered')}
                      </span>
                    </div>

                    {/* Simple summary of items inside tracking list */}
                    <div className="space-y-1.5 text-right">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[10.5px] font-medium border-b border-[#cbd5e1]/5 pb-1">
                          <span className="font-mono text-zinc-400">{it.quantity} × {parseFloat(it.price.toFixed(3))} د.ب</span>
                          <span className="text-zinc-200">{isAr ? it.titleAr : it.titleEn}</span>
                        </div>
                      ))}
                    </div>

                    {/* Service coordinates and billing totals */}
                    <div className="bg-[#160e3d]/80 p-2.5 rounded-xl text-[10px] flex justify-between items-center text-zinc-400 border border-[#8b5cf6]/10 text-right">
                      <div className="text-left font-mono">
                        {isAr ? 'المجموع النهائي:' : 'Total due:'} 
                        <span className="font-black text-amber-300 text-xs pr-1 font-mono">{parseFloat(ord.grandTotal.toFixed(3))} د.ب</span>
                      </div>
                      <div>
                        {isAr ? 'الاستلام:' : 'Method:'} 
                        <span className="text-zinc-200 font-extrabold font-sans"> {ord.deliveryMethod === 'delivery' ? (isAr ? 'توصيل للمنزل 🚗' : 'Courier delivery') : (isAr ? 'استلام من المحل 🏪' : 'Pickup')}</span>
                      </div>
                    </div>

                    {/* Highly Polished Interactive Vertical Timeline Stepper */}
                    <div className="bg-[#12092e]/60 p-3 rounded-xl border border-[#cbd5e1]/5 space-y-3" dir="rtl">
                      <span className="text-[9px] font-black text-[#5df6be] block text-right border-b border-[#cbd5e1]/5 pb-1 uppercase tracking-wider">
                        {isAr ? '📋 تسلسل ومراحل تجهيز طلبك:' : '📋 Live Action Procedures Tracking:'}
                      </span>
                      
                      <div className="relative pr-3 border-r-2 border-[#8b5cf6]/20 space-y-4">
                        {/* Step 1: Placed / Created */}
                        <div className="relative">
                          {/* Circle indicator */}
                          <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/20 text-[8px] text-white">✓</span>
                          <div className="text-right pr-2">
                            <h6 className="text-[10.5px] font-black text-emerald-400">
                              {isAr ? 'تم إرسال وحفظ الطلب بنجاح' : 'Order Placed Successfully'}
                            </h6>
                            <p className="text-[9px] text-zinc-400 leading-normal">
                              {isAr 
                                ? `تم تسجيل طلبك وحفظه على المتجر برقم التتبع الفردي #${ord.id}.` 
                                : `Registered inside database as individual tracking ID #${ord.id}.`}
                            </p>
                          </div>
                        </div>

                        {/* Step 2: Accepted / Received by Admin */}
                        <div className="relative">
                          {/* Circle indicator */}
                          {['preparing', 'dispatched', 'delivered'].includes(ord.status) ? (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/20 text-[8px] text-white">✓</span>
                          ) : (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center ring-4 ring-amber-500/20 text-[8px] text-white animate-pulse">⏳</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${['preparing', 'dispatched', 'delivered'].includes(ord.status) ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {isAr ? 'استقبال وقبول الطلب من الإدارة' : 'Accepted & Received by Store'}
                            </h6>
                            <p className="text-[9px] text-zinc-400 leading-normal">
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
                          {/* Circle indicator */}
                          {['dispatched', 'delivered'].includes(ord.status) ? (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/20 text-[8px] text-white">✓</span>
                          ) : ord.status === 'preparing' ? (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center ring-4 ring-amber-500/20 text-[8px] text-white animate-pulse">⚡</span>
                          ) : (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-700 flex items-center justify-center ring-4 ring-zinc-700/20 text-[8px] text-zinc-500">⚪</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${['dispatched', 'delivered'].includes(ord.status) ? 'text-emerald-400' : ord.status === 'preparing' ? 'text-amber-300' : 'text-zinc-500'}`}>
                              {isAr ? 'فرز الأصناف وتجهيز الشحنة' : 'Sorting & Protective Packaging'}
                            </h6>
                            <p className="text-[9px] text-zinc-400 leading-normal">
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
                          {/* Circle indicator */}
                          {ord.status === 'delivered' ? (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/20 text-[8px] text-white">✓</span>
                          ) : ord.status === 'dispatched' ? (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center ring-4 ring-blue-500/20 text-[8px] text-white animate-bounce">🚚</span>
                          ) : (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-700 flex items-center justify-center ring-4 ring-zinc-700/20 text-[8px] text-zinc-500">⚪</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${ord.status === 'delivered' ? 'text-emerald-400' : ord.status === 'dispatched' ? 'text-blue-400' : 'text-zinc-500'}`}>
                              {isAr ? 'المندوب قيد التوصيل للعنوان' : 'Dispatched with Express Courier'}
                            </h6>
                            <p className="text-[9px] text-zinc-400 leading-normal">
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
                          {/* Circle indicator */}
                          {ord.status === 'delivered' ? (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/20 text-[8px] text-white">🎉</span>
                          ) : (
                            <span className="absolute -right-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-700 flex items-center justify-center ring-4 ring-zinc-700/20 text-[8px] text-zinc-500">⚪</span>
                          )}
                          <div className="text-right pr-2">
                            <h6 className={`text-[10.5px] font-black ${ord.status === 'delivered' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {isAr ? 'تم استلام وتوصيل طلبك بالكامل 🎉' : 'Delivered & Completed 🎉'}
                            </h6>
                            <p className="text-[9px] text-zinc-400 leading-normal">
                              {ord.status === 'delivered' ? (
                                isAr ? '🎉 مبروك! تم تسليم طلبكم بنجاح وتم إتمام الدورة بالكامل، نسعد جداً بخدمتكم في متجرنا!' : '🎉 Package arrived! Thank you for choosing S&L Store Bahrain.'
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
          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-center flex flex-col justify-between" dir="rtl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-[#5df6be] border border-[#5df6be]/30 mx-auto animate-pulse shrink-0">
                <CheckCircle size={24} />
              </div>
              
              <div className="space-y-1">
                <span className="text-[12px] text-[#5df6be] uppercase tracking-widest block font-black">
                  {isAr ? '✓ تم تسجيل طلبك بنجاح!' : '✓ ORDER PLACED SUCCESSFULLY!'}
                </span>
                <span className="text-[10px] text-zinc-400 block pb-1 border-b border-[#8b5cf6]/20">
                  {isAr ? 'تم استلام وتوثيق طلبك، شكراً لتعاملك معنا!' : 'Your order has been recorded successfully!'}
                </span>
              </div>

              {/* Beautiful Visual Invoice Card */}
              <div className="relative bg-[#160e3d]/90 border border-[#8b5cf6]/40 rounded-2xl p-4 text-right space-y-3.5 shadow-xl select-none" dir="rtl">
                {/* Invoice Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-[#8b5cf6]/30">
                  <div>
                    <h4 className="text-xs font-black text-white">{isAr ? 'فاتورة شراء موثقة' : 'Receipt / Invoice'}</h4>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {completedOrder ? new Date(completedOrder.createdAt).toLocaleString('ar-BH') : new Date().toLocaleString('ar-BH')}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] text-[#bfdbfe]/75 block uppercase font-bold">{isAr ? 'رقم الطلب' : 'ORDER ID'}</span>
                    <span className="text-sm font-black text-amber-300 font-mono tracking-wider">
                      {completedOrder ? completedOrder.id : generatedOrderNo}
                    </span>
                  </div>
                </div>

                {/* Customer Info segment */}
                <div className="text-[10.5px] space-y-1.5 text-zinc-300 border-b border-dashed border-[#8b5cf6]/30 pb-2.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-450">{isAr ? 'اسم العميل:' : 'Customer Name:'}</span>
                    <span className="font-extrabold text-white">{completedOrder ? completedOrder.customerName : customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450">{isAr ? 'هاتف التواصل:' : 'Phone Number:'}</span>
                    <span className="font-bold text-white font-mono" dir="ltr">{completedOrder ? completedOrder.customerPhone : customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450">{isAr ? 'طريقة الاستلام:' : 'Delivery Plan:'}</span>
                    <span className="font-bold text-white">
                      {completedOrder?.deliveryMethod === 'delivery' ? (isAr ? 'توصيل للمنزل 🚗' : 'Home Delivery 🚗') : (isAr ? 'استلام من المحل 🏪' : 'Pickup at Store 🏪')}
                    </span>
                  </div>
                  {completedOrder?.deliveryMethod === 'delivery' && (completedOrder.customerAddress || customerAddress) && (
                    <div className="flex flex-col text-right pt-0.5">
                      <span className="text-zinc-450 mb-0.5">{isAr ? 'العنوان المعتمد لعنوانك:' : 'Delivery Address:'}</span>
                      <span className="bg-[#12092e]/60 p-1.5 rounded-lg border border-[#cbd5e1]/10 text-[9.5px] leading-relaxed text-zinc-300">
                        {completedOrder ? completedOrder.customerAddress : customerAddress}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items loop list */}
                <div className="space-y-2 border-b border-dashed border-[#8b5cf6]/30 pb-2.5">
                  <span className="text-[9px] font-black text-[#5df6be] uppercase block">{isAr ? 'تفاصيل السلع المشتراة:' : 'Billed Items:'}</span>
                  <div className="max-h-[145px] overflow-y-auto space-y-1.5 pr-0.5">
                    {(completedOrder ? completedOrder.items : cartItems.map(c => ({
                      titleAr: c.product.title,
                      titleEn: c.product.titleEn || c.product.title,
                      price: c.product.price,
                      quantity: c.quantity
                    }))).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] leading-tight">
                        <div className="text-left font-mono text-zinc-350">
                          <span>{item.quantity} × {parseFloat(item.price.toFixed(3))}</span>
                          <span className="text-[9px] mr-0.5">د.ب</span>
                        </div>
                        <span className="text-zinc-100 truncate max-w-[190px] font-medium text-right">
                          {isAr ? item.titleAr : (item.titleEn || item.titleAr)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="space-y-1 text-[11px] text-zinc-300">
                  <div className="flex justify-between font-medium">
                    <span className="text-zinc-450">{isAr ? 'إجمالي قيمة المنتجات:' : 'Subtotal:'}</span>
                    <span className="font-mono">{parseFloat((completedOrder ? completedOrder.itemsTotal : itemsTotal).toFixed(3))} د.ب</span>
                  </div>
                  
                  <div className="flex justify-between font-medium">
                    <span className="text-zinc-450">{isAr ? 'تكاليف التوصيل المضافة:' : 'Delivery Fee:'}</span>
                    <span className="font-mono">
                      {completedOrder 
                        ? (completedOrder.shippingFee === 0 ? (isAr ? 'استلام مجاني' : '0 د.ب') : `${parseFloat(completedOrder.shippingFee.toFixed(3))} د.ب`)
                        : (calculatedShipping === 0 ? (isAr ? 'استلام مجاني' : '0 د.ب') : `${parseFloat(calculatedShipping.toFixed(3))} د.ب`)
                      }
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-black text-white pt-2 border-t border-[#cbd5e1]/10">
                    <span className="text-[#bfdbfe]/90">{isAr ? 'المجموع المستحق الكلي:' : 'Total Amount:'}</span>
                    <span className="font-mono text-amber-300 text-[13px] tracking-wide">
                      {parseFloat((completedOrder ? completedOrder.grandTotal : grandTotal).toFixed(3))} د.ب
                    </span>
                  </div>
                </div>

                {/* Certified Stamp */}
                <div className="absolute right-3.5 bottom-12 opacity-[0.06] select-none pointer-events-none transform -rotate-12 border-4 border-emerald-500 text-emerald-500 font-black text-center px-4 py-1.5 rounded-xl uppercase text-xs tracking-wider">
                  S&L APPROVED
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSidebarTab('history');
                }}
                className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] hover:opacity-95 text-white font-black py-3 px-3 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
              >
                <span>📋</span>
                <span>{isAr ? 'انتقل لتتبع تفاصيل وحالة هذا الطلب الآن' : 'Switch to Tracking Sheet'}</span>
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
                className="w-full bg-[#160e3d] hover:bg-[#1b124a] text-zinc-350 font-extrabold py-3 rounded-xl text-xs transition cursor-pointer border border-[#cbd5e1]/10"
              >
                🧹 {isAr ? 'تصفير السلّة والعودة لبدء شراء جديد' : 'Flush Basket & Return'}
              </button>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty state */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="text-4xl text-[#8b5cf6]">🛒</div>
            <h4 className="font-black text-white text-xs sm:text-sm">
              {isAr ? 'سلّتك فارغة تماماً' : 'Your cart is empty'}
            </h4>
            <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed">
              {isAr ? 'ابدأ تصفح أقسام متجر S&L البحريني واملأ سلّتك بأجمل المنتجات والخصومات التجميعية المدمجة!' : 'Browse S&L sections and add products to get combined local shipping!'}
            </p>
          </div>
        ) : (
          /* Products List inside cart */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Shipping promotion badge */}
            {calculatedShipping < (cartItems.length * baseFee) && deliveryMethod === 'delivery' && (
              <div className="bg-[#059669]/10 border border-[#059669]/30 rounded-xl p-3 text-right flex items-center gap-2 animate-pulse text-[#34d399]">
                <Sparkles size={14} className="shrink-0" />
                <span className="text-[10.5px] font-black leading-snug">
                  {isAr 
                    ? `وفرت شحن مجاري! تم دمج شحن بعض المنتجات نظراً لوجودهم في نفس المستودع.` 
                    : `Group benefits active! Consolidated shipping applied to items in same location.`}
                </span>
              </div>
            )}

            {/* Items grid loop */}
            <div className="space-y-3">
              {cartItems.map((item) => {
                const title = isAr ? item.product.title : (item.product.titleEn || item.product.title);
                const hasGroup = !!item.product.deliveryGroupId;
                
                return (
                  <div 
                    key={item.product.id}
                    className="bg-[#1b124a]/40 border border-[#8b5cf6]/20 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-[#8b5cf6]/40 transition"
                  >
                    <img 
                      src={item.product.image} 
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#8b5cf6]/30 bg-[#12092e]"
                    />

                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="text-xs font-black text-white truncate">{title}</h4>
                      <p className="text-[10px] text-zinc-450 font-mono mt-0.5">
                        {parseFloat(item.product.price.toFixed(3))} BHD {isAr ? 'د.ب' : 'BHD'}
                      </p>
                      
                      {/* Bundle info tag */}
                      {hasGroup ? (
                        <span className="inline-block text-[8.5px] font-bold text-[#5df6be] bg-[#5df6be]/10 border border-[#5df6be]/20 px-1.5 py-0.5 rounded-sm mt-1">
                          📦 {isAr ? 'مربوط تجميعياً' : 'Consolidated Group'}
                        </span>
                      ) : (
                        <span className="inline-block text-[8.5px] font-bold text-amber-400 bg-amber-400/5 border border-amber-400/10 px-1.5 py-0.5 rounded-sm mt-1">
                          🚚 {isAr ? 'شحن مستقل' : 'Independent'}
                        </span>
                      )}
                    </div>

                    {/* Numeric control triggers */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center bg-[#12092e] border border-[#8b5cf6]/20 rounded-lg p-0.5">
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 hover:text-white text-zinc-400 cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-black text-white font-mono">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 hover:text-white text-zinc-400 cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Remove completely */}
                      <button
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="text-zinc-500 hover:text-red-400 text-[10px] flex items-center gap-1 cursor-pointer"
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
            <div className="bg-[#160e3d] border border-[#8b5cf6]/20 rounded-2xl p-4.5 space-y-3">
              <h4 className="font-extrabold text-[11px] sm:text-xs text-transparent bg-clip-text bg-gradient-to-r from-[#d946ef] to-[#bfdbfe] border-b border-[#8b5cf6]/10 pb-2 flex items-center gap-1 justify-end">
                <span>{isAr ? 'الملخص والدفع' : 'Order Financial Summary'}</span>
                <span>📊</span>
              </h4>

              <div className="space-y-2 text-xs">
                {/* Method selector buttons */}
                <div className="text-right">
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5">
                    {isAr ? 'حدد الخيار المفضل للاستلام:' : 'Select Delivery Method:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[#12092e]/85 p-1 rounded-xl border border-[#8b5cf6]/20">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black transition cursor-pointer ${
                        deliveryMethod === 'delivery'
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white shadow-md'
                          : 'text-zinc-450 hover:text-white bg-[#160e3d]/40'
                      }`}
                    >
                      {isAr ? '🚙 توصيل للمنزل' : '🚙 Home Delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black transition cursor-pointer ${
                        deliveryMethod === 'pickup'
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white shadow-md'
                          : 'text-zinc-450 hover:text-white bg-[#160e3d]/40'
                      }`}
                    >
                      {isAr ? '🏫 استلام من المحل' : '🏫 Store Pickup'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-zinc-300 pt-1">
                  <span className="font-mono font-black">{parseFloat(itemsTotal.toFixed(3))} BHD</span>
                  <span>{isAr ? 'مجموع المنتجات:' : 'Items Total:'}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-350">
                  {deliveryMethod === 'pickup' ? (
                    <>
                      <span className="text-[#bfdbfe] font-black font-sans bg-[#8b5cf6]/10 px-2 py-0.5 rounded border border-[#8b5cf6]/20">
                        {isAr ? 'استلام من المحل (د.ب 0)' : 'Store Pickup (0 BHD)'}
                      </span>
                      <span>{isAr ? 'طريقة الاستلام:' : 'Collection Mode:'}</span>
                    </>
                  ) : (
                    <>
                      <div className="text-left font-mono font-black text-amber-400">
                        {parseFloat(calculatedShipping.toFixed(3))} BHD 
                        <span className="text-[8.5px] block font-sans font-bold text-zinc-500 text-left leading-tight">
                          {isAr ? '*(توصيل تجميعي مفعّل)' : '*(consolidated)'}
                        </span>
                      </div>
                      <span>{isAr ? 'رسوم التوصيل لعنوانك:' : 'Home Delivery Fee:'}</span>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-white font-black text-sm border-t border-[#8b5cf6]/25 pt-2">
                  <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5df6be] to-[#bfdbfe]">
                    {parseFloat(grandTotal.toFixed(3))} BHD
                  </span>
                  <span>{isAr ? 'المجموع النهائي المستحق:' : 'Grand Total:'}</span>
                </div>
              </div>
            </div>

            {/* Address Form checkout */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 pt-2">
              <h4 className="font-extrabold text-[11px] sm:text-xs text-white border-b border-[#8b5cf6]/10 pb-2 text-right">
                {isAr ? 'بيانات الشحن والاستلام للتوصيل:' : 'Checkout & Shipping Info:'} 👤
              </h4>

              <div className="text-right">
                <label className="text-[10px] font-bold text-zinc-450 block mb-1">
                  {isAr ? 'الاسم بالكامل للعميل:' : 'Customer Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isAr ? 'الاسم الثلاثي أو الثنائي' : 'e.g., Ali Ahmed'}
                  className="w-full text-xs sm:text-sm p-3 bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/20 outline-none focus:border-[#d946ef] text-right"
                />
              </div>

              <div className="text-right">
                <label className="text-[10px] font-bold text-zinc-450 block mb-1">
                  {isAr ? 'رقم الهاتف (الواتساب للمتابعة):' : 'WhatsApp Phone:'}
                </label>
                <input
                  type="number"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="39XXXXXX"
                  className="w-full text-xs sm:text-sm p-3 bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/20 outline-none focus:border-[#d946ef] font-mono text-left"
                />
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="text-right">
                  <label className="text-[10px] font-bold text-zinc-450 block mb-1">
                    {isAr ? 'عنوان التوصيل بالتفصيل بمملكة البحرين:' : 'Full delivery address in Bahrain:'}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={isAr ? 'المدينة، المنطقة، رقم الشارع، المجمع السكني ورقم الطابق/المنزل...' : 'City, Block, Street, House/Flat No...'}
                    className="w-full text-xs p-3 bg-[#160e3d] text-white rounded-xl border border-[#8b5cf6]/20 outline-none focus:border-[#d946ef] resize-none text-right placeholder-zinc-500"
                  />
                </div>
              )}

              {deliveryMethod === 'pickup' && (
                <div className="bg-[#1b124a]/80 p-3 rounded-xl border border-[#8b5cf6]/35 text-[10px] text-zinc-350 leading-relaxed space-y-1 text-right">
                  <p className="font-extrabold text-white text-[11px]">📍 {isAr ? 'تعليمات الاستلام من المحل:' : 'Pickup Instructions:'}</p>
                  <p>{isAr ? storeSettings.socials.pickupInstructionsAr : storeSettings.socials.pickupInstructionsEn}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#d946ef] hover:scale-[1.01] text-white font-black py-3 rounded-xl text-xs sm:text-sm cursor-pointer shadow-lg shadow-[#8b5cf6]/20 flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <Send size={15} />
                <span>{isAr ? 'شحن وإرسال الطلب الآن بلمسة واحدة 🚀' : 'Authorize Order Now 🚀'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
