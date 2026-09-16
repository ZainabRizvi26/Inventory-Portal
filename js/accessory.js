(function () {
  const searchInput = document.getElementById("accessory-search");
  const rowsBody = document.getElementById("accessory-rows");
  const table = document.getElementById("accessory-table");
  const emptyState = document.getElementById("table-empty");
  const totalEl = document.getElementById("total-accessories");
  const showingText = document.getElementById("showing-text");
  const clearFilterBtn = document.getElementById("clear-filter");
  const pageButtons = document.querySelectorAll(".pagination button");
  const activePageBtn = document.querySelector(".pagination button.active");
  const filterToggle = document.getElementById("filter-toggle");
  const filterPanel = document.getElementById("filter-panel");
  const filterCount = document.getElementById("filter-count");
  const filterType = document.getElementById("filter-type");
  const filterLocation = document.getElementById("filter-location");
  const filterStatus = document.getElementById("filter-status");
  const filterUsername = document.getElementById("filter-username");

  if (!table) return;

  const PAGE_SIZE = 10;
  const TYPE_LABELS = {
    laptop: "Laptop",
    lcd: "LCD",
    keyboard_mouse: "Keyboard / Mouse",
    docking_station: "Docking Station",
    printer: "Printer",
    network_printer: "Network Printer",
  };

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
        <td>${escapeHtml(item.deviceName)}</td>
        <td>${escapeHtml(TYPE_LABELS[item.deviceType] || item.deviceType)}</td>
        <td>${escapeHtml(item.serviceTag) || "—"}</td>
        <td>${formatDate(item.shipDate)}</td>
        <td>${formatDate(item.expiryDate)}</td>
        <td>${escapeHtml(item.username || item.customAccMainU) || "—"}</td>
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

    if (activePageBtn) activePageBtn.textContent = String(currentPage);
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
    const active = [filterType.value, filterLocation.value, filterStatus.value, filterUsername.value].filter(Boolean).length;
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
    if (filterUsername.value.trim()) params.set("username", filterUsername.value.trim());
    updateFilterCount();
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

  filterToggle.addEventListener("click", () => {
    const open = filterPanel.hidden;
    filterPanel.hidden = !open;
    filterToggle.setAttribute("aria-expanded", String(open));
  });

  [filterType, filterLocation, filterStatus].forEach((select) => {
    select.addEventListener("change", load);
  });

  let usernameDebounce;
  filterUsername.addEventListener("input", () => {
    clearTimeout(usernameDebounce);
    usernameDebounce = setTimeout(load, 250);
  });

  clearFilterBtn.addEventListener("click", () => {
    searchInput.value = "";
    filterType.value = "";
    filterLocation.value = "";
    filterStatus.value = "";
    filterUsername.value = "";
    load();
  });

  document.querySelector('[data-page="first"]')?.addEventListener("click", () => { currentPage = 1; render(); });
  document.querySelector('[data-page="prev"]')?.addEventListener("click", () => { if (currentPage > 1) { currentPage--; render(); } });
  document.querySelector('[data-page="next"]')?.addEventListener("click", () => { currentPage++; render(); });
  document.querySelector('[data-page="last"]')?.addEventListener("click", () => { currentPage = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE)); render(); });

  document.querySelectorAll(".chev-btn").forEach((toggle) => {
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
      deviceName: document.getElementById("acc-device-name"),
      deviceType: document.getElementById("acc-device-type"),
      serviceTag: document.getElementById("acc-service-tag"),
      shipTag: document.getElementById("acc-ship-tag"),
      shipDate: document.getElementById("acc-ship-date"),
      expiryDate: document.getElementById("acc-expiry-date"),
      username: document.getElementById("acc-username"),
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
        fields.deviceName.value = item.deviceName || "";
        fields.deviceType.value = item.deviceType || "laptop";
        fields.serviceTag.value = item.serviceTag || "";
        fields.shipTag.value = item.shipTag || "";
        fields.shipDate.value = toDateInput(item.shipDate);
        fields.expiryDate.value = toDateInput(item.expiryDate);
        fields.username.value = item.username || "";
        fields.status.value = item.status || "available";
        fields.location.value = item.location || "islamabad";
      } else {
        editIdInput.value = "";
        title.textContent = "Add Accessory";
        submitBtn.textContent = "Add Accessory";
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
        const res = await fetch(editId ? "/api/accessories/" + editId : "/api/accessories", {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + Portal.getToken() },
          body: JSON.stringify({
            deviceName: fields.deviceName.value.trim(),
            deviceType: fields.deviceType.value,
            serviceTag: fields.serviceTag.value.trim(),
            shipTag: fields.shipTag.value.trim(),
            shipDate: fields.shipDate.value || null,
            expiryDate: fields.expiryDate.value || null,
            username: fields.username.value.trim(),
            status: fields.status.value,
            location: fields.location.value,
          }),
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

  if (Portal.getLocation()) filterLocation.value = Portal.getLocation();
  load();
})();
