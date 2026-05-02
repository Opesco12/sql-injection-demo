const modeButtons = document.querySelectorAll(".mode-btn");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usersTableBody = document.getElementById("users-table-body");
const generatedQueryBlock = document.getElementById("generated-query");
const queryParametersBlock = document.getElementById("query-parameters");
const queryResultBlock = document.getElementById("query-result");
const resultMessage = document.getElementById("result-message");
const modeBadge = document.getElementById("mode-badge");
const modeExplanation = document.getElementById("mode-explanation");
const paramsBlock = document.getElementById("params-block");
const exampleButtons = document.querySelectorAll(".example-buttons button");
const passwordToggle = document.querySelector("[data-toggle-password]");
const EYE_ICON =
  '<span class="icon-eye" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 5C6.5 5 2.1 8.4.5 12c1.6 3.6 6 7 11.5 7s9.9-3.4 11.5-7C21.9 8.4 17.5 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/><circle cx="12" cy="12" r="2"/></svg></span>';
const EYE_OFF_ICON =
  '<span class="icon-eye" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M2.7 3.8 1.3 5.2l3 3C2.7 9.4 1.4 10.9.5 12c1.6 3.6 6 7 11.5 7 2 0 3.8-.4 5.4-1.1l3.1 3.1 1.4-1.4L2.7 3.8zM12 16a4 4 0 0 1-4-4c0-.7.2-1.4.5-2l5.5 5.5c-.6.3-1.3.5-2 .5zm9.5-4c-1.6-3.6-6-7-11.5-7-1.4 0-2.7.2-3.9.6l2.4 2.4c.5-.2 1-.3 1.5-.3a4 4 0 0 1 4 4c0 .5-.1 1-.3 1.5l3.8 3.8c1.8-1.2 3.2-2.9 4-5z"/></svg></span>';

let currentMode = "vulnerable";

const modeText = {
  vulnerable: {
    label: "Vulnerable Mode",
    explanation:
      "Input is inserted directly into the SQL string. Attackers can manipulate query logic.",
  },
  protected: {
    label: "Protected Mode",
    explanation:
      "Parameterized queries treat input as data. User values cannot alter SQL structure.",
  },
};

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateModeUI() {
  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === currentMode);
  });

  const isProtected = currentMode === "protected";
  modeBadge.textContent = modeText[currentMode].label;
  modeBadge.classList.toggle("protected", isProtected);
  modeBadge.classList.toggle("vulnerable", !isProtected);
  modeExplanation.innerHTML = `<strong>${escapeHtml(modeText[currentMode].label)}:</strong> ${escapeHtml(modeText[currentMode].explanation)}`;
  paramsBlock.classList.toggle("hidden", !isProtected);
}

function setResultMessage(message, isSuccess) {
  resultMessage.textContent = message;
  resultMessage.classList.remove("neutral", "success", "error");
  resultMessage.classList.add(isSuccess ? "success" : "error");
}

async function loadUsers() {
  const response = await fetch("/api/users");
  const data = await response.json();

  if (!data.success) {
    usersTableBody.innerHTML = '<tr><td colspan="4">Failed to load users.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = data.users
    .map(
      (user) => `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.password)}</td>
        <td>${escapeHtml(user.role)}</td>
      </tr>
    `
    )
    .join("");
}

function renderLoginOutcome(payload) {
  generatedQueryBlock.textContent = payload.generatedQuery || "No query generated.";

  if (payload.mode === "protected") {
    paramsBlock.classList.remove("hidden");
    queryParametersBlock.textContent = JSON.stringify(payload.parameters || [], null, 2);
  } else {
    paramsBlock.classList.add("hidden");
    queryParametersBlock.textContent = "[]";
  }

  queryResultBlock.textContent = JSON.stringify(payload.result, null, 2) || "null";
  setResultMessage(payload.message || "No message.", Boolean(payload.success));
}

async function handleLogin(event) {
  event.preventDefault();

  const endpoint =
    currentMode === "vulnerable" ? "/api/login-vulnerable" : "/api/login-safe";

  const payload = {
    username: usernameInput.value,
    password: passwordInput.value,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  renderLoginOutcome(data);
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    updateModeUI();
  });
});

exampleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    usernameInput.value = btn.dataset.username || "";
    passwordInput.value = btn.dataset.password || "";
  });
});

loginForm.addEventListener("submit", handleLogin);

updateModeUI();
loadUsers();
