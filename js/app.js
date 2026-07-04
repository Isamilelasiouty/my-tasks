import {
  initAuthListener,
  currentUser,
  login,
  signup,
  logout,
  resendVerificationEmail,
  resetPassword,
  getAuthErrorMessage
} from "./core/auth.js";
import { isFirebaseConfigured } from "./core/firebase-config.js";
import { bus } from "./core/event-bus.js";
import { registerRoute, initRouter, navigate } from "./core/router.js";
import { showToast } from "./shared/components/toast.js";
import { startTasksSubscription, allTasks } from "./modules/tasks/task-service.js";
import { renderDashboardView } from "./modules/dashboard/dashboard.js";
import { renderTasksView } from "./modules/tasks/task-list.js";
import { openQuickAddTask } from "./modules/tasks/task-form.js";
import { getElapsedSeconds, restoreTimerFromStorage, stopTimer } from "./modules/timetracker/timer-service.js";
import { isOverdue } from "./shared/utils/date-utils.js";

const NAV_ITEMS = [
  { route: "dashboard", label: "لوحة التحكم", icon: "layout-dashboard" },
  { route: "tasks", label: "المهام", icon: "checklist" },
  { route: "projects", label: "المشاريع", icon: "briefcase" },
  { route: "seo", label: "SEO Hub", icon: "search" },
  { route: "study", label: "الدراسة", icon: "book" },
  { route: "goals", label: "الأهداف", icon: "target-arrow" },
  { route: "notes", label: "الملاحظات", icon: "notes" },
  { route: "references", label: "المراجع", icon: "link" },
  { route: "timetracker", label: "متابعة الوقت", icon: "clock" },
  { route: "reports", label: "التقارير", icon: "chart-bar" },
  { route: "settings", label: "الإعدادات", icon: "settings" }
];

/** شاشة تظهر لو firebase-config.js لسه فيه بيانات وهمية (YOUR_...) */
function renderSetupNeededScreen() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-page);padding:24px">
      <div class="card" style="width:420px">
        <h2 style="margin-bottom:4px">إعداد Firebase غير مكتمل</h2>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:14px">
          ملف <code>js/core/firebase-config.js</code> لسه فيه بيانات وهمية.
          افتح المشروع على <a href="https://console.firebase.google.com" target="_blank" rel="noopener">Firebase Console</a>،
          أنشئ مشروعًا، فعّل Email/Password من Authentication، وانسخ بيانات SDK config
          في الملف بدل القيم <code>YOUR_...</code>. التفاصيل كاملة في README.md.
        </p>
      </div>
    </div>
  `;
}

function renderAuthScreen() {
  const root = document.getElementById("root");
  let mode = "login"; // "login" | "signup"

  function render() {
    const isSignup = mode === "signup";
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-page)">
        <div class="card" style="width:360px">
          <h2 style="margin-bottom:4px">${isSignup ? "إنشاء حساب جديد" : "مرحبًا بعودتك"}</h2>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:18px">
            ${isSignup ? "بياناتك مرتبطة بحسابك فقط ولا يقدر يشوفها أي حد غيرك" : "سجّل الدخول لمتابعة نظامك الشخصي"}
          </p>
          ${isSignup ? `
          <div class="form-group">
            <label>الاسم</label>
            <input type="text" id="auth-name" placeholder="اسمك">
          </div>` : ""}
          <div class="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" id="auth-email" placeholder="name@example.com">
          </div>
          <div class="form-group">
            <label>كلمة المرور</label>
            <input type="password" id="auth-password" placeholder="••••••••">
          </div>
          <button class="primary" id="submit-btn" style="width:100%;margin-bottom:8px">
            ${isSignup ? "إنشاء الحساب" : "تسجيل الدخول"}
          </button>
          <button class="ghost" id="toggle-mode-btn" style="width:100%">
            ${isSignup ? "عندك حساب بالفعل؟ سجّل الدخول" : "إنشاء حساب جديد"}
          </button>
          ${!isSignup ? `<button class="ghost" id="forgot-btn" style="width:100%;margin-top:4px;font-size:12px">نسيت كلمة المرور؟</button>` : ""}
        </div>
      </div>
    `;

    root.querySelector("#toggle-mode-btn").onclick = () => {
      mode = isSignup ? "login" : "signup";
      render();
    };

    const forgotBtn = root.querySelector("#forgot-btn");
    if (forgotBtn) {
      forgotBtn.onclick = async () => {
        const email = root.querySelector("#auth-email").value.trim();
        if (!email) {
          showToast("اكتب بريدك الإلكتروني أولًا", "error");
          return;
        }
        try {
          await resetPassword(email);
          showToast("تم إرسال رابط إعادة تعيين كلمة المرور لبريدك");
        } catch (err) {
          showToast(getAuthErrorMessage(err), "error");
        }
      };
    }

    const submitBtn = root.querySelector("#submit-btn");
    submitBtn.onclick = async () => {
      const email = root.querySelector("#auth-email").value.trim();
      const password = root.querySelector("#auth-password").value;

      if (!email || !password) {
        showToast("املأ البريد الإلكتروني وكلمة المرور", "error");
        return;
      }
      if (isSignup && password.length < 6) {
        showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "جارٍ التنفيذ...";
      try {
        if (isSignup) {
          const name = root.querySelector("#auth-name").value.trim();
          await signup(name, email, password);
          showToast("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتفعيله");
        } else {
          await login(email, password);
        }
      } catch (err) {
        showToast(getAuthErrorMessage(err), "error");
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? "إنشاء الحساب" : "تسجيل الدخول";
      }
    };
  }

  render();
}

