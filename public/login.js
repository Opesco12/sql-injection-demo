const loginForm = document.getElementById("product-login-form");
const messageBox = document.getElementById("product-login-message");

function setMessage(message, type = "neutral") {
  messageBox.classList.remove("neutral", "success", "error");
  messageBox.classList.add(type);
  messageBox.innerHTML = message;
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
