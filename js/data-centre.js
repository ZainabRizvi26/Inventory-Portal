(function () {
  const searchInput = document.getElementById("dc-search");
  const rowsBody = document.getElementById("dc-rows");
  const table = document.getElementById("dc-table");
  const emptyState = document.getElementById("table-empty");
  const totalEl = document.getElementById("total-dc-assets");
  const showingText = document.getElementById("showing-text");
  const clearFilterBtn = document.getElementById("clear-filter");
  const filterToggle = document.getElementById("filter-toggle");
  const filterPanel = document.getElementById("filter-panel");
  const filterCount = document.getElementById("filter-count");
  const filterType = document.getElementById("filter-type");
  const filterLocation = document.getElementById("filter-location");
  const filterStatus = document.getElementById("filter-status");

  if (!table) return;

  const PAGE_SIZE = 10;
  const TYPE_LABELS = {
    cctv_camera: "CCTV Camera",
    server: "Server",
    switch: "Switches",
    ups: "UPS",
    ac: "AC",
    access_control: "Access Control System",
  };

  let allItems = [];
  let currentPage = 1;

  function formatText(value) {
    return value || "—";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function statusBadge(status) {
    const value = status || "active";
    return `<span class="status-badge ${value}">${value}</span>`;
  }

  function render() {
    const totalItems = allItems.length;
    totalEl.textContent = totalItems;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = allItems.slice(start, start + PAGE_SIZE);
    const isAdmin = Portal.isAdmin();

    rowsBody.innerHTML = pageItems
      .map(
        (item) => `
      <tr>
        <td>${escapeHtml(item.assetName)}</td>
        <td>${escapeHtml(TYPE_LABELS[item.assetType] || item.assetType)}</td>
        <td>${escapeHtml(formatText(item.serviceTag))}</td>
        <td>${escapeHtml(formatText(item.ipAddress))}</td>
        <td>${escapeHtml(formatText(item.rackLocation))}</td>
        <td>${statusBadge(item.status)}</td>
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

  function updateFilterCount() {
    const active = [filterType.value, filterLocation.value, filterStatus.value].filter(Boolean).length;
    filterCount.textContent = String(active);
    filterCount.hidden = active === 0;
  }

  async function load() {
    const params = new URLSearchParams();
    const q = searchInput.value.trim();
    if (q) params.set("q", q);
    if (filterType.value) params.set("type", filterType.value);
    if (filterLocation.value) params.set("location", filterLocation.value);
    if (filterStatus.value) params.set("status", filterStatus.value);
    updateFilterCount();
    try {
      const res = await fetch("/api/data-centre-assets?" + params.toString());
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

  filterToggle.addEventListener("click", () => {
    const open = filterPanel.hidden;
    filterPanel.hidden = !open;
    filterToggle.setAttribute("aria-expanded", String(open));
  });

  [filterType, filterLocation, filterStatus].forEach((select) => {
    select.addEventListener("change", load);
  });

  clearFilterBtn.addEventListener("click", () => {
    searchInput.value = "";
    filterType.value = "";
    filterLocation.value = "";
    filterStatus.value = "";
    load();
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
  const modal = document.getElementById("dc-modal");
  if (modal) {
    const form = document.getElementById("dc-form");
    const title = document.getElementById("dc-modal-title");
    const submitBtn = document.getElementById("dc-submit-btn");
    const errorEl = document.getElementById("dc-form-error");
    const editIdInput = document.getElementById("dc-edit-id");
    const fields = {
      assetName: document.getElementById("dc-asset-name"),
      assetType: document.getElementById("dc-asset-type"),
      serviceTag: document.getElementById("dc-service-tag"),
      ipAddress: document.getElementById("dc-ip-address"),
      rackLocation: document.getElementById("dc-rack-location"),
      installDate: document.getElementById("dc-install-date"),
      warrantyExpiry: document.getElementById("dc-warranty-expiry"),
      status: document.getElementById("dc-status"),
      location: document.getElementById("dc-location"),
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
        title.textContent = "Edit Asset";
        submitBtn.textContent = "Update Asset";
        fields.assetName.value = item.assetName || "";
        fields.assetType.value = item.assetType || "server";
        fields.serviceTag.value = item.serviceTag || "";
        fields.ipAddress.value = item.ipAddress || "";
        fields.rackLocation.value = item.rackLocation || "";
        fields.installDate.value = toDateInput(item.installDate);
        fields.warrantyExpiry.value = toDateInput(item.warrantyExpiry);
        fields.status.value = item.status || "active";
        fields.location.value = item.location || "islamabad";
      } else {
        editIdInput.value = "";
        title.textContent = "Add Asset";
        submitBtn.textContent = "Add Asset";
      }
      modal.hidden = false;
    }

    function closeModal() {
      modal.hidden = true;
    }

    document.getElementById("add-dc-btn")?.addEventListener("click", () => openModal({ mode: "add" }));
    modal.querySelectorAll("[data-close-dc-modal]").forEach((el) => el.addEventListener("click", closeModal));

    rowsBody.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-edit-id]");
      if (editBtn) {
        const item = allItems.find((i) => i._id === editBtn.dataset.editId);
        if (item) openModal({ mode: "edit", item });
        return;
      }
      const deleteBtn = event.target.closest("[data-id]");
      if (!deleteBtn) return;
      if (!confirm("Delete this asset?")) return;
      deleteBtn.disabled = true;
      fetch("/api/data-centre-assets/" + deleteBtn.dataset.id, {
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
        const res = await fetch(editId ? "/api/data-centre-assets/" + editId : "/api/data-centre-assets", {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + Portal.getToken() },
          body: JSON.stringify({
            assetName: fields.assetName.value.trim(),
            assetType: fields.assetType.value,
            serviceTag: fields.serviceTag.value.trim(),
            ipAddress: fields.ipAddress.value.trim(),
            rackLocation: fields.rackLocation.value.trim(),
            installDate: fields.installDate.value || null,
            warrantyExpiry: fields.warrantyExpiry.value || null,
            status: fields.status.value,
            location: fields.location.value,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          errorEl.textContent = data.message || "Unable to save the asset.";
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
