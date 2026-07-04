let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = "success", duration = 3000) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  ensureContainer().appendChild(el);
  setTimeout(() => el.remove(), duration);
}
