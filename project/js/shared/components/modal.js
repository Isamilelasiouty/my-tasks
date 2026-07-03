export function openModal(innerHTML, { onMount } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal-box">${innerHTML}</div>`;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      closeModal(overlay);
      document.removeEventListener("keydown", escHandler);
    }
  });

  document.body.appendChild(overlay);
  if (onMount) onMount(overlay);
  return overlay;
}

export function closeModal(overlay) {
  overlay.remove();
}
