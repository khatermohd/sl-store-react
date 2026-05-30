import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse or initialize the Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Google Workspace scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/tasks');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to extract access token from Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('OAuth Login Issue:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE SHEETS REST INTEGRATION
// ==========================================

export interface SheetCreateResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const createGoogleSheet = async (token: string, storeName: string, orders: any[]): Promise<SheetCreateResult> => {
  // 1. Create a spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: `S&L Store Orders - جدول طلبات ${storeName}`
      }
    })
  });

  if (!createResponse.ok) {
    const err = await createResponse.text();
    throw new Error(`Google Sheets creation failed: ${err}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Add header rows and append current orders
  const headers = [
    'رقم الطلب (Order ID)',
    'اسم العميل (Customer Name)',
    'رقم الهاتف (Phone)',
    'العنوان (Address)',
    'طريقة الاستلام (Method)',
    'إجمالي السلع (Items BHD)',
    'رسوم التوصيل (Delivery BHD)',
    'المجموع الكلي (Total BHD)',
    'الحالة (Status)',
    'تاريخ الطلب (Date)'
  ];

  const rows = [headers];
  orders.forEach((o: any) => {
    rows.push([
      o.id || '',
      o.customerName || '',
      o.customerPhone || '',
      o.customerAddress || 'الاستلام من المحل',
      o.deliveryMethod === 'delivery' ? 'توصيل' : 'حضور للمحل',
      String(o.itemsTotal || 0),
      String(o.shippingFee || 0),
      String(o.grandTotal || 0),
      o.status || 'pending',
      o.createdAt ? new Date(o.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Bahrain' }) : ''
    ]);
  });

  const appendResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!appendResponse.ok) {
    const appendErr = await appendResponse.text();
    console.error('Failed to fill Google Sheet headers & rows:', appendErr);
  }

  return { spreadsheetId, spreadsheetUrl };
};

export const appendOrderToGoogleSheet = async (token: string, spreadsheetId: string, order: any): Promise<boolean> => {
  const row = [
    order.id || '',
    order.customerName || '',
    order.customerPhone || '',
    order.customerAddress || 'الاستلام من المحل',
    order.deliveryMethod === 'delivery' ? 'توصيل' : 'حضور للمحل',
    String(order.itemsTotal || 0),
    String(order.shippingFee || 0),
    String(order.grandTotal || 0),
    order.status || 'pending',
    order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Bahrain' }) : ''
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    }
  );

  return response.ok;
};

// ==========================================
// GOOGLE FORMS REST INTEGRATION
// ==========================================

export interface FormCreateResult {
  formId: string;
  responderUri: string;
}

export const createGoogleForm = async (token: string, storeName: string): Promise<FormCreateResult> => {
  // 1. Create a dynamic form
  const createResponse = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: `استبانة رضا العملاء ورأيكم - ${storeName}`,
        description: 'نحن في متجر إس آند إل (لصاحبه خاطر) نثمن خدمتكم ورأيكم لنوفر لكم أرقى تجربة توصيل وشحن مدمج بمملكة البحرين 🇧🇭.'
      }
    })
  });

  if (!createResponse.ok) {
    const err = await createResponse.text();
    throw new Error(`Google Form creation failed: ${err}`);
  }

  const formData = await createResponse.json();
  const formId = formData.formId;
  const responderUri = formData.responderUri;

  // 2. Add sample questions to the form via batchUpdate
  const batchUpdateResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          createItem: {
            item: {
              title: 'الاسم الكريم (اختياري)',
              questionItem: {
                question: {
                  required: false,
                  textQuestion: { paragraph: false }
                }
              }
            },
            location: { index: 0 }
          }
        },
        {
          createItem: {
            item: {
              title: 'ما هو تقييمك لميزة (تجميع المنتجات من نفس المستودع لوفر الشحن)؟ 📦',
              questionItem: {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: [
                      { value: 'ممتازة جداً ووفرت عليّ مبالغ كبيرة 🌟🌟🌟🌟🌟' },
                      { value: 'سهلة ومريحة ومفيدة 👍' },
                      { value: 'لم أجربها بعد 🤔' }
                    ]
                  }
                }
              }
            },
            location: { index: 1 }
          }
        },
        {
          createItem: {
            item: {
              title: 'ما هي المنتجات التي تقترح توفيرها في المتجر مستقبلاً؟',
              questionItem: {
                question: {
                  required: false,
                  textQuestion: { paragraph: true }
                }
              }
            },
            location: { index: 2 }
          }
        }
      ]
    })
  });

  if (!batchUpdateResponse.ok) {
    const batchErr = await batchUpdateResponse.text();
    console.error('Failed to configure Google Form questions:', batchErr);
  }

  return { formId, responderUri };
};

// ==========================================
// GOOGLE DRIVE REST INTEGRATION
// ==========================================

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
}

export const listGoogleDriveFiles = async (token: string): Promise<DriveFile[]> => {
  const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=createdTime%20desc', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Drive fetch failed: ${err}`);
  }

  const data = await response.json();
  return data.files || [];
};

