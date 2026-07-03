import { allTasks } from "../tasks/task-service.js";
import { bus } from "../../core/event-bus.js";
import { isToday, isOverdue, formatDuration } from "../../shared/utils/date-utils.js";
import { openTaskDetail } from "../tasks/task-detail.js";

const TYPE_LABELS = { work: "عمل", client: "عميل", seo: "SEO", study: "دراسة", personal: "شخصي" };

export function renderDashboardView(container) {
  container.innerHTML = `<div id="dashboard-content"></div>`;
  paint(container.querySelector("#dashboard-content"));
  bus.on("tasks:updated", () => {
    const el = document.getElementById("dashboard-content");
    if (el) paint(el);
  });
}

function paint(el) {
  const todayTasks = allTasks.filter((t) => isToday(t.dueDate) && t.status !== "archived");
  const doneToday = todayTasks.filter((t) => t.status === "done");
  const overdue = allTasks.filter((t) => isOverdue(t.dueDate, t.status));
  const totalMinutesToday = allTasks.reduce((sum, t) => sum + (isToday(t.dueDate) ? (t.actualMinutes || 0) : 0), 0);

  const focusQueue = [...allTasks]
    .filter((t) => t.status !== "done" && t.status !== "archived")
    .sort((a, b) => scoreTask(b) - scoreTask(a))
    .slice(0, 6);

  const weekTotal = allTasks.filter((t) => t.status !== "archived").length;
  const weekDone = allTasks.filter((t) => t.status === "done").length;
  const weekPct = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  el.innerHTML = `
    <h1 style="margin-bottom:20px">لوحة التحكم</h1>
    <div class="stat-grid">
      <div class="stat-card"><div class="label">مهام اليوم</div><div class="value">${todayTasks.length}</div></div>
      <div class="stat-card"><div class="label">منجز اليوم</div><div class="value" style="color:var(--success)">${doneToday.length}/${todayTasks.length}</div></div>
      <div class="stat-card"><div class="label">متأخر</div><div class="value" style="color:var(--danger)">${overdue.length}</div></div>
      <div class="stat-card"><div class="label">وقت اليوم</div><div class="value">${formatDuration(totalMinutesToday)}</div></div>
    </div>

    <p class="section-title">قائمة التركيز</p>
    <div id="focus-queue">
      ${focusQueue.length === 0
        ? `<div class="empty-state"><i class="ti ti-mood-smile"></i><p>لا توجد مهام معلّقة، أحسنت!</p></div>`
        : focusQueue.map((t) => focusRowHtml(t)).join("")}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">
      <div class="card">
        <p class="label" style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">التقدم العام</p>
        <div class="progress-track"><div class="progress-fill" style="width:${weekPct}%"></div></div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:8px">${weekPct}% من إجمالي المهام النشطة مكتملة</p>
      </div>
      <div class="card">
        <p class="label" style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">المهام المتأخرة</p>
        ${overdue.length === 0
          ? `<p style="font-size:12px;color:var(--text-muted)">لا توجد مهام متأخرة</p>`
          : overdue.slice(0, 3).map((t) => `<p style="font-size:13px;margin-bottom:4px">• ${escapeHtml(t.title)}</p>`).join("")}
      </div>
    </div>
  `;

  el.querySelectorAll("[data-focus-id]").forEach((row) => {
    const task = allTasks.find((t) => t.id === row.dataset.focusId);
    if (task) row.addEventListener("click", () => openTaskDetail(task));
  });
}

function scoreTask(t) {
  let score = 0;
  const priorityScore = { urgent: 4, high: 3, medium: 2, low: 1 };
  score += (priorityScore[t.priority] || 1) * 10;
  if (isOverdue(t.dueDate, t.status)) score += 50;
  if (isToday(t.dueDate)) score += 20;
  return score;
}

function focusRowHtml(t) {
  const overdue = isOverdue(t.dueDate, t.status);
  return `
    <div class="task-row" data-focus-id="${t.id}">
      <div class="tag-dot" style="background:${overdue ? "var(--danger)" : "var(--type-" + t.type + ")"}"></div>
      <span style="flex:1;font-size:13px">${escapeHtml(t.title)}</span>
      <span style="font-size:11px;color:${overdue ? "var(--danger)" : "var(--text-muted)"}">${TYPE_LABELS[t.type] || t.type}</span>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
