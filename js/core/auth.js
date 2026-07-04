import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { bus } from "./event-bus.js";

export let currentUser = null;

/**
 * يستمع لحالة تسجيل الدخول ويبثّها لباقي التطبيق عبر event-bus.
 * user.emailVerified تحدد ما إذا كان البريد موثّقًا أم لا.
 */
export function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    bus.emit("auth:changed", user);
  });
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * ينشئ الحساب ويرسل فورًا رسالة تحقق للبريد الإلكتروني.
 * لا يمكن الوصول لبيانات المستخدم (Firestore) إلا بعد توثيق البريد —
 * هذا مطبّق أيضًا على مستوى Firestore Rules كطبقة حماية إضافية.
 */
export async function signup(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await sendEmailVerification(cred.user);
  return cred.user;
}

/** يعيد إرسال رسالة تحقق البريد للمستخدم الحالي (لو لسه مش موثّق) */
export async function resendVerificationEmail() {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser);
  }
}

/** إرسال رابط إعادة تعيين كلمة المرور */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  await signOut(auth);
}

/**
 * يحوّل أكواد أخطاء Firebase Auth إلى رسائل عربية مفهومة
 * بدل الرسائل التقنية الإنجليزية.
 */
export function getAuthErrorMessage(error) {
  const code = error?.code || "";
  const map = {
    "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة",
    "auth/user-disabled": "تم تعطيل هذا الحساب",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    "auth/email-already-in-use": "هذا البريد الإلكتروني مسجّل بالفعل — سجّل الدخول بدلًا من ذلك",
    "auth/weak-password": "كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل",
    "auth/too-many-requests": "محاولات كثيرة جدًا، حاول مرة أخرى بعد قليل",
    "auth/network-request-failed": "تحقق من اتصالك بالإنترنت",
    "auth/configuration-not-found": "إعدادات Firebase غير مفعّلة بعد — راجع ملف firebase-config.js"
  };
  return map[code] || "حدث خطأ غير متوقع، حاول مرة أخرى";
}
