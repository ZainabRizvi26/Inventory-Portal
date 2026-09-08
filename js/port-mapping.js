(function () {
  const form = document.getElementById("port-mapping-form");
  if (!form) return;

  const usernameInput = document.getElementById("pm-username");
  const dataPortInput = document.getElementById("pm-data-port");
  const voicePortInput = document.getElementById("pm-voice-port");
  const editIdInput = document.getElementById("pm-edit-id");
  const submitBtn = document.getElementById("pm-submit-btn");
  const cancelBtn = document.getElementById("pm-cancel-edit");
  const formError = document.getElementById("form-error");
  const rowsBody = document.getElementById("port-mapping-rows");
  const table = document.getElementById("port-mapping-table");
  const emptyState = document.getElementById("table-empty");
  const showingText = document.getElementById("showing-text");

  const PAGE_SIZE = 10;
  let allItems = [];
  let currentPage = 1;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  }

  function resetForm() {
    form.reset();
    editIdInput.value = "";
    submitBtn.textContent = "Add Mapping";
    cancelBtn.hidden = true;
  }

  function render() {
    const totalItems = allItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = allItems.slice(start, start + PAGE_SIZE);
    const isAdmin = Portal.isAdmin();

    rowsBody.innerHTML = pageItems
      .map(
        (item) => `
      <tr>
        <td>${escapeHtml(item.username)}</td>
        <td>${escapeHtml(item.dataPort)}</td>
        <td>${escapeHtml(item.voicePort)}</td>
        <td>${formatDate(item.createdAt)}</td>
        ${isAdmin ? `<td><button class="row-edit" type="button" data-edit-id="${item._id}" aria-label="Edit">✎</button><button class="row-delete" type="button" data-id="${item._id}" aria-label="Delete">🗑</button></td>` : ""}
      </tr>`
      )
      .join("");

    const hasItems = totalItems > 0;
    table.hidden = !hasItems;
    emptyState.hidden = hasItems;

    const shownFrom = hasItems ? start + 1 : 0;
    const shownTo = hasItems ? Math.min(start + PAGE_SIZE, totalItems) : 0;
    showingText.textContent = `Showing ${shownFrom} to ${shownTo} of ${totalItems} items`;

    const activeBtn = document.querySelector(".pagination button.active");
    if (activeBtn) activeBtn.textContent = String(currentPage);
    const first = document.querySelector('[data-page="first"]');
    const prev = document.querySelector('[data-page="prev"]');
    const next = document.querySelector('[data-page="next"]');
    const last = document.querySelector('[data-page="last"]');
    if (first) first.disabled = currentPage <= 1;
    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages;
    if (last) last.disabled = currentPage >= totalPages;
  }

  async function load() {
    try {
      const res = await fetch("/api/port-mappings");
      const data = await res.json().catch(() => ({ items: [] }));
      allItems = Array.isArray(data.items) ? data.items : [];
    } catch {
      allItems = [];
    }
    render();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.hidden = true;
    submitBtn.disabled = true;
    const editId = editIdInput.value;
    try {
      const token = Portal.getToken();
      const res = await fetch(editId ? "/api/port-mappings/" + editId : "/api/port-mappings", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          dataPort: dataPortInput.value.trim(),
          voicePort: voicePortInput.value.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        formError.textContent = data.message || "Unable to save the port mapping.";
        formError.hidden = false;
        return;
      }
      resetForm();
      currentPage = 1;
      await load();
    } catch {
      formError.textContent = "Unable to reach the server. Please try again.";
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener("click", () => resetForm());

  rowsBody.addEventListener("click", async (event) => {
    const editBtn = event.target.closest("[data-edit-id]");
    if (editBtn) {
      const item = allItems.find((i) => i._id === editBtn.dataset.editId);
      if (!item) return;
      editIdInput.value = item._id;
      usernameInput.value = item.username;
      dataPortInput.value = item.dataPort;
      voicePortInput.value = item.voicePort;
      submitBtn.textContent = "Update Mapping";
      cancelBtn.hidden = false;
      usernameInput.focus();
      return;
    }
    const deleteBtn = event.target.closest("[data-id]");
    if (!deleteBtn) return;
    deleteBtn.disabled = true;
    try {
      const token = Portal.getToken();
      await fetch("/api/port-mappings/" + deleteBtn.dataset.id, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      await load();
    } finally {
      deleteBtn.disabled = false;
    }
  });

  document.querySelector('[data-page="first"]')?.addEventListener("click", () => { currentPage = 1; render(); });
  document.querySelector('[data-page="prev"]')?.addEventListener("click", () => { if (currentPage > 1) { currentPage--; render(); } });
  document.querySelector('[data-page="next"]')?.addEventListener("click", () => { currentPage++; render(); });
  document.querySelector('[data-page="last"]')?.addEventListener("click", () => { currentPage = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE)); render(); });

  load();
})();
