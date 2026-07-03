import { allTasks, updateTaskStatus } from "./task-service.js";
import { bus } from "../../core/event-bus.js";
import { isToday, isThisWeek, isOverdue, formatDateShort } from "../../shared/utils/date-utils.js";
import { openTaskDetail } from "./task-detail.js";
import { openQuickAddTask } from "./task-form.js";

const TYPE_LABELS = { work: "عمل", client: "عميل", seo: "SEO", study: "دراسة", personal: "شخصي" };
const PRIORITY_LABELS = { urgent: "عاجل", high: "عالية", medium: "متوسطة", low: "منخفضة" };

let currentTab = "all";
let currentTypeFilter = "";

export function renderTasksView(container) {
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h1>المهام</h1>
      <button class="primary" id="add-task-btn"><i class="ti ti-plus"></i> مهمة جديدة</button>
    </div>
    <div class="tabs" id="task-tabs">
      <div class="tab ${currentTab === "all" ? "active" : ""}" data-tab="all">الكل</div>
      <div class="tab ${currentTab === "today" ? "active" : ""}" data-tab="today">اليوم</div>
      <div class="tab ${currentTab === "week" ? "active" : ""}" data-tab="week">الأسبوع</div>
      <div class="tab ${currentTab === "overdue" ? "active" : ""}" data-tab="overdue">متأخر</div>
      <div class="tab ${currentTab === "done" ? "active" : ""}" data-tab="done">مكتمل</div>
    </div>
    <div class="filter-bar">
      <select id="type-filter">
        <option value="">كل الأنواع</option>
        ${Object.entries(TYPE_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
      </select>
    </div>
    <div id="tasks-table-wrap"></div>
  `;

  container.querySelector("#add-task-btn").onclick = openQuickAddTask;
  container.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      currentTab = tab.dataset.tab;
      renderTasksView(container);
    };
  });
  container.querySelector("#type-filter").onchange = (e) => {
    currentTypeFilter = e.target.value;
    renderTable(container.querySelector("#tasks-table-wrap"));
  };

  renderTable(container.querySelector("#tasks-table-wrap"));
  bus.on("tasks:updated", () => {
    const wrap = document.getElementById("tasks-table-wrap");
    if (wrap) renderTable(wrap);
  });
}

function getFilteredTasks() {
  let items = [...allTasks];
  if (currentTab === "today") items = items.filter((t) => isToday(t.dueDate));
  if (currentTab === "week") items = items.filter((t) => isThisWeek(t.dueDate));
  if (currentTab === "overdue") items = items.filter((t) => isOverdue(t.dueDate, t.status));
  if (currentTab === "done") items = items.filter((t) => t.status === "done");
  else items = items.filter((t) => t.status !== "archived");
  if (currentTypeFilter) items = items.filter((t) => t.type === currentTypeFilter);
  return items;
}

function renderTable(wrap) {
  const items = getFilteredTasks();
  if (items.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><i class="ti ti-checklist"></i><p>لا توجد مهام هنا حاليًا</p></div>`;
    return;
  }

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th style="width:24px"></th>
          <th style="width:70px">النوع</th>
          <th>العنوان</th>
          <th style="width:110px">العميل</th>
          <th style="width:90px">الاستحقاق</th>
          <th style="width:90px">الأولوية</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(rowHtml).join("")}
      </tbody>
    </table>
  `;

  items.forEach((task) => {
    const row = wrap.querySelector(`[data-task-id="${task.id}"]`);
    if (!row) return;
    row.querySelector(".row-checkbox").addEventListener("click", async (e) => {
      e.stopPropagation();
      await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done");
    });
    row.addEventListener("click", () => openTaskDetail(task));
  });
}

function rowHtml(task) {
  const overdue = isOverdue(task.dueDate, task.status);
  const done = task.status === "done";
  return `
    <tr data-task-id="${task.id}" style="cursor:pointer">
      <td><input type="checkbox" class="row-checkbox" ${done ? "checked" : ""}></td>
      <td><span class="tag-dot" style="background:var(--type-${task.type})"></span> ${TYPE_LABELS[task.type] || task.type}</td>
      <td class="${done ? "status-done" : ""}">${escapeHtml(task.title)}</td>
      <td>${task.clientName ? escapeHtml(task.clientName) : "—"}</td>
      <td class="${overdue ? "overdue-text" : ""}">${task.dueDate ? formatDateShort(task.dueDate) : "—"}</td>
      <td><span class="tag priority-${task.priority}">${PRIORITY_LABELS[task.priority] || task.priority}</span></td>
    </tr>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
