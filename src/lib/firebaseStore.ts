import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, getDoc, deleteDoc, updateDoc, getDocFromServer, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { getAuth } from 'firebase/auth';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL: Firestore with database ID
export const auth = getAuth(app);

// Error Handling according to Pillar & Phase 3 rules of error handlers:
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Dry connection test on loading
export async function testFirestoreConnection() {
  try {
    // Attempt dry read
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Ensure connection is checked early
testFirestoreConnection();

// ==========================================
// FIRESTORE SYNC & CRUD HELPERS
// ==========================================

export const syncOrderToFirestore = async (order: any): Promise<void> => {
  const path = `orders/${order.id}`;
  try {
    // Ensure nested fields are clean; firestore prefers flat/native types over custom classes.
    const orderData = {
      id: String(order.id),
      customerName: String(order.customerName || ''),
      customerPhone: String(order.customerPhone || ''),
      customerAddress: String(order.customerAddress || ''),
      deliveryMethod: String(order.deliveryMethod || 'pickup'),
      itemsTotal: Number(order.itemsTotal) || 0,
      shippingFee: Number(order.shippingFee) || 0,
      grandTotal: Number(order.grandTotal) || 0,
      status: String(order.status || 'pending'),
      createdAt: String(order.createdAt || new Date().toISOString())
    };
    await setDoc(doc(db, 'orders', order.id), orderData);
    console.log(`Order ${order.id} successfully synced to Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateOrderStatusInFirestore = async (orderId: string, status: string): Promise<void> => {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
    console.log(`Order ${orderId} status updated to ${status} in Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteOrderFromFirestore = async (orderId: string): Promise<void> => {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    console.log(`Order ${orderId} deleted from Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getSingleOrderFromFirestore = async (orderId: string): Promise<any | null> => {
  const path = `orders/${orderId}`;
  try {
    const docSnap = await getDoc(doc(db, 'orders', orderId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const listOrdersFromFirestore = async (): Promise<any[]> => {
  const path = 'orders';
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    const results: any[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ ...doc.data(), id: doc.id });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};
