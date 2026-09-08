(function () {
  const main = document.querySelector("[data-type]");
  if (!main) return;
  const type = main.dataset.type;

  const searchInput = document.getElementById("accessory-search");
  const rowsBody = document.getElementById("accessory-rows");
  const table = document.getElementById("accessory-table");
  const emptyState = document.getElementById("table-empty");
  const showingText = document.getElementById("showing-text");
  const statTotal = document.getElementById("stat-total");
  const statAvailable = document.getElementById("stat-available");
  const statAssigned = document.getElementById("stat-assigned");
  const statMaintenance = document.getElementById("stat-maintenance");

  const isSheetLayout = !!document.getElementById("acc-srf-no");

  const PAGE_SIZE = 10;
  let allItems = [];
  let currentPage = 1;

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function statusBadge(status) {
    const value = status || "available";
    return `<span class="status-badge ${value}">${value}</span>`;
  }

  function renderStats() {
    const counts = { available: 0, assigned: 0, maintenance: 0, retired: 0 };
    allItems.forEach((item) => {
      const s = item.status || "available";
      if (counts[s] !== undefined) counts[s]++;
    });
    if (statTotal) statTotal.textContent = allItems.length;
    if (statAvailable) statAvailable.textContent = counts.available;
    if (statAssigned) statAssigned.textContent = counts.assigned;
    if (statMaintenance) statMaintenance.textContent = counts.maintenance;
  }

  function renderRow(item, isAdmin) {
    const actionsCell = isAdmin
      ? `<td><button class="row-edit" type="button" data-edit-id="${item._id}" aria-label="Edit">✎</button><button class="row-delete" type="button" data-id="${item._id}" aria-label="Delete">🗑</button></td>`
      : "";
    if (isSheetLayout) {
      return `
      <tr>
        <td>${escapeHtml(item.srfNo ?? "")}</td>
        <td>${escapeHtml(item.deviceName)}</td>
        <td>${escapeHtml(item.displayName) || "—"}</td>
        <td>${escapeHtml(item.serviceTag) || "—"}</td>
        <td>${formatDate(item.shipDate)}</td>
        <td>${formatDate(item.expiryDate)}</td>
        <td>${escapeHtml(item.customAccMainU) || "—"}</td>
        ${actionsCell}
      </tr>`;
    }
    return `
      <tr>
        <td>${escapeHtml(item.deviceName)}</td>
        <td>${escapeHtml(item.serviceTag) || "—"}</td>
        <td>${escapeHtml(item.shipTag) || "—"}</td>
        <td>${formatDate(item.shipDate)}</td>
        <td>${formatDate(item.expiryDate)}</td>
        <td>${escapeHtml(item.username) || "—"}</td>
        <td>${statusBadge(item.status)}</td>
        ${actionsCell}
      </tr>`;
  }

  function render() {
    renderStats();
    const totalItems = allItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = allItems.slice(start, start + PAGE_SIZE);
    const isAdmin = Portal.isAdmin();

    rowsBody.innerHTML = pageItems.map((item) => renderRow(item, isAdmin)).join("");

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
    const params = new URLSearchParams({ type });
    const q = searchInput.value.trim();
    if (q) params.set("q", q);
    try {
      const res = await fetch("/api/accessories?" + params.toString());
      const data = await res.json().catch(() => ({ items: [] }));
      allItems = Array.isArray(data.items) ? data.items : [];
    } catch {
      allItems = [];
    }
    currentPage = 1;
    render();
  }

  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(load, 250);
  });

  document.querySelector('[data-page="first"]')?.addEventListener("click", () => { currentPage = 1; render(); });
  document.querySelector('[data-page="prev"]')?.addEventListener("click", () => { if (currentPage > 1) { currentPage--; render(); } });
  document.querySelector('[data-page="next"]')?.addEventListener("click", () => { currentPage++; render(); });
  document.querySelector('[data-page="last"]')?.addEventListener("click", () => { currentPage = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE)); render(); });

  document.querySelectorAll(".sidebar-group-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.currentTarget.closest(".sidebar-group").classList.toggle("open");
    });
  });

  // --- CRUD modal wiring ---
  const modal = document.getElementById("accessory-modal");
  if (modal) {
    const form = document.getElementById("accessory-form");
    const title = document.getElementById("accessory-modal-title");
    const submitBtn = document.getElementById("accessory-submit-btn");
    const errorEl = document.getElementById("accessory-form-error");
    const editIdInput = document.getElementById("acc-edit-id");
    const fields = {
      srfNo: document.getElementById("acc-srf-no"),
      deviceName: document.getElementById("acc-device-name"),
      displayName: document.getElementById("acc-display-name"),
      deviceType: document.getElementById("acc-device-type"),
      serviceTag: document.getElementById("acc-service-tag"),
      shipTag: document.getElementById("acc-ship-tag"),
      shipDate: document.getElementById("acc-ship-date"),
      expiryDate: document.getElementById("acc-expiry-date"),
      username: document.getElementById("acc-username"),
      customAccMainU: document.getElementById("acc-custom-accmainu"),
      status: document.getElementById("acc-status"),
      location: document.getElementById("acc-location"),
    };

    function toDateInput(value) {
      if (!value) return "";
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
    }

    function openModal({ mode, item }) {
      form.reset();
      errorEl.textContent = "";
      if (mode === "edit" && item) {
        editIdInput.value = item._id;
        title.textContent = "Edit Accessory";
        submitBtn.textContent = "Update Accessory";
        if (fields.srfNo) fields.srfNo.value = item.srfNo ?? "";
        fields.deviceName.value = item.deviceName || "";
        if (fields.displayName) fields.displayName.value = item.displayName || "";
        fields.deviceType.value = item.deviceType || type;
        fields.serviceTag.value = item.serviceTag || "";
        if (fields.shipTag) fields.shipTag.value = item.shipTag || "";
        fields.shipDate.value = toDateInput(item.shipDate);
        fields.expiryDate.value = toDateInput(item.expiryDate);
        if (fields.username) fields.username.value = item.username || "";
        if (fields.customAccMainU) fields.customAccMainU.value = item.customAccMainU || "";
        fields.status.value = item.status || "available";
        fields.location.value = item.location || "islamabad";
      } else {
        editIdInput.value = "";
        title.textContent = "Add Accessory";
        submitBtn.textContent = "Add Accessory";
        fields.deviceType.value = type;
      }
      modal.hidden = false;
    }

    function closeModal() {
      modal.hidden = true;
    }

    document.getElementById("add-accessory-btn")?.addEventListener("click", () => openModal({ mode: "add" }));
    modal.querySelectorAll("[data-close-accessory-modal]").forEach((el) => el.addEventListener("click", closeModal));

    rowsBody.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-edit-id]");
      if (editBtn) {
        const item = allItems.find((i) => i._id === editBtn.dataset.editId);
        if (item) openModal({ mode: "edit", item });
        return;
      }
      const deleteBtn = event.target.closest("[data-id]");
      if (!deleteBtn) return;
      if (!confirm("Delete this accessory?")) return;
      deleteBtn.disabled = true;
      fetch("/api/accessories/" + deleteBtn.dataset.id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + Portal.getToken() },
      })
        .then(load)
        .finally(() => { deleteBtn.disabled = false; });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorEl.textContent = "";
      submitBtn.disabled = true;
      const editId = editIdInput.value;
      try {
        const body = {
          deviceName: fields.deviceName.value.trim(),
          deviceType: fields.deviceType.value,
          serviceTag: fields.serviceTag.value.trim(),
          shipDate: fields.shipDate.value || null,
          expiryDate: fields.expiryDate.value || null,
          status: fields.status.value,
          location: fields.location.value,
        };
        if (fields.srfNo) body.srfNo = fields.srfNo.value ? Number(fields.srfNo.value) : null;
        if (fields.displayName) body.displayName = fields.displayName.value.trim();
        if (fields.shipTag) body.shipTag = fields.shipTag.value.trim();
        if (fields.username) body.username = fields.username.value.trim();
        if (fields.customAccMainU) body.customAccMainU = fields.customAccMainU.value.trim();

        const res = await fetch(editId ? "/api/accessories/" + editId : "/api/accessories", {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + Portal.getToken() },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          errorEl.textContent = data.message || "Unable to save the accessory.";
          return;
        }
        closeModal();
        await load();
      } catch {
        errorEl.textContent = "Unable to reach the server. Please try again.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  load();
})();
