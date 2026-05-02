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

const roleConfig = {
  administrator: {
    banner: "Administrator Workspace",
    copy: "Monitor platform activity, manage roles, and drive security readiness.",
    kpis: [
      { label: "Active Users", value: "1,284" },
      { label: "Open Alerts", value: "7" },
      { label: "Auth Success Rate", value: "98.3%" },
      { label: "Policy Coverage", value: "92%" },
    ],
    activity: [
      "Approved access request for developer team.",
      "Investigated unusual login pattern from demo environment.",
      "Reviewed SQL injection training completion report.",
      "Published updated secure query policy.",
    ],
    actions: ["Create Report", "Review Access", "Open Security Center"],
  },
  developer: {
    banner: "Developer Workspace",
    copy: "Track engineering flow, monitor fixes, and validate secure coding patterns.",
    kpis: [
      { label: "Assigned Tickets", value: "14" },
      { label: "PRs Open", value: "3" },
      { label: "Build Health", value: "Green" },
      { label: "Security Tasks", value: "5" },
    ],
    activity: [
      "Merged patch for protected SQL endpoint.",
      "Completed secure login UI improvements.",
      "Reviewed API response formatting updates.",
      "Planned regression test checklist for auth flow.",
    ],
    actions: ["Open Tasks", "Run Local Tests", "View Demo Lab"],
  },
  viewer: {
    banner: "Viewer Workspace",
    copy: "Stay informed with key updates and explore the demo experience safely.",
    kpis: [
      { label: "New Updates", value: "6" },
      { label: "Completed Lessons", value: "12" },
      { label: "Bookmarks", value: "9" },
      { label: "Lab Sessions", value: "4" },
    ],
    activity: [
      "Viewed secure coding best practices module.",
      "Bookmarked SQL injection defense checklist.",
      "Completed dashboard onboarding walkthrough.",
      "Visited demo panel comparison section.",
    ],
    actions: ["Continue Learning", "Open Demo Lab", "Review Notes"],
  },
};

const normalizedRole = (user?.role || "viewer").toLowerCase();
const profile = roleConfig[normalizedRole] || roleConfig.viewer;
const byId = (id) => document.getElementById(id);

const dashboardTitle = byId("dashboard-title");
if (dashboardTitle) {
  dashboardTitle.textContent = normalizedRole === "administrator" ? "Admin Dashboard" : "Dashboard";
}

const dashboardSubtitle = byId("dashboard-subtitle");
if (dashboardSubtitle) dashboardSubtitle.textContent = `Signed in as ${user.username}.`;

const heroHeading = byId("hero-heading");
if (heroHeading) heroHeading.textContent = profile.banner;

const heroCopy = byId("hero-copy");
if (heroCopy) heroCopy.textContent = profile.copy;

const rolePill = byId("role-pill");
if (rolePill) rolePill.textContent = user.role;

const welcomeLine = byId("welcome-line");
if (welcomeLine) welcomeLine.textContent = `Welcome, ${user.username}. Role: ${user.role}.`;

const userJson = byId("user-json");
if (userJson) userJson.textContent = JSON.stringify(user, null, 2);

const kpiGrid = byId("kpi-grid");
if (kpiGrid) {
  kpiGrid.innerHTML = profile.kpis
    .map(
      (item) => `
        <article class="kpi-card">
          <p>${item.label}</p>
          <strong>${item.value}</strong>
        </article>
      `
    )
    .join("");
}

const activityList = byId("activity-list");
if (activityList) {
  activityList.innerHTML = profile.activity.map((entry) => `<li>${entry}</li>`).join("");
}

const quickActions = byId("quick-actions");
if (quickActions) {
  quickActions.innerHTML = profile.actions
    .map((action) => `<button type="button">${action}</button>`)
    .join("");
}

if (normalizedRole === "administrator") {
  const adminSection = byId("admin-section");
  if (adminSection) adminSection.classList.remove("hidden");
}

const logoutBtn = byId("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("sqlDemoUser");
    window.location.href = "/login";
  });
}
