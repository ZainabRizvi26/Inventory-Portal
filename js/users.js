(function () {
  const content = document.getElementById("users-content");
  const denied = document.getElementById("access-denied");
  if (!content) return;

  if (!Portal.isAdmin()) {
    content.hidden = true;
    denied.hidden = false;
    return;
  }

  const searchInput = document.getElementById("user-search");
  const rowsBody = document.getElementById("users-rows");
  const table = document.getElementById("users-table");
  const emptyState = document.getElementById("table-empty");
  const statTotal = document.getElementById("stat-total-users");
  const statActive = document.getElementById("stat-active-users");
  const statAdmins = document.getElementById("stat-admin-users");

  let allUsers = [];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function relativeTime(value) {
    if (!value) return "Never";
    const diffMs = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + " min ago";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + " hr ago";
    return new Date(value).toLocaleDateString();
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = allUsers.filter((u) => !query || (u.fullName + " " + u.email).toLowerCase().includes(query));

    statTotal.textContent = allUsers.length;
    statActive.textContent = allUsers.filter((u) => u.isActive).length;
    statAdmins.textContent = allUsers.filter((u) => u.role === "admin").length;

    rowsBody.innerHTML = filtered
      .map(
        (u) => `
      <tr>
        <td>${escapeHtml(u.fullName)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${escapeHtml(u.location)}</td>
        <td><span class="status-badge ${u.isActive ? "active" : "offline"}">${u.isActive ? "Active" : "Offline"}</span></td>
        <td>${relativeTime(u.lastSeen)}</td>
      </tr>`
      )
      .join("");

    const hasItems = filtered.length > 0;
    table.hidden = !hasItems;
    emptyState.hidden = hasItems;
  }

  async function load() {
    const token = Portal.getToken();
    try {
      const res = await fetch("/api/users", { headers: { Authorization: "Bearer " + token } });
      if (res.status === 403 || res.status === 401) {
        content.hidden = true;
        denied.hidden = false;
        return;
      }
      const data = await res.json().catch(() => ({ items: [] }));
      allUsers = Array.isArray(data.items) ? data.items : [];
    } catch {
      allUsers = [];
    }
    render();
  }

  searchInput.addEventListener("input", render);

  load();
  setInterval(load, 30000);
})();
