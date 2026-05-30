import { useState, useEffect } from 'react';
import { User, Product, PartnerCoupon, StoreSettings } from './types';
import Header from './components/Header';
import FeaturedAd from './components/FeaturedAd';
import ProductsSection from './components/ProductsSection';
import OffersSection from './components/OffersSection';
import CartSidebar from './components/CartSidebar';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import BottomNavBar from './components/BottomNavBar';
import SearchModal from './components/SearchModal';

import { INITIAL_PRODUCTS, INITIAL_COUPONS, DEFAULT_STORE_SETTINGS } from './data';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('sl_lang') as 'ar' | 'en') || 'ar';
  });

  const isAr = lang === 'ar';

  // Toggle language and update localStorage
  const handleToggleLang = (selectedLang: 'ar' | 'en') => {
    setLang(selectedLang);
    localStorage.setItem('sl_lang', selectedLang);
  };

  // State: Authenticated Admin / Sub Admin
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sl_user_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return null;
  });

  // State: Cart contents
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const saved = localStorage.getItem('sl_cart_items');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [];
  });

  // State: Store configurations (Socials, delivery, banner ads)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('sl_store_settings');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.socials && (parsed.socials.whatsapp === '97339442011' || !parsed.socials.whatsapp || parsed.socials.whatsapp === '')) {
          parsed.socials.whatsapp = '37120456';
        }
        if (parsed) {
          if (parsed.deliveryFee === undefined || parsed.deliveryFee === 3) {
            parsed.deliveryFee = 2;
          }
        }
        return parsed;
      } catch (_) {}
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // State: Registered Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('sl_products_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let modified = false;
          // Collect existing codes to determine a safe sequential basis
          const numericCodes = parsed
            .map(p => parseInt(p.code, 10))
            .filter(num => !isNaN(num));
          let maxVal = numericCodes.length > 0 ? Math.max(...numericCodes) : 0;

          const healed = parsed.map((p) => {
            if (!p.code) {
              modified = true;
              maxVal += 1;
              return { ...p, code: String(maxVal).padStart(2, '0') };
            }
            return p;
          });
          if (modified) {
            localStorage.setItem('sl_products_list', JSON.stringify(healed));
          }
          return healed;
        }
      } catch (_) {}
    }
    const initialWithCodes = INITIAL_PRODUCTS.map((p, idx) => ({
      ...p,
      code: String(idx + 1).padStart(2, '0')
    }));
    localStorage.setItem('sl_products_list', JSON.stringify(initialWithCodes));
    return initialWithCodes;
  });

  // State: Clinic and restaurant discount list (PartnerCoupon)
  const [coupons, setCoupons] = useState<PartnerCoupon[]>(() => {
    const saved = localStorage.getItem('sl_coupons_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return INITIAL_COUPONS;
  });

  // UI state toggles
  const [activeTab, setActiveTab] = useState<'products' | 'coupons'>('products');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // On mount: Load settings, products and coupons from the server
  useEffect(() => {
    // 1. Settings reconciliation
    fetch('/api/settings')
      .then((res) => res.json())
      .then((serverSettings) => {
        if (serverSettings && serverSettings.storeName) {
          // Verify deliveryFee is 2 BHD
          if (serverSettings.deliveryFee === undefined || serverSettings.deliveryFee === 3) {
            serverSettings.deliveryFee = 2;
          }
          setStoreSettings(serverSettings);
        } else {
          // If server settings is empty, seed the server with the client's settings
          const current = { ...storeSettings };
          if (current.deliveryFee === undefined || current.deliveryFee === 3) {
            current.deliveryFee = 2;
          }
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(current)
          }).catch(err => console.error("Error seeding settings to server:", err));
        }
      })
      .catch((err) => console.error("Error fetching settings:", err));

    // 2. Products reconciliation
    fetch('/api/products')
      .then((res) => res.json())
      .then((serverProds) => {
        if (serverProds && Array.isArray(serverProds) && serverProds.length > 0) {
          setProducts(serverProds);
        } else {
          // Seed server with current products if empty
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(products)
          }).catch(err => console.error("Error seeding products to server:", err));
        }
      })
      .catch((err) => console.error("Error fetching products:", err));

    // 3. Coupons reconciliation
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((serverCoupons) => {
        if (serverCoupons && Array.isArray(serverCoupons) && serverCoupons.length > 0) {
          setCoupons(serverCoupons);
        } else {
          // Seed server with current coupons if empty
          fetch('/api/coupons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(coupons)
          }).catch(err => console.error("Error seeding coupons to server:", err));
        }
      })
      .catch((err) => console.error("Error fetching coupons:", err));
  }, []);

  // Sync state with localStorage and server
  useEffect(() => {
    localStorage.setItem('sl_products_list', JSON.stringify(products));
    if (products && products.length > 0) {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products)
      }).catch(err => console.error("Error syncing products to server:", err));
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sl_coupons_list', JSON.stringify(coupons));
    if (coupons && coupons.length > 0) {
      fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupons)
      }).catch(err => console.error("Error syncing coupons to server:", err));
    }
  }, [coupons]);

  useEffect(() => {
    const syncedSettings = { ...storeSettings };
    if (syncedSettings.deliveryFee === undefined || syncedSettings.deliveryFee === 3) {
      syncedSettings.deliveryFee = 2;
    }
    localStorage.setItem('sl_store_settings', JSON.stringify(syncedSettings));
    // Sync settings to server for real-time backend notifications
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncedSettings)
    }).catch(err => console.error("Server API offline; using local cache", err));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('sl_cart_items', JSON.stringify(cart));
  }, [cart]);

  // Actions
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sl_user_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sl_user_session');
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 selection:bg-[#d946ef] selection:text-white font-sans transition-all duration-300 pb-20">
      
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-indigo-200/25 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-pink-200/25 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col">
        
        {/* Row 1 + 2 + 3: AliExpress Brand Banner Header, Search Box & Category Tabs */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4">
          <Header 
            lang={lang}
            setLang={handleToggleLang}
            user={user}
            onRequestLogin={() => setLoginOpen(true)}
            onLogout={handleLogout}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onCartToggle={() => setCartOpen(true)}
            storeName={storeSettings.storeName}
            storeLogoUrl={storeSettings.storeLogoUrl}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Re-ordered Row 4: Custom Ad Space (الاعلان المخصص) immediately underneath Categories */}
        {storeSettings.topAd && storeSettings.topAd.isActive && (
          <div className="mt-4">
            <FeaturedAd 
              ad={storeSettings.topAd} 
              lang={lang} 
            />
          </div>
        )}



        {/* Dynamic Administrator Controls - Visible only when logged in as admin */}
        {user?.isAdmin && (
          <div id="admin-settings-section" className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-5 animate-in slide-in-from-top-4 duration-300">
            <AdminPanel 
              user={user}
              storeSettings={storeSettings}
              onSaveStoreSettings={setStoreSettings}
              products={products}
              onSaveProductsList={(newProds) => {
                setProducts(newProds);
              }}
              coupons={coupons}
              onSaveCouponsList={setCoupons}
              lang={lang}
            />
          </div>
        )}

        {/* Re-ordered Row 5: Store Products Section (المنتجات) list below Ad */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 flex-1 relative">
          {activeTab === 'products' ? (
            <ProductsSection 
              products={products}
              onAddToCart={handleAddToCart}
              lang={lang}
              deliveryFee={storeSettings.deliveryFee}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              hideCategoryBar={true}
            />
          ) : (
            <OffersSection 
              coupons={coupons}
              lang={lang}
            />
          )}
        </main>

      </div>

      {/* Cart Sidebar controls */}
      <CartSidebar 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        storeSettings={storeSettings}
        lang={lang}
      />

      {/* Login Screens Authentication modal */}
      {loginOpen && (
        <LoginScreen 
          onLogin={handleLogin}
          onClose={() => setLoginOpen(false)}
          lang={lang}
        />
      )}

      {/* VIP S&L Footer section */}
      <footer className="relative bg-[#08021a] border-t border-[#8b5cf6]/25 mt-16 py-10 text-zinc-400 z-10" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Section 1: Branding and description */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 justify-center">
              <span className="font-sans font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#d946ef] to-[#bfdbfe]">
                {storeSettings.storeName}
              </span>
              <span className="text-xs bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-white font-extrabold px-2 py-0.5 rounded-md">
                {isAr ? 'البحرين 🇧🇭' : 'Bahrain 🇧🇭'}
              </span>
            </div>
            <p className="text-xs text-zinc-350 leading-relaxed font-normal max-w-xl mx-auto">
              {isAr 
                ? 'متجر S&L هو وجهتك الرقمية الذكية المتكاملة بمملكة البحرين لشراء وتوصيل كبرى العلامات والمنتجات من السيارات والمنزل والإلكترونيات والعطور والبخور.'
                : 'S&L Store is your leading destination in Bahrain for elite categories spanning Cars, Home, Electronics, Fragrances, Clothes, and specialized products.'}
            </p>
          </div>

        </div>

        {/* Copyleft copyright sign banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-6 border-t border-[#8b5cf6]/15 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-4">
          <div className="flex items-center gap-1">
            <span>🎗️</span>
            <span>{isAr ? `جميع الحقوق محفوظة لمتجر S&L © ${new Date().getFullYear()}` : `All Rights Reserved to S&L STORE © ${new Date().getFullYear()}`}</span>
          </div>
          <div className="flex gap-4 items-center flex-wrap justify-center sm:justify-end">
            <a href="#" className="hover:text-white transition">{isAr ? 'شروط التوصيل والاستلام' : 'Terms & Conditions'}</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition">{isAr ? 'سياسة دمج السلع' : 'Combined Delivery Policy'}</a>
            <span>•</span>
            {!user ? (
              <button 
                onClick={() => setLoginOpen(true)}
                className="text-zinc-400 hover:text-white transition cursor-pointer font-bold rounded-lg px-2.5 py-1 bg-[#12092e] border border-[#8b5cf6]/20 text-[10.5px] tracking-wide"
              >
                {isAr ? '🔐 تسجيل الدخول' : '🔐 Sign In'}
              </button>
            ) : (
              <span className="text-zinc-500 font-bold text-[10.5px]">🛡️ {isAr ? 'تم تسجيل الدخول' : 'Session Active'}</span>
            )}
          </div>
        </div>
      </footer>

      {/* Dynamic bottom navigation bar */}
      <BottomNavBar 
        lang={lang}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onHomeClick={() => {
          setActiveTab('products');
          setActiveCategory('all');
          setSearchModalOpen(false);
        }}
        onSearchClick={() => setSearchModalOpen(true)}
        onCartClick={() => setCartOpen(true)}
        onAccountClick={() => {
          if (user) {
            const el = document.getElementById('admin-settings-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              alert(isAr ? 'أنت مسجل كمسؤول، يرجى تصفح لوحة التحكم بالصفحة.' : 'You are logged in as admin. Browse the panel below.');
            }
          } else {
            setLoginOpen(true);
          }
        }}
        activeTab={activeTab}
        activeCategory={activeCategory}
        isSearchActive={searchModalOpen}
      />

      {/* Real-time search screen overlay */}
      <SearchModal 
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        lang={lang}
        products={products}
        onAddToCart={handleAddToCart}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

    </div>
  );
}
