import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// إنشاء مستند جديد في أي Collection مع إضافة ownerId ووقت الإنشاء تلقائيًا
export async function createDoc(collectionName, data, ownerId) {
  const ref = collection(db, collectionName);
  const payload = { ...data, ownerId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const docRef = await addDoc(ref, payload);
  return docRef.id;
}

export async function updateDocById(collectionName, id, data) {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocById(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

// اشتراك مباشر (Realtime) في مستندات مستخدم معين، مع ترتيب اختياري
export function subscribeToCollection(collectionName, ownerId, callback, orderField = "createdAt") {
  const q = query(
    collection(db, collectionName),
    where("ownerId", "==", ownerId),
    orderBy(orderField, "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (error) => {
    console.error(`Subscription error on ${collectionName}:`, error);
  });
}

export async function getOnce(collectionName, ownerId) {
  const q = query(collection(db, collectionName), where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
