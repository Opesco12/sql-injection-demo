const loginForm = document.getElementById("product-login-form");
const messageBox = document.getElementById("product-login-message");
const passwordInput = document.getElementById("password");
const passwordToggle = document.querySelector("[data-toggle-password]");
const EYE_ICON =
  '<span class="icon-eye" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 5C6.5 5 2.1 8.4.5 12c1.6 3.6 6 7 11.5 7s9.9-3.4 11.5-7C21.9 8.4 17.5 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/><circle cx="12" cy="12" r="2"/></svg></span>';
const EYE_OFF_ICON =
  '<span class="icon-eye" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M2.7 3.8 1.3 5.2l3 3C2.7 9.4 1.4 10.9.5 12c1.6 3.6 6 7 11.5 7 2 0 3.8-.4 5.4-1.1l3.1 3.1 1.4-1.4L2.7 3.8zM12 16a4 4 0 0 1-4-4c0-.7.2-1.4.5-2l5.5 5.5c-.6.3-1.3.5-2 .5zm9.5-4c-1.6-3.6-6-7-11.5-7-1.4 0-2.7.2-3.9.6l2.4 2.4c.5-.2 1-.3 1.5-.3a4 4 0 0 1 4 4c0 .5-.1 1-.3 1.5l3.8 3.8c1.8-1.2 3.2-2.9 4-5z"/></svg></span>';

function setMessage(message, type = "neutral") {
  messageBox.classList.remove("neutral", "success", "error");
  messageBox.classList.add(type);
  messageBox.innerHTML = message;
}

if (passwordInput && passwordToggle) {
  passwordToggle.innerHTML = EYE_ICON;
  passwordToggle.addEventListener("click", () => {
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(showPassword));
    passwordToggle.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    passwordToggle.innerHTML = showPassword ? EYE_OFF_ICON : EYE_ICON;
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    setMessage(data.message || "Login failed.", "error");
    return;
  }

  localStorage.setItem("sqlDemoUser", JSON.stringify(data.user));
  setMessage("Login successful. Redirecting...", "success");
  setTimeout(() => {
    window.location.href = "/dashboard";
  }, 500);
});