/** شاشة تنتظر توثيق البريد قبل السماح بدخول لوحة التحكم */
function renderVerifyEmailScreen(user) {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-page);padding:24px">
      <div class="card" style="width:380px;text-align:center">
        <i class="ti ti-mail" style="font-size:32px;color:var(--accent)"></i>
        <h2 style="margin:10px 0 4px">فعّل بريدك الإلكتروني</h2>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:16px">
          أرسلنا رابط تفعيل إلى <strong>${user.email}</strong>.
          افتح بريدك واضغط على الرابط، ثم ارجع هنا واضغط "تحقق الآن".
          الخطوة دي بتضمن إن محدش غيرك يقدر يدخل على بياناتك.
        </p>
        <button class="primary" id="check-verified-btn" style="width:100%;margin-bottom:8px">تحقق الآن</button>
        <button class="ghost" id="resend-btn" style="width:100%;margin-bottom:8px">إعادة إرسال الرابط</button>
        <button class="ghost" id="verify-logout-btn" style="width:100%;font-size:12px">تسجيل الخروج</button>
      </div>
    </div>
  `;

  root.querySelector("#check-verified-btn").onclick = async () => {
    await user.reload();
    if (user.emailVerified) {
      bus.emit("auth:changed", user);
    } else {
      showToast("لسه البريد مش موثّق، افتح الرابط اللي وصلك", "error");
    }
  };
  root.querySelector("#resend-btn").onclick = async () => {
    try {
      await resendVerificationEmail();
      showToast("تم إرسال رابط جديد لبريدك");
    } catch (err) {
      showToast(getAuthErrorMessage(err), "error");
    }
  };
  root.querySelector("#verify-logout-btn").onclick = () => logout();
}

function renderAppShell(user) {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div id="app-shell">
      <aside id="sidebar">
        <div class="brand"><i class="ti ti-bolt"></i> Focusflow</div>
        ${NAV_ITEMS.map((item) => `
          <div class="nav-item" data-route="${item.route}" onclick="location.hash='${item.route}'">
            <i class="ti ti-${item.icon}"></i>
            <span>${item.label}</span>
            ${item.route === "tasks" ? `<span class="badge hidden" id="overdue-badge"></span>` : ""}
          </div>
        `).join("")}
        <div style="flex:1"></div>
        <div class="nav-item" id="logout-btn">
          <i class="ti ti-logout"></i><span>تسجيل الخروج</span>
        </div>
      </aside>
      <main id="main-area">
        <header id="topbar">
          <div id="global-search"><i class="ti ti-search"></i> بحث عام (Ctrl+K)</div>
          <div class="top-spacer"></div>
          <div id="timer-widget"><i class="ti ti-player-play"></i><span id="timer-label">لا يوجد تتبع نشط</span></div>
          <button class="primary" id="quick-add-btn"><i class="ti ti-plus"></i> إضافة سريعة</button>
        </header>
        <section id="view-container"></section>
      </main>
    </div>
  `;

  root.querySelector("#logout-btn").onclick = () => logout();
  root.querySelector("#quick-add-btn").onclick = openQuickAddTask;

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "n" && !isTyping(e)) openQuickAddTask();
  });

  setupTimerWidget();

  registerRoute("dashboard", renderDashboardView);
  registerRoute("tasks", renderTasksView);

  initRouter("view-container", "dashboard");
  startTasksSubscription(user.uid);
  restoreTimerFromStorage();

  bus.on("tasks:updated", updateOverdueBadge);
}

function isTyping(e) {
  const tag = e.target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function updateOverdueBadge() {
  const badge = document.getElementById("overdue-badge");
  if (!badge) return;
  const count = allTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function setupTimerWidget() {
  const widget = document.getElementById("timer-widget");
  const label = document.getElementById("timer-label");

  widget.onclick = () => {
    if (widget.classList.contains("running")) {
      stopTimer();
      showToast("تم إيقاف تتبع الوقت وحفظه");
    }
  };

  bus.on("timer:started", () => {
    widget.classList.add("running");
  });
  bus.on("timer:tick", (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    label.textContent = `${h}:${m}:${s}`;
  });
  bus.on("timer:stopped", () => {
    widget.classList.remove("running");
    label.textContent = "لا يوجد تتبع نشط";
  });
}

function bootstrap() {
  if (!isFirebaseConfigured) {
    renderSetupNeededScreen();
    return;
  }
  initAuthListener();
  bus.on("auth:changed", (user) => {
    if (!user) {
      renderAuthScreen();
    } else if (!user.emailVerified) {
      renderVerifyEmailScreen(user);
    } else {
      renderAppShell(user);
    }
  });
}

bootstrap();
