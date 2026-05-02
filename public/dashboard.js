const userRaw = localStorage.getItem("sqlDemoUser");

if (!userRaw) {
  window.location.href = "/login";
}

let user;
try {
  user = JSON.parse(userRaw);
} catch (error) {
  localStorage.removeItem("sqlDemoUser");
  window.location.href = "/login";
}

if (user) {
  document.getElementById("welcome-line").textContent = `Welcome, ${user.username}. Role: ${user.role}.`;
  document.getElementById("user-json").textContent = JSON.stringify(user, null, 2);
}

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("sqlDemoUser");
  window.location.href = "/login";
});