export const uploadBackupToGoogleDrive = async (token: string, storeName: string, orders: any[]): Promise<any> => {
  const fileContent = JSON.stringify(orders, null, 2);
  const fileName = `SL_Store_${storeName.replace(/\s+/g, '_')}_Orders_${new Date().toISOString().slice(0, 10)}.json`;
  
  const metadata = {
    name: fileName,
    mimeType: 'application/json'
  };

  const boundary = 'sl_store_multipart_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Drive upload failed: ${err}`);
  }

  return await response.json();
};

// ==========================================
// GMAIL REST INTEGRATION (SEND INVOICE)
// ==========================================

export const sendGmailInvoice = async (token: string, order: any): Promise<boolean> => {
  const emailAddress = order.customerEmail || 'al7anjri@gmail.com';
  const phone = order.customerPhone || 'N/A';
  const name = order.customerName || 'عميل كريم';
  const deliveryText = order.deliveryMethod === 'delivery' 
    ? `توصيل للمنزل - العنوان: ${order.customerAddress || 'غير محدد'}` 
    : 'استلام من المحل';

  const orderLines = (order.items || []).map((item: any) => {
    const title = item.titleAr || item.title || 'منتج';
    return `▫️ ${title} (الكمية: ${item.quantity} × ${item.price} د.ب)`;
  }).join('\n');

  const subject = `فاتورة معتمدة لطلبك #${order.id} - متجر S&L (خاطر) 🇧🇭`;
  const emailBody = `مرحباً ${name}،

شكراً لشرائك من متجر S&L (لصاحبه خاطر) لمستلزمات العناية والطلبات البحرينية.

فيما يلي تفاصيل فاتورتك للطلب رقم: ${order.id}

📬 تفاصيل المستلم:
- الاسم: ${name}
- الهاتف: ${phone}
- طريقة التوصيل: ${deliveryText}

📦 المنتجات المطلوبة:
${orderLines}

💰 تفاصيل الدفع:
- قيمة المنتجات: ${order.itemsTotal} د.ب
- رسوم التوصيل: ${order.shippingFee} د.ب
- المجموع الكلي: ${order.grandTotal} د.ب

حالة الطلب الحالية: ${order.status === 'completed' ? 'تم التوصيل / التسليم بنجاح ✅' : 'قيد التجهيز / توصيل 🚗'}

لأي استفسار يرجى التواصل برقم الهاتف المرفق.
شاكرين لكم زيارتكم!
متجر إس آند إل (خاطر) 🇧🇭`;

  // Safely encode to UTF-8 Base64URL
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const rawEmail = [
    `To: ${emailAddress}`,
    `Subject: ${utf8Subject}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(emailBody)))
  ].join('\r\n');

  const base64UrlEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: base64UrlEmail })
  });

  return response.ok;
};

// ==========================================
// GOOGLE TASKS REST INTEGRATION
// ==========================================

export const createGoogleTaskForOrder = async (token: string, order: any): Promise<any> => {
  const taskTitle = `تجهيز وشحن طلب #${order.id} - العميل: ${order.customerName}`;
  const phoneVal = order.customerPhone || 'بلا رقم هاتف';
  const deliveryDesc = order.deliveryMethod === 'delivery' 
    ? `🚙 شحن وعنوان: ${order.customerAddress || 'غير محدد'}` 
    : '🏪 استلام مباشر من المحل';

  const itemsList = (order.items || []).map((item: any) => {
    return `- ${item.titleAr || item.title || 'منتج'} (الكمية: ${item.quantity})`;
  }).join('\n');

  const taskNotes = `📋 تفاصيل الفك والفرز للطلب #${order.id}:
👤 الاسم: ${order.customerName}
📞 الهاتف: ${phoneVal}
📍 التوصيل: ${deliveryDesc}
💰 الحساب: ${order.grandTotal} د.ب

🛍️ السلع:
${itemsList}

* تم تسجيل التكليف آلياً من لوحة المتجر.`;

  // Set due date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const response = await fetch('https://tasks.googleapis.com/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: taskTitle,
      notes: taskNotes,
      due: tomorrow.toISOString()
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Tasks creation failed: ${err}`);
  }

  return await response.json();
};
