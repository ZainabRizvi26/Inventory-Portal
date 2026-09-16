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

    const isSuperAdmin = Portal.isSuperAdmin();
    const currentUserId = Portal.getUserId();

    rowsBody.innerHTML = filtered
      .map((u) => {
        const roleLabel = u.isSuperAdmin ? "admin (main)" : u.role;
        let actionsCell = "";
        if (isSuperAdmin) {
          if (u.isSuperAdmin || String(u._id) === String(currentUserId)) {
            actionsCell = "<td>—</td>";
          } else if (u.role === "admin") {
            actionsCell = `<td><button class="row-revoke-admin" type="button" data-revoke-id="${u._id}">Remove Admin</button></td>`;
          } else {
            actionsCell = "<td>—</td>";
          }
        }
        return `
      <tr>
        <td>${escapeHtml(u.fullName)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(roleLabel)}</td>
        <td>${escapeHtml(u.location)}</td>
        <td><span class="status-badge ${u.isActive ? "active" : "offline"}">${u.isActive ? "Active" : "Offline"}</span></td>
        <td>${relativeTime(u.lastSeen)}</td>
        ${isSuperAdmin ? actionsCell : ""}
      </tr>`;
      })
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

  rowsBody.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-revoke-id]");
    if (!btn) return;
    const id = btn.dataset.revokeId;
    if (!confirm("Remove this admin's access? They will keep their account and continue as a regular user.")) return;
    btn.disabled = true;
    try {
      const res = await fetch(`/api/users/${id}/revoke-admin`, {
        method: "PUT",
        headers: { Authorization: "Bearer " + Portal.getToken() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Unable to complete this action.");
        return;
      }
      await load();
    } catch {
      alert("Unable to reach the server. Please try again.");
    } finally {
      btn.disabled = false;
    }
  });

  load();
  setInterval(load, 30000);

  // --- Admin signup code management ---
  const codeCard = document.getElementById("admin-code-card");
  if (codeCard && Portal.isSuperAdmin()) {
    const codeValueInput = document.getElementById("admin-code-value");
    const editBtn = document.getElementById("admin-code-edit-btn");
    const editRow = document.getElementById("admin-code-edit-row");
    const newValueInput = document.getElementById("admin-code-new-value");
    const saveBtn = document.getElementById("admin-code-save-btn");
    const cancelBtn = document.getElementById("admin-code-cancel-btn");
    const messageEl = document.getElementById("admin-code-message");

    function setMessage(text, isError) {
      messageEl.textContent = text || "";
      messageEl.classList.toggle("error", !!isError);
      messageEl.classList.toggle("success", !isError && !!text);
    }

    async function loadCode() {
      try {
        const res = await fetch("/api/admin-code", { headers: { Authorization: "Bearer " + Portal.getToken() } });
        const data = await res.json().catch(() => ({}));
        codeValueInput.value = data.code || "—";
      } catch {
        codeValueInput.value = "—";
      }
    }

    editBtn.addEventListener("click", () => {
      editRow.hidden = false;
      newValueInput.value = "";
      setMessage("");
      newValueInput.focus();
    });

    cancelBtn.addEventListener("click", () => {
      editRow.hidden = true;
      setMessage("");
    });

    saveBtn.addEventListener("click", async () => {
      const newCode = newValueInput.value.trim();
      if (newCode.length < 6) {
        setMessage("Admin code must be at least 6 characters.", true);
        return;
      }
      saveBtn.disabled = true;
      try {
        const res = await fetch("/api/admin-code", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + Portal.getToken() },
          body: JSON.stringify({ code: newCode }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.message || "Unable to update the admin code.", true);
          return;
        }
        codeValueInput.value = data.code;
        editRow.hidden = true;
        setMessage("Admin code updated. Anyone signing up as admin must use the new code.", false);
      } catch {
        setMessage("Unable to reach the server. Please try again.", true);
      } finally {
        saveBtn.disabled = false;
      }
    });

    loadCode();
  }
})();
