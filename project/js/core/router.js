const routes = new Map();
let currentRoute = null;

export function registerRoute(name, renderFn) {
  routes.set(name, renderFn);
}

export function navigate(name) {
  window.location.hash = name;
}

export function initRouter(containerId, defaultRoute = "dashboard") {
  const container = document.getElementById(containerId);

  async function render() {
    const name = window.location.hash.replace("#", "") || defaultRoute;
    currentRoute = name;
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.route === name);
    });
    container.innerHTML = "";
    const renderFn = routes.get(name);
    if (renderFn) {
      await renderFn(container);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ti ti-tools"></i>
          <p>هذه الصفحة قيد التطوير ضمن المرحلة القادمة</p>
        </div>`;
    }
  }

  window.addEventListener("hashchange", render);
  render();
}

export function getCurrentRoute() {
  return currentRoute;
}
