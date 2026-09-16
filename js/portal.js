if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

(function () {
  const KEYS = {
    location: "inventoryPortal.location",
    portal: "inventoryPortal.portalType",
    identifier: "inventoryPortal.resetIdentifier",
    userName: "inventoryPortal.userName",
    userPhoto: "inventoryPortal.userPhoto",
    role: "inventoryPortal.role",
    token: "inventoryPortal.token",
    userId: "inventoryPortal.userId",
    superAdmin: "inventoryPortal.isSuperAdmin",
  };

  function showError(message) {
    const error = document.getElementById("form-error");
    if (!error) return;
    error.textContent = message;
    error.classList.add("show");
  }

  function clearError() {
    const error = document.getElementById("form-error");
    if (error) error.classList.remove("show");
  }

  function save(key, value) {
    sessionStorage.setItem(key, value);
  }

  function read(key) {
    return sessionStorage.getItem(key);
  }

  window.Portal = {
    setLocation(id) {
      save(KEYS.location, id);
    },
    getLocation() {
      return read(KEYS.location);
    },
    setPortalType(type) {
      save(KEYS.portal, type);
    },
    getPortalType() {
      return read(KEYS.portal);
    },
    setResetIdentifier(value) {
      save(KEYS.identifier, value);
    },
    setUser(name, photo) {
      save(KEYS.userName, name);
      if (photo) save(KEYS.userPhoto, photo);
    },
    getUserName() {
      return read(KEYS.userName);
    },
    getUserPhoto() {
      return read(KEYS.userPhoto);
    },
    setRole(role) {
      save(KEYS.role, role);
    },
    getRole() {
      return read(KEYS.role);
    },
    isAdmin() {
      return read(KEYS.role) === "admin";
    },
    getToken() {
      return read(KEYS.token);
    },
    setUserId(id) {
      save(KEYS.userId, id);
    },
    getUserId() {
      return read(KEYS.userId);
    },
    setSuperAdmin(value) {
      save(KEYS.superAdmin, value ? "1" : "0");
    },
    isSuperAdmin() {
      return read(KEYS.superAdmin) === "1";
    },
  };

  document.querySelectorAll(".admin-only").forEach((el) => {
    if (!Portal.isAdmin()) {
      el.hidden = true;
      el.style.setProperty("display", "none", "important");
    }
  });

  document.querySelectorAll(".superadmin-only").forEach((el) => {
    if (!Portal.isSuperAdmin()) {
      el.hidden = true;
      el.style.setProperty("display", "none", "important");
    }
  });

  (function heartbeat() {
    const token = Portal.getToken();
    if (!token) return;
    const ping = () => {
      fetch("/api/auth/heartbeat", { method: "POST", headers: { Authorization: "Bearer " + token } }).catch(() => {});
    };
    ping();
    setInterval(ping, 60000);
  })();

  document.querySelectorAll(".site-footer").forEach((footer) => {
    footer.innerHTML = "&copy; 2025 Inventory Portal. All rights reserved. &middot; Created by Zainab Rizvi";
  });

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.getAttribute("data-password-toggle"));
      if (!input) return;
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      button.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
    });
  });

  document.querySelectorAll("[data-segmented]").forEach((group) => {
    const buttons = group.querySelectorAll("button");
    const input = document.getElementById(group.getAttribute("data-input"));
    const icon = document.getElementById(group.getAttribute("data-icon"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.getAttribute("data-mode");
        if (input) {
          input.placeholder =
            mode === "email" ? "Enter your email address" : "Enter username";
          input.type = mode === "email" ? "email" : "text";
          input.name = mode;
        }
        if (icon) {
          icon.innerHTML =
            mode === "email"
              ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>'
              : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M6 19c.8-3.2 3-5 6-5s5.2 1.8 6 5"/></svg>';
        }
      });
    });
  });

  function validateLogin() {
    const identifierInput = loginForm.querySelector('[name="username"], [name="email"]');
    if (!identifierInput) {
      showError("Login form is missing an identifier field.");
      return null;
    }
    const identifier = identifierInput.value.trim();
    const password = loginForm.querySelector('[name="password"]')?.value ?? "";
    if (!identifier || !password) {
      showError("Please enter your credentials.");
      return null;
    }
    return { identifier, password };
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = validateLogin();
      if (!values) return;
      clearError();
      const submitButton = loginForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      try {
        const role = Portal.getPortalType() || "user";
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: values.identifier, password: values.password, role }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showError(data.message || "Unable to sign in.");
          return;
        }
        sessionStorage.setItem("inventoryPortal.token", data.token);
        Portal.setUser(data.user.fullName);
        Portal.setRole(data.user.role);
        Portal.setUserId(data.user.id);
        Portal.setSuperAdmin(data.user.isSuperAdmin);
        window.location.href = data.user.role === "admin" ? "dashboard-admin.html" : "dashboard.html";
      } catch {
        showError("Unable to reach the server. Please try again.");
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  function validateForgot() {
    const identifier = document.getElementById("identifier").value.trim();
    if (!identifier) {
      showError("Please enter your username or email.");
      return null;
    }
    return { identifier };
  }

  const forgotForm = document.getElementById("forgot-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = validateForgot();
      if (!values) return;
      Portal.setResetIdentifier(values.identifier);
      window.location.href = "reset-password.html";
    });
  }

  function validateReset() {
    const password = document.getElementById("new-password").value;
    const confirm = document.getElementById("confirm-password").value;
    if (password.length < 8) {
      showError("Password must be at least 8 characters.");
      return null;
    }
    if (password !== confirm) {
      showError("Passwords do not match.");
      return null;
    }
    return { password };
  }

  const resetForm = document.getElementById("reset-form");
  if (resetForm) {
    resetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateReset()) return;
      window.location.href = "login.html?reset=1";
    });
  }

  if (document.getElementById("login-form") && new URLSearchParams(location.search).get("reset") === "1") {
    const toast = document.getElementById("toast");
    if (toast) toast.classList.add("show");
  }

  function validateSignup() {
    const required = ["full-name", "dob", "email", "phone", "location", "password", "confirm-password"];
    const missing = required.some((id) => !document.getElementById(id).value.trim());
    if (missing) {
      showError("Please complete all fields.");
      return null;
    }
    if (!document.getElementById("terms").checked) {
      showError("Please agree to the Terms and Conditions and Privacy Policy.");
      return null;
    }
    if (document.getElementById("password").value !== document.getElementById("confirm-password").value) {
      showError("Passwords do not match.");
      return null;
    }
    const activeRole = document.querySelector("[data-role-toggle] button.active")?.getAttribute("data-role");
    if (activeRole === "admin" && !document.getElementById("admin-code").value.trim()) {
      showError("Please enter the admin code.");
      return null;
    }
    return { fullName: document.getElementById("full-name").value.trim() };
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    const locationSelect = document.getElementById("location");
    const saved = Portal.getLocation();
    if (saved && locationSelect) locationSelect.value = saved;

    const adminCodeField = document.getElementById("admin-code-field");
    let signupRole = "user";
    document.querySelectorAll("[data-role-toggle] button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-role-toggle] button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        signupRole = btn.getAttribute("data-role");
        if (adminCodeField) adminCodeField.hidden = signupRole !== "admin";
      });
    });

    const photoInput = document.getElementById("photo");
    const preview = document.getElementById("photo-preview");
    let uploadedPhoto = "";
    photoInput?.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Photo must be 2MB or smaller.");
        photoInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        uploadedPhoto = reader.result;
        const img = document.createElement("img");
        img.alt = "Uploaded photo";
        img.src = reader.result;
        preview.replaceChildren(img);
      };
      reader.readAsDataURL(file);
    });

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = validateSignup();
      if (!values) return;
      clearError();
      const submitButton = signupForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      try {
        const body = {
          fullName: values.fullName,
          email: document.getElementById("email").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          dob: document.getElementById("dob").value,
          location: document.getElementById("location").value,
          password: document.getElementById("password").value,
          role: signupRole,
        };
        if (signupRole === "admin") {
          body.adminCode = document.getElementById("admin-code").value.trim();
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showError(data.message || "Unable to create the account.");
          return;
        }
        sessionStorage.setItem("inventoryPortal.token", data.token);
        Portal.setUser(values.fullName, uploadedPhoto);
        Portal.setRole(data.user.role);
        Portal.setUserId(data.user.id);
        Portal.setSuperAdmin(data.user.isSuperAdmin);
        window.location.href = "account-created.html";
      } catch {
        showError("Unable to reach the server. Please try again.");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
  const changePasswordModal = document.getElementById("change-password-modal");
  if (changePasswordModal) {
    const form = document.getElementById("change-password-form");
    const errorEl = document.getElementById("change-password-error");
    const successEl = document.getElementById("change-password-success");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorEl.textContent = "";
      successEl.textContent = "";
      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      if (!currentPassword || !newPassword) {
        errorEl.textContent = "Please fill in both current and new password.";
        return;
      }
      if (newPassword.length < 8) {
        errorEl.textContent = "New password must be at least 8 characters.";
        return;
      }
      if (currentPassword === newPassword) {
        errorEl.textContent = "New password must be different from the current password.";
        return;
      }
      const token = sessionStorage.getItem("inventoryPortal.token");
      const submitButton = form.querySelector(".modal-submit");
      submitButton.disabled = true;
      try {
        if (token) {
          const res = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ currentPassword, newPassword }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            errorEl.textContent = data.message || "Unable to change the password right now.";
            return;
          }
          successEl.textContent = data.message || "Password changed successfully.";
        } else {
          successEl.textContent = "Password changed successfully.";
        }
        form.reset();
      } catch {
        errorEl.textContent = "Unable to reach the server. Please try again.";
      } finally {
        submitButton.disabled = false;
      }
    });
  }
})();
