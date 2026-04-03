// HomePage.jsx
import { useState } from "react";
import GalleryScreen from "./assets/screens/GalleryScreen";
import StatsScreen from "./assets/screens/StatsScreen";
import AddScreen from "./assets/screens/AddScreen";

export default function HomePage() {
  const [tab, setTab] = useState("gallery");

  const screens = {
    gallery: {
      title: "Gallery",
      sub: "Your haircut collection",
      component: <GalleryScreen />,
    },
    data: {
      title: "Stats",
      sub: "Insights on your cuts",
      component: <StatsScreen />,
    },
    add: {
      title: "Add haircut",
      sub: "Log a new style",
      component: <AddScreen onSave={() => setTab("gallery")} />,
    },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{screens[tab].title}</h1>
          <p style={s.sub}>{screens[tab].sub}</p>
        </div>
      </div>

      <div style={s.screen}>{screens[tab].component}</div>

      <nav style={s.tabBar}>
        <TabBtn
          icon={<GridIcon />}
          label="Gallery"
          active={tab === "gallery"}
          onClick={() => setTab("gallery")}
        />
        <TabBtn
          icon={<PlusIcon />}
          label="New"
          active={tab === "add"}
          onClick={() => setTab("add")}
          isAdd
        />
        <TabBtn
          icon={<BarIcon />}
          label="Stats"
          active={tab === "data"}
          onClick={() => setTab("data")}
        />
      </nav>
    </div>
  );
}

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
      <span
        style={{
          display: "flex",
          color: isAdd ? "#fff" : active ? "#0a0a0a" : "#bbb",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: isAdd ? "#fff" : active ? "#0a0a0a" : "#aaa",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// SVG icons
const GridIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const BarIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const s = {
  container: {
    maxWidth: 390,
    margin: "0 auto",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "sans-serif",
    background: "#fff",
  },
  header: { padding: "52px 22px 12px", flexShrink: 0 },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "#0a0a0a",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  sub: { fontSize: 13, color: "#888", margin: "4px 0 0" },
  screen: { flex: 1, overflowY: "auto", paddingBottom: 80 },
  tabBar: {
    height: 72,
    borderTop: "0.5px solid #e8e8e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 8px 10px",
    background: "#fff",
    flexShrink: 0,
  },
  tabBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: 12,
  },
  tabBtnActive: { background: "#f3f3f3" },
  tabAdd: { background: "#0a0a0a", borderRadius: 20, padding: "10px 20px" },
};
