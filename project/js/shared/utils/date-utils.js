export function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === "done" || status === "archived") return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

export function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

export function formatDuration(minutes) {
  const m = Math.round(minutes || 0);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}د`;
  return `${h}س ${rem}د`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
