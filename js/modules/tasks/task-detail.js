import { openModal, closeModal } from "../../shared/components/modal.js";
import { updateTask, updateTaskStatus, removeTask } from "./task-service.js";
import { formatDuration } from "../../shared/utils/date-utils.js";
import { showToast } from "../../shared/components/toast.js";
import { startTimerForTask, stopTimer, getActiveTimerTaskId } from "../timetracker/timer-service.js";

const TYPE_LABELS = { work: "عمل", client: "مشروع عميل", seo: "SEO", study: "دراسة", personal: "شخصي" };
const PRIORITY_LABELS = { urgent: "عاجل", high: "عالية", medium: "متوسطة", low: "منخفضة" };
const STATUS_LABELS = { todo: "لم تبدأ", in_progress: "قيد التنفيذ", waiting: "بانتظار", done: "منجزة", archived: "مؤرشفة" };

export function openTaskDetail(task) {
  const isRunning = getActiveTimerTaskId() === task.id;
  const checklist = task.checklist || [];

  const html = `
    <div class="modal-header">
      <div>
        <span class="tag" style="background:var(--accent-bg);color:var(--accent)">${TYPE_LABELS[task.type] || task.type}</span>
        <h3 style="margin-top:8px">${escapeHtml(task.title)}</h3>
      </div>
      <button class="ghost" id="close-modal"><i class="ti ti-x"></i></button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>الحالة</label>
        <select id="d-status">
          ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${task.status === k ? "selected" : ""}>${v}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>الأولوية</label>
        <select id="d-priority">
          ${Object.entries(PRIORITY_LABELS).map(([k, v]) => `<option value="${k}" ${task.priority === k ? "selected" : ""}>${v}</option>`).join("")}
        </select>
      </div>
    </div>
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">
      ${task.clientName ? `العميل: ${escapeHtml(task.clientName)} · ` : ""}
      الاستحقاق: ${task.dueDate || "بدون تاريخ"}
    </p>
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:12px;color:var(--text-secondary)">
          <i class="ti ti-clock"></i> ${formatDuration(task.actualMinutes)} ${task.estimatedMinutes ? `/ مقدَّر ${formatDuration(task.estimatedMinutes)}` : ""}
        </span>
        <button id="timer-toggle" class="${isRunning ? "primary" : ""}">
          <i class="ti ti-${isRunning ? "player-pause" : "player-play"}"></i> ${isRunning ? "إيقاف" : "بدء التتبع"}
        </button>
      </div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px">
      <label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:8px">Checklist</label>
      <div id="checklist-items">
        ${checklist.map((item, i) => `
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:6px">
            <input type="checkbox" data-idx="${i}" class="checklist-toggle" ${item.done ? "checked" : ""}>
            <span style="${item.done ? "text-decoration:line-through;color:var(--text-muted)" : ""}">${escapeHtml(item.text)}</span>
          </label>
        `).join("") || `<p style="font-size:12px;color:var(--text-muted)">لا توجد عناصر</p>`}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <input type="text" id="new-checklist-item" placeholder="إضافة عنصر جديد...">
        <button id="add-checklist-item">+</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="danger" id="delete-task">حذف المهمة</button>
      <button class="ghost" id="cancel-btn">إغلاق</button>
    </div>
  `;

  const overlay = openModal(html, {
    onMount: (el) => {
      const close = () => closeModal(overlay);
      el.querySelector("#close-modal").onclick = close;
      el.querySelector("#cancel-btn").onclick = close;

      el.querySelector("#d-status").addEventListener("change", async (e) => {
        await updateTaskStatus(task.id, e.target.value);
        showToast("تم تحديث الحالة");
      });
      el.querySelector("#d-priority").addEventListener("change", async (e) => {
        await updateTask(task.id, { priority: e.target.value });
      });

      el.querySelector("#timer-toggle").addEventListener("click", async () => {
        if (getActiveTimerTaskId() === task.id) {
          await stopTimer();
        } else {
          startTimerForTask(task.id, task.title);
        }
        closeModal(overlay);
      });

      el.querySelectorAll(".checklist-toggle").forEach((cb) => {
        cb.addEventListener("change", async (e) => {
          const idx = Number(e.target.dataset.idx);
          const newList = [...checklist];
          newList[idx] = { ...newList[idx], done: e.target.checked };
          await updateTask(task.id, { checklist: newList });
          closeModal(overlay);
          openTaskDetail({ ...task, checklist: newList });
        });
      });

      el.querySelector("#add-checklist-item").addEventListener("click", async () => {
        const input = el.querySelector("#new-checklist-item");
        const text = input.value.trim();
        if (!text) return;
        const newList = [...checklist, { text, done: false }];
        await updateTask(task.id, { checklist: newList });
        closeModal(overlay);
        openTaskDetail({ ...task, checklist: newList });
      });

      el.querySelector("#delete-task").addEventListener("click", async () => {
        if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
          await removeTask(task.id);
          showToast("تم حذف المهمة");
          close();
        }
      });
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
