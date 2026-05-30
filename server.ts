import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  const PORT = 3000;
  const DATA_DIR = path.join(process.cwd(), "data");
  const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
  const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
  const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
  const COUPONS_FILE = path.join(DATA_DIR, "coupons.json");

  // Ensure dynamic data folder exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Helper to safely load orders (Local storage backup)
  const loadOrders = (): any[] => {
    if (!fs.existsSync(ORDERS_FILE)) {
      return [];
    }
    try {
      const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error reading orders database:", e);
      return [];
    }
  };

  // Helper to safely write orders (Local storage backup)
  const saveOrders = (orders: any[]) => {
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing orders database:", e);
    }
  };

  // Helper to safely load store settings
  const loadSettings = (): any => {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return {};
    }
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error reading settings database:", e);
      return {};
    }
  };

  // Helper to safely write store settings
  const saveSettings = (settings: any) => {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing settings database:", e);
    }
  };

  // Helper to safely load products
  const loadProducts = (): any[] => {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      return [];
    }
    try {
      const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error reading products database:", e);
      return [];
    }
  };

  // Helper to safely write products
  const saveProducts = (products: any[]) => {
    try {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing products database:", e);
    }
  };

  // Helper to safely load coupons
  const loadCoupons = (): any[] => {
    if (!fs.existsSync(COUPONS_FILE)) {
      return [];
    }
    try {
      const raw = fs.readFileSync(COUPONS_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error reading coupons database:", e);
      return [];
    }
  };

  // Helper to safely write coupons
  const saveCoupons = (coupons: any[]) => {
    try {
      fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing coupons database:", e);
    }
  };

  // Supabase Setup
  const supabaseUrl = process.env.SUPABASE_URL || "https://zqlrvezxztcocotlwuzs.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbHJ2ZXp4enRjb2NvdGx3dXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk3Mjg0OCwiZXhwIjoyMDk1NTQ4ODQ4fQ.r4buDtVOu-RYmddLBKb7XmZE0Ow-qbInM883ojsT9AQ";
  let supabase: any = null;

  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        }
      });
      console.log(`Supabase Client initialized successfully with URL: ${supabaseUrl}`);
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
    }
  } else {
    console.log("Supabase credentials not configured. Storing orders locally.");
  }

  // Callmebot WhatsApp Notification Helper
  const sendCallmebotNotification = async (order: any) => {
    const settings = loadSettings();
    const phone = settings.socials?.whatsapp || process.env.CALLMEBOT_PHONE || "97366603354";
    const apiKey = process.env.CALLMEBOT_API_KEY || settings.callmebotApiKey || "";

    if (!apiKey) {
      console.log("WhatsApp Notification: CALLMEBOT_API_KEY is not set. Skipping WhatsApp callmebot notification.");
      return;
    }

    try {
      const itemsList = (order.items || []).map((item: any, idx: number) => {
        const title = item.titleAr || item.titleEn || item.title || "product";
        return `▫️ *${title}* (الكمية: ${item.quantity} × ${item.price} د.ب)`;
      }).join("\n");

      const deliveryDesc = order.deliveryMethod === "delivery" 
        ? `🚗 توصيل للمنزل\n📍 العنوان: ${order.customerAddress || "غير محدد"}` 
        : "🏪 استلام من المحل";

      const message = `🔔 *طلب جديد رقم: ${order.id}* 🔔\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 *بيانات العميل:*\n` +
        `• الاسم: ${order.customerName}\n` +
        `• الهاتف: ${order.customerPhone}\n` +
        `• طريقة الاستلام: ${deliveryDesc}\n\n` +
        `📦 *المنتجات المطلوبة:*\n` +
        `${itemsList}\n\n` +
        `💰 *الملخص المالي:*\n` +
        `• قيمة المنتجات: ${order.itemsTotal} د.ب\n` +
        `• رسوم الشحن: ${order.shippingFee} د.ب\n` +
        `• الإجمالي الكلي: *${order.grandTotal} د.ب*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💻 تم تسجيل وتحديث الطلب سحابياً بنجاح في Supabase.`;

      const targetPhone = phone.startsWith("+") ? phone.substring(1) : phone;
      const cleanPhone = targetPhone.replace(/\D/g, "");
      
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(message)}`;

      console.log(`Sending WhatsApp callmebot notification to ${cleanPhone}...`);
      
      // Native fetch with timeout/fallback safety
      const response = await fetch(url);
      if (response.ok) {
        console.log("WhatsApp callmebot request succeeded!");
      } else {
        const errText = await response.text();
        console.error(`Callmebot API failed: ${response.status} - ${errText}`);
      }
    } catch (err: any) {
      console.error("Failed to send WhatsApp callmebot notification:", err.message || err);
    }
  };

  // Telegram Notification Helper (Supports Custom Bot + Callmebot fallback)
  const sendCallmebotTelegramNotification = async (order: any) => {
    const settings = loadSettings();
    
    // Check if Telegram notifications are enabled
    if (settings.enableTelegramSync === false) {
      console.log("Telegram notifications are explicitly turned off in store settings.");
      return;
    }

    const useCustomBot = settings.useCustomTelegramBot === true;
    const botToken = settings.telegramBotToken;
    const chatId = settings.telegramChatId;

    if (useCustomBot && botToken && chatId) {
      try {
        console.log(`Sending direct Telegram Bot notification to chat ID ${chatId}...`);
        
        const listItems = (order.items || []).map((item: any) => {
          const title = item.titleAr || item.title || 'منتج';
          return `▫️ <b>${title}</b> (الكمية: ${item.quantity} × ${item.price} د.ب)`;
        }).join('\n');

        const messageText = `🔔 <b>طلب جديد في المتجر!</b>

<b>رقم الطلب:</b> <code>#${order.id}</code>
<b>اسم العميل:</b> ${order.customerName}
<b>الهاتف:</b> ${order.customerPhone}
<b>طريقة التوصيل:</b> ${order.deliveryMethod === 'delivery' ? '🚗 توصيل للمنزل' : '🏪 استلام من المحل'}
${order.customerAddress ? `<b>العنوان:</b> ${order.customerAddress}` : ''}

<b>📦 قائمة المنتجات:</b>
${listItems}

<b>💰 المجموع الكلي:</b> ${order.grandTotal} د.ب
<b>التوقيت:</b> ${new Date(order.createdAt).toLocaleString('ar-BH')}

<i>هذه الرسالة مرسلة مباشرة عبر البوت الخاص بك! 🇧🇭</i>`;

        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(tgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: "HTML"
          })
        });

        if (response.ok) {
          console.log(`Direct Telegram Bot notification sent successfully for order: ${order.id}`);
          return; // Avoid falling back to callmebot
        } else {
          const errText = await response.text();
          console.error(`Direct Telegram Bot API failed: ${response.status} - ${errText}. Falling back to CallMeBot.`);
        }
      } catch (err: any) {
        console.error("Direct Telegram Bot execution failed, falling back to CallMeBot:", err.message);
      }
    }

    // CallMeBot fallback implementation
    const username = settings.telegramUsername || "@ShopSLbh";
    try {
      const message = `📦 طلب جديد في المتجر! رقم الطلب: ${order.id} الإجمالي: ${order.grandTotal} BHD`;
      const cleanUsername = username.startsWith("@") ? username : `@${username}`;
      
      const urls = [
        `https://api.callmebot.com/telegram/sendMessage.php?user=${encodeURIComponent(cleanUsername)}&text=${encodeURIComponent(message)}`,
        `https://api.callmebot.com/telegram/group.php?user=${encodeURIComponent(cleanUsername)}&text=${encodeURIComponent(message)}`
      ];

      for (const url of urls) {
        try {
          console.log(`Sending Telegram callmebot fallback notification to ${cleanUsername} via URL: ${url}`);
          const response = await fetch(url);
          if (response.ok) {
            console.log(`Telegram callmebot fallback request succeeded for URL: ${url}`);
            break;
          }
        } catch (e: any) {
          console.error(`Error sending to Callmebot fallback URL ${url}:`, e.message || e);
        }
      }
    } catch (err: any) {
      console.error("Failed to process Telegram callmebot fallback notification:", err.message || err);
    }
  };

  // API: Check server health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", supabase_active: !!supabase });
  });

  // API: Get active store settings
  app.get("/api/settings", (req, res) => {
    const settings = loadSettings();
    res.json(settings);
  });

  // API: Update store settings (Synchronize settings cache on server)
  app.post("/api/settings", (req, res) => {
    const newSettings = req.body;
    if (!newSettings) {
      return res.status(400).json({ error: "Invalid settings body" });
    }
    saveSettings(newSettings);
    console.log("Successfully cached store settings on the server side.");
    res.json({ success: true, settings: newSettings });
  });

  // API: Get products list
  app.get("/api/products", (req, res) => {
    const products = loadProducts();
    res.json(products);
  });

  // API: Update products list
  app.post("/api/products", (req, res) => {
    const products = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Invalid products array" });
    }
    saveProducts(products);
    console.log("Successfully cached products list on the server side.");
    res.json({ success: true, count: products.length });
  });

  // API: Get coupons list
  app.get("/api/coupons", (req, res) => {
    const coupons = loadCoupons();
    res.json(coupons);
  });

  // API: Update coupons list
  app.post("/api/coupons", (req, res) => {
    const coupons = req.body;
    if (!coupons || !Array.isArray(coupons)) {
      return res.status(400).json({ error: "Invalid coupons array" });
    }
    saveCoupons(coupons);
    console.log("Successfully cached coupons list on the server side.");
    res.json({ success: true, count: coupons.length });
  });

  // API: Test CallMeBot WhatsApp Notification
  app.post("/api/test-whatsapp", async (req, res) => {
    const { apiKey, phone } = req.body;
    const settings = loadSettings();
    const finalPhone = phone || settings.socials?.whatsapp || process.env.CALLMEBOT_PHONE || "97366603354";
    const finalApiKey = apiKey || settings.callmebotApiKey || "";

    if (!finalApiKey) {
      return res.status(400).json({ error: "لا يوجد مفتاح API Key مفعّل. يرجى إدخال المفتاح أولاً وحفظ الإعدادات." });
    }

    try {
      const message = `⚙️ *فحص الاتصال لمتجر S&L المتميز* ⚙️\n\n✓ تم ربط خدمة الواتساب بالمتجر بنجاح!\nالخدمة جاهزة الآن لإرسال تفاصيل وإشعارات الطلبات الجديدة في الخلفية. 🇧🇭`;
      const targetPhone = finalPhone.startsWith("+") ? finalPhone.substring(1) : finalPhone;
      const cleanPhone = targetPhone.replace(/\D/g, "");
      
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&apikey=${encodeURIComponent(finalApiKey)}&text=${encodeURIComponent(message)}`;
      
      console.log(`Testing WhatsApp callmebot notification to ${cleanPhone}...`);
      const response = await fetch(url);
      const resText = await response.text();
      
      if (response.ok) {
        if (resText.toLowerCase().includes("error") || resText.toLowerCase().includes("invalid")) {
          return res.status(400).json({ error: `فشل الاتصال من CallMeBot: ${resText}` });
        }
        return res.json({ success: true, message: "تم إرسال رسالة تجريبية بنجاح على الواتساب الخاص بك!" });
      } else {
        return res.status(response.status).json({ error: `استجابة غير صالحة من المزود (${response.status}): ${resText}` });
      }
    } catch (err: any) {
      return res.status(500).json({ error: `فشل إرسال الطلب: ${err.message}` });
    }
  });

  // API: Dynamic Telegram notification forwarder (Supporting direct custom Telegram Bot + CallMeBot fallback)
  app.post("/api/google/notify", async (req, res) => {
    const { message, username } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const settings = loadSettings();
    const useCustomBot = settings.useCustomTelegramBot === true;
    const botToken = settings.telegramBotToken;
    const chatId = settings.telegramChatId;

    if (useCustomBot && botToken && chatId) {
      try {
        console.log(`Sending dynamic/test notification via Custom Telegram Bot to chat ID: ${chatId}`);
        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(tgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML"
          })
        });

        if (response.ok) {
          return res.json({ success: true, message: `Notification sent directly through custom Telegram Bot to Chat ID: ${chatId}` });
        } else {
          const errResText = await response.text();
          return res.status(400).json({ error: `Custom Telegram Bot error: ${response.status} - ${errResText}` });
        }
      } catch (err: any) {
        return res.status(500).json({ error: `Custom Telegram Bot crash: ${err.message}` });
      }
    }

    // CallMeBot fallback
    const targetUser = username || settings.telegramUsername || "@ShopSLbh";
    const cleanUsername = targetUser.startsWith("@") ? targetUser : `@${targetUser}`;
    
    try {
      const urls = [
        `https://api.callmebot.com/telegram/sendMessage.php?user=${encodeURIComponent(cleanUsername)}&text=${encodeURIComponent(message)}`,
        `https://api.callmebot.com/telegram/group.php?user=${encodeURIComponent(cleanUsername)}&text=${encodeURIComponent(message)}`
      ];

      let success = false;
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            success = true;
            console.log(`Dynamic Notification sent to Callmebot check: ${cleanUsername}`);
            break;
          }
        } catch (e: any) {
          console.error(`Dynamic Notification error for URL ${url}:`, e.message);
        }
      }
      
      if (success) {
        return res.json({ success: true, message: `Notification successfully pushed to Telegram channel/user: ${cleanUsername}` });
      } else {
        return res.status(502).json({ error: "Could not deliver alert to CallMeBot Telegram API" });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to notify via Telegram" });
    }
  });

  // API: Secure Administrator Login via Server-side Environment Variables (Dynamic Runtime)
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const masterEmail = process.env.VITE_ADMIN_EMAIL || "al7anjri@gmail.com";
    const masterPass = process.env.VITE_ADMIN_PASS || process.env.VITE_ADMIN_PASSWORD || "Khater@9220981";

    const trimmedEmail = email.trim().toLowerCase();
    const isMaster = masterEmail ? (trimmedEmail === masterEmail.toLowerCase() && password === masterPass) : false;

    if (isMaster) {
      return res.json({ success: true, email: masterEmail });
    } else {
      return res.status(401).json({ error: "Invalid administrator credentials" });
    }
  });

  // API: Get all master orders (Admin lookup)
  app.get("/api/orders", async (req, res) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("id", { ascending: false });
        
        if (error) throw error;

        const parsedOrders = (data || []).map((row: any) => {
          if (row.raw_data) {
            return {
              ...row.raw_data,
              id: row.id,
              status: row.status,
            };
          }
          return {
            id: row.id,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            customerAddress: row.customer_address,
            deliveryMethod: row.delivery_method,
            itemsTotal: Number(row.items_total) || 0,
            shippingFee: Number(row.shipping_fee) || 0,
            grandTotal: Number(row.grand_total) || 0,
            status: row.status,
            createdAt: row.created_at,
            items: row.items || [],
          };
        });
        return res.json(parsedOrders);
      } catch (err: any) {
        console.error("Error reading from Supabase, falling back to local storage:", err.message);
        return res.json(loadOrders());
      }
    } else {
      res.json(loadOrders());
    }
  });

  // API: Get single order by ID (Real-time tracking for customer)
  app.get("/api/orders/:id", async (req, res) => {
    const orderId = req.params.id;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          const formatted = data.raw_data ? {
            ...data.raw_data,
            id: data.id,
            status: data.status,
          } : {
            id: data.id,
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerAddress: data.customer_address,
            deliveryMethod: data.delivery_method,
            itemsTotal: Number(data.items_total) || 0,
            shippingFee: Number(data.shipping_fee) || 0,
            grandTotal: Number(data.grand_total) || 0,
            status: data.status,
            createdAt: data.created_at,
            items: data.items || [],
          };
          return res.json(formatted);
        } else {
          // If not in Supabase, search local backup
          const orders = loadOrders();
          const found = orders.find((o) => o.id === orderId);
          if (found) {
            return res.json(found);
          }
          return res.status(404).json({ error: "Order not found" });
        }
      } catch (err: any) {
        console.error("Error reading single order from Supabase:", err.message);
        const orders = loadOrders();
        const found = orders.find((o) => o.id === orderId);
        if (found) {
          return res.json(found);
        }
        return res.status(404).json({ error: "Order not found" });
      }
    } else {
      const orders = loadOrders();
      const found = orders.find((o) => o.id === orderId);
      if (found) {
        res.json(found);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    }
  });

  // API: Submit new customer order
  app.post("/api/orders", async (req, res) => {
    const newOrder = req.body;
    if (!newOrder || !newOrder.id) {
      return res.status(400).json({ error: "Invalid order schema" });
    }

    // Always back up locally first
    const orders = loadOrders();
    const filtered = orders.filter((o) => o.id !== newOrder.id);
    filtered.push(newOrder);
    saveOrders(filtered);

    if (supabase) {
      try {
        const { error } = await supabase
          .from("orders")
          .upsert({
            id: newOrder.id,
            customer_name: newOrder.customerName,
            customer_phone: newOrder.customerPhone,
            customer_address: newOrder.customerAddress,
            delivery_method: newOrder.deliveryMethod,
            items_total: newOrder.itemsTotal,
            shipping_fee: newOrder.shippingFee,
            grand_total: newOrder.grandTotal,
            status: newOrder.status,
            created_at: newOrder.createdAt,
            items: newOrder.items,
            raw_data: newOrder
          });
        
        if (error) throw error;
        console.log(`Order ${newOrder.id} successfully saved to Supabase.`);
      } catch (err: any) {
        console.error("Supabase upsert failed, successfully saved to local storage instead:", err.message);
        // Still try sending WhatsApp & Telegram before returning
        sendCallmebotNotification(newOrder).catch((e) => console.error("WhatsApp Notification trigger error during fallback:", e));
        sendCallmebotTelegramNotification(newOrder).catch((e) => console.error("Telegram Notification trigger error during fallback:", e));
        return res.json({ success: true, order: newOrder, warning: `Saved locally: ${err.message}` });
      }
    }
    
    // Trigger WhatsApp & Telegram notification in background
    sendCallmebotNotification(newOrder).catch((e) => console.error("WhatsApp Notification trigger error:", e));
    sendCallmebotTelegramNotification(newOrder).catch((e) => console.error("Telegram Notification trigger error:", e));

    res.json({ success: true, order: newOrder });
  });

  // API: Update order status (From Admin actions)
  app.put("/api/orders/:id", async (req, res) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status value is required" });
    }
    const orderId = req.params.id;

    // Update locally first
    const orders = loadOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    let updatedOrder: any = null;
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updatedAt = new Date().toISOString();
      saveOrders(orders);
      updatedOrder = orders[index];
    }

    if (supabase) {
      try {
        // Fetch current raw_data to merge updates
        const { data: current, error: getErr } = await supabase
          .from("orders")
          .select("raw_data")
          .eq("id", orderId)
          .maybeSingle();
        
        let newRawData = updatedOrder;
        if (!getErr && current && current.raw_data) {
          newRawData = {
            ...current.raw_data,
            status,
            updatedAt: new Date().toISOString()
          };
        }

        const { error } = await supabase
          .from("orders")
          .update({
            status: status,
            raw_data: newRawData
          })
          .eq("id", orderId);
        
        if (error) throw error;
        console.log(`Order ${orderId} status updated to ${status} in Supabase.`);
        return res.json({ success: true, order: updatedOrder || newRawData || { id: orderId, status } });
      } catch (err: any) {
        console.error("Supabase status update failed, updated locally instead:", err.message);
        if (updatedOrder) {
          return res.json({ success: true, order: updatedOrder, warning: `Updated locally: ${err.message}` });
        }
        return res.status(500).json({ error: "Failed to update status on cloud database." });
      }
    } else {
      if (updatedOrder) {
        res.json({ success: true, order: updatedOrder });
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    }
  });

  // API: Clear single order
  app.delete("/api/orders/:id", async (req, res) => {
    const orderId = req.params.id;
    
    // Clear locally
    const orders = loadOrders();
    const filtered = orders.filter((o) => o.id !== orderId);
    saveOrders(filtered);

    if (supabase) {
      try {
        const { error } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderId);
        
        if (error) throw error;
        console.log(`Order ${orderId} cleared in Supabase.`);
      } catch (err: any) {
        console.error("Supabase delete failed, deleted locally:", err.message);
        return res.json({ success: true, warning: `Deleted locally: ${err.message}` });
      }
    }
    res.json({ success: true });
  });

  // API: Clear all master orders
  app.delete("/api/orders-clear", async (req, res) => {
    saveOrders([]);

    if (supabase) {
      try {
        const { error } = await supabase
          .from("orders")
          .delete()
          .neq("id", "_placeholder_value_"); // Clear all rows
        
        if (error) throw error;
        console.log("All orders cleared in Supabase.");
      } catch (err: any) {
        console.error("Supabase bulk clear failed, cleared locally:", err.message);
        return res.json({ success: true, warning: `Cleared locally: ${err.message}` });
      }
    }
    res.json({ success: true });
  });

  // Vite Middleware for development & Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fulfilled orders database running on ports http://localhost:${PORT}`);
  });
}

startServer();
