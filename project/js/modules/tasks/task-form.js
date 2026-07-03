import { openModal, closeModal } from "../../shared/components/modal.js";
import { addTask } from "./task-service.js";
import { currentUser } from "../../core/auth.js";
import { showToast } from "../../shared/components/toast.js";

export function openQuickAddTask() {
  const html = `
    <div class="modal-header">
      <h3>مهمة جديدة</h3>
      <button class="ghost" id="close-modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="task-form">
      <div class="form-group">
        <label>العنوان</label>
        <input type="text" id="f-title" required placeholder="مثال: تدقيق تقني - عميل ألفا">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>النوع</label>
          <select id="f-type">
            <option value="work">عمل</option>
            <option value="client">مشروع عميل</option>
            <option value="seo">SEO</option>
            <option value="study">دراسة</option>
            <option value="personal">شخصي</option>
          </select>
        </div>
        <div class="form-group">
          <label>الأولوية</label>
          <select id="f-priority">
            <option value="urgent">عاجل</option>
            <option value="high">عالية</option>
            <option value="medium" selected>متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>تاريخ الاستحقاق</label>
          <input type="date" id="f-due">
        </div>
        <div class="form-group">
          <label>الوقت المقدَّر (دقيقة)</label>
          <input type="number" id="f-estimate" placeholder="60">
        </div>
      </div>
      <div class="form-group">
        <label>العميل / المشروع (اختياري)</label>
        <input type="text" id="f-client" placeholder="مثال: عميل ألفا">
      </div>
      <div class="modal-actions">
        <button type="button" class="ghost" id="cancel-btn">إلغاء</button>
        <button type="submit" class="primary">حفظ المهمة</button>
      </div>
    </form>
  `;

  const overlay = openModal(html, {
    onMount: (el) => {
      el.querySelector("#close-modal").onclick = () => closeModal(overlay);
      el.querySelector("#cancel-btn").onclick = () => closeModal(overlay);
      el.querySelector("#task-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const data = {
          title: el.querySelector("#f-title").value.trim(),
          type: el.querySelector("#f-type").value,
          priority: el.querySelector("#f-priority").value,
          dueDate: el.querySelector("#f-due").value || null,
          estimatedMinutes: el.querySelector("#f-estimate").value,
          clientName: el.querySelector("#f-client").value.trim() || null
        };
        if (!data.title) return;
        try {
          await addTask(data, currentUser.uid);
          showToast("تم إضافة المهمة بنجاح");
          closeModal(overlay);
        } catch (err) {
          showToast("حدث خطأ أثناء الحفظ", "error");
          console.error(err);
        }
      });
    }
  });
}
