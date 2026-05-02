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
