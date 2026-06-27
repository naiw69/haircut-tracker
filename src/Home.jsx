// HomePage.jsx
import { useState, useEffect } from "react";
import GalleryScreen from "./assets/screens/GalleryScreen";
import StatsScreen from "./assets/screens/StatsScreen";
import AddScreen from "./assets/screens/AddScreen";
import { supabase } from "./supabaseClient";

export default function HomePage() {
  const [tab, setTab] = useState("gallery");
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const screens = {
    gallery: {
      title: "Gallery",
      component: <GalleryScreen onAddNew={() => setTab("add")} theme={theme} />,
    },
    data: {
      title: "Statistics",
      component: <StatsScreen theme={theme} />,
    },
    add: {
      title: "Add haircut",
      sub: "Log a new style",
      component: <AddScreen onSave={() => setTab("gallery")} theme={theme} />,
    },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{screens[tab].title}</h1>
          <p style={s.sub}>{screens[tab].sub}</p>
        </div>
        <button style={s.avatarBtn} onClick={() => setProfileOpen(true)}>
          <UserIcon color="var(--text-primary)" />
        </button>
      </div>

      <div style={s.screen}>{screens[tab].component}</div>

      <nav style={s.tabBar}>
        <TabBtn
          icon={<GridIcon />}
          active={tab === "gallery"}
          onClick={() => setTab("gallery")}
        />
        <TabBtn
          icon={<PlusIcon />}
          active={tab === "add"}
          onClick={() => setTab("add")}
          isAdd
        />
        <TabBtn
          icon={<BarIcon />}
          active={tab === "data"}
          onClick={() => setTab("data")}
        />
      </nav>

      {/* Profile Modal */}
      {profileOpen && (
        <ProfileModal user={user} theme={theme} setTheme={setTheme} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}

/* ─── Profile Modal ─────────────────────────────────────────── */
function ProfileModal({ user, onClose, theme, setTheme }) {
  const [view, setView] = useState("menu"); // "menu" | "username" | "password"
  const [username, setUsername] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveUsername = () => {
    if (!username.trim()) return showToast("Username can't be empty.", "error");
    showToast("Username updated!");
    setUsername("");
    setView("menu");
  };

  const handleSavePassword = () => {
    if (!currentPw || !newPw || !confirmPw)
      return showToast("Please fill all fields.", "error");
    if (newPw !== confirmPw)
      return showToast("Passwords don't match.", "error");
    if (newPw.length < 6)
      return showToast("Password must be 6+ chars.", "error");
    showToast("Password updated!");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setView("menu");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  return (
    <>
      {/* Backdrop */}
      <div style={m.backdrop} onClick={onClose} />

      {/* Sheet */}
      <div style={m.sheet}>
        {/* Drag handle */}
        <div style={m.handle} />

        {/* Toast */}
        {toast && (
          <div style={{ ...m.toast, background: toast.type === "error" ? "#ff3b30" : "var(--btn-primary-bg)" }}>
            {toast.msg}
          </div>
        )}

        {view === "menu" && (
          <>
            <div style={m.avatarRow}>
              <div style={m.bigAvatar}><UserIcon size={28} color="var(--bg-primary)" /></div>
              <div>
                <p style={m.name}>{user?.user_metadata?.full_name || "My Account"}</p>
                <p style={m.email}>Manage your profile</p>
              </div>
            </div>

            <div style={m.divider} />

            <MenuItem
              icon={<EditIcon />}
              label="Change Username"
              onClick={() => setView("username")}
            />
            <MenuItem
              icon={<LockIcon />}
              label="Change Password"
              onClick={() => setView("password")}
            />
            <MenuItem
              icon={theme === "dark" ? <SunIcon /> : <MoonIcon />}
              label={theme === "dark" ? "Light Mode" : "Dark Mode"}
              onClick={toggleTheme}
            />

            <div style={m.divider} />

            <MenuItem
              icon={<LogoutIcon />}
              label="Log Out"
              danger
              onClick={handleLogout}
            />
          </>
        )}

        {view === "username" && (
          <>
            <BackHeader title="Change Username" onBack={() => setView("menu")} />
            <p style={m.fieldLabel}>New username</p>
            <input
              style={m.input}
              placeholder="Enter new username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
            <button style={m.saveBtn} onClick={handleSaveUsername}>Save</button>
          </>
        )}

        {view === "password" && (
          <>
            <BackHeader title="Change Password" onBack={() => setView("menu")} />
            <p style={m.fieldLabel}>Current password</p>
            <input
              style={m.input}
              type="password"
              placeholder="••••••••"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              autoFocus
            />
            <p style={m.fieldLabel}>New password</p>
            <input
              style={m.input}
              type="password"
              placeholder="••••••••"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
            />
            <p style={m.fieldLabel}>Confirm new password</p>
            <input
              style={m.input}
              type="password"
              placeholder="••••••••"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
            />
            <button style={m.saveBtn} onClick={handleSavePassword}>Save</button>
          </>
        )}
      </div>
    </>
  );
}

function BackHeader({ title, onBack }) {
  return (
    <div style={m.backHeader}>
      <button style={m.backBtn} onClick={onBack}>
        <ChevronLeft />
      </button>
      <p style={m.backTitle}>{title}</p>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button style={m.menuItem} onClick={onClick}>
      <span style={{ color: danger ? "#ff3b30" : "var(--text-secondary)", display: "flex" }}>{icon}</span>
      <span style={{ ...m.menuLabel, color: danger ? "#ff3b30" : "var(--text-primary)" }}>{label}</span>
      {!danger && <span style={m.chevron}><ChevronRight /></span>}
    </button>
  );
}

/* ─── Tab Button ────────────────────────────────────────────── */
function TabBtn({ icon, label, active, onClick, isAdd }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...s.tabBtn,
        ...(isAdd ? s.tabAdd : {}),
        ...(active && !isAdd ? s.tabBtnActive : {}),
      }}
    >
      <span style={{ display: "flex", color: isAdd ? "var(--btn-primary-text)" : active ? "var(--text-primary)" : "var(--text-tertiary)" }}>
        {icon}
      </span>
      {label && (
        <span style={{ fontSize: 11, fontWeight: 500, color: isAdd ? "var(--btn-primary-text)" : active ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          {label}
        </span>
      )}
    </button>
  );
}

/* ─── Icons ─────────────────────────────────────────────────── */
const UserIcon = ({ size = 18, color = "#0a0a0a" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const GridIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const BarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

/* ─── Styles ─────────────────────────────────────────────────── */
const s = {
  container: {
    maxWidth: 390,
    margin: "0 auto",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "sans-serif",
    background: "var(--bg-primary)",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    padding: "52px 22px 12px",
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: { fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 },
  sub: { fontSize: 13, color: "var(--text-tertiary)", margin: "4px 0 0" },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "var(--bg-secondary)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 4,
    transition: "background 0.15s",
  },
  screen: { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" },
  tabBar: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    height: 64,
    borderRadius: 32,
    border: "1px solid var(--border-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 16px",
    background: "var(--tabbar-bg)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "var(--tabbar-shadow)",
    zIndex: 5,
  },
  tabBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: "10px 16px",
    borderRadius: 20,
    transition: "background 0.2s, transform 0.1s",
  },
  tabBtnActive: { background: "none" },
  tabAdd: {
    background: "var(--accent-color)",
    borderRadius: 20,
    padding: "10px 20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
};

const m = {
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "var(--backdrop-bg)",
    zIndex: 10,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "var(--sheet-bg)",
    borderRadius: "20px 20px 0 0",
    padding: "12px 20px 40px",
    zIndex: 11,
    boxShadow: "var(--sheet-shadow)",
    animation: "slideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: "var(--border-medium)",
    margin: "0 auto 20px",
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  bigAvatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "var(--avatar-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  name: { margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" },
  email: { margin: "3px 0 0", fontSize: 13, color: "var(--text-tertiary)" },
  divider: { height: "0.5px", background: "var(--border-light)", margin: "6px 0" },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "13px 4px",
    borderRadius: 10,
    textAlign: "left",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: 500 },
  chevron: { color: "var(--border-medium)", display: "flex" },
  backHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    color: "var(--text-primary)",
  },
  backTitle: { margin: 0, fontSize: 17, fontWeight: 600, color: "var(--text-primary)" },
  fieldLabel: { margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid var(--border-medium)",
    fontSize: 15,
    outline: "none",
    marginBottom: 14,
    boxSizing: "border-box",
    color: "var(--text-primary)",
    background: "var(--bg-tertiary)",
  },
  saveBtn: {
    width: "100%",
    padding: "14px",
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  toast: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    padding: "8px 18px",
    borderRadius: 20,
    whiteSpace: "nowrap",
    zIndex: 99,
  },
};

// Inject slide-up animation
if (typeof document !== "undefined" && !document.getElementById("profile-modal-style")) {
  const style = document.createElement("style");
  style.id = "profile-modal-style";
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}