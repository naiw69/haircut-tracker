// screens/GalleryScreen.jsx
import { useState, useEffect, useCallback } from "react"; // 1. Add useCallback
import { supabase } from "../../supabaseClient";

export default function GalleryScreen({ onAddNew }) {
  const [cuts, setCuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const FILTERS = ["All", "Short", "Fade", "Medium", "Bold", "Classic"];

  // 1. Define the function first
 const fetchCuts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return; // Guard clause if no user is found

      const { data, error } = await supabase
        .from("haircuts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (!error) setCuts(data || []);
    } catch (err) {
      console.error("Error fetching cuts:", err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty array means this function is stable and won't change

  // 3. Now the effect is safe and won't cause cascading renders
  useEffect(() => {
    fetchCuts();
  }, [fetchCuts]); 

  const deleteCut = async (id) => {
    if (!window.confirm("Delete this haircut?")) return;
    await supabase.from("haircuts").delete().eq("id", id);
    setSelected(null);
    fetchCuts();
  };



  const filtered = cuts.filter((c) => {
    const matchFilter = filter === "All" || c.category === filter;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.barber?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Detail view
  if (selected)
    return (
      <DetailView
        cut={selected}
        onBack={() => setSelected(null)}
        onDelete={() => deleteCut(selected.id)}
      />
    );

  // Gallery view
  return (
    <div style={s.container}>
      <div style={s.header}>
        <p style={s.sub}>
          {cuts.length} haircut{cuts.length !== 1 ? "s" : ""} logged
        </p>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <div style={s.searchBox}>
          <SearchIcon />
          <input
            style={s.searchInput}
            placeholder="Search cuts, barbers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch("")}>
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        {FILTERS.map((f) => (
          <button
            key={f}
            style={{ ...s.fchip, ...(filter === f ? s.fchipActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sort row */}
      <div style={s.sortRow}>
        <span style={s.countText}>
          {filtered.length} cut{filtered.length !== 1 ? "s" : ""}
        </span>
        <span style={s.sortText}>Newest first</span>
      </div>

      {/* Grid */}
      <div style={s.gridWrap}>
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : (
          <div style={s.grid}>
            {filtered.map((cut) => (
              <div key={cut.id} style={s.card} onClick={() => setSelected(cut)}>
                <div
                  style={{
                    ...s.cardImg,
                    background: cut.photo_url ? "none" : "#f0ece8",
                  }}
                >
                  {cut.photo_url ? (
                    <img
                      src={cut.photo_url}
                      alt={cut.name}
                      style={s.cardPhoto}
                    />
                  ) : (
                    <PlaceholderHair color={cut.hair_color} />
                  )}
                  {cut.rating === "Fire" && <div style={s.badge}>🔥 Fire</div>}
                  <div style={s.cardOverlay}>
                    <div style={s.cardName}>{cut.name}</div>
                    <div style={s.cardMeta}>
                      {new Date(cut.date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · ₱{cut.price}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div style={s.addCard} onClick={onAddNew}>
              <PlusIcon />
              <span style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>
                Add new
              </span>
            </div>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={s.empty}>No cuts match your search.</div>
        )}
      </div>
    </div>
  );
}

function DetailView({ cut, onBack, onDelete }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          ...s.detailImg,
          background: cut.photo_url ? "none" : "#1a1a1a",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {cut.photo_url ? (
          <img
            src={cut.photo_url}
            alt={cut.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <PlaceholderHair color={cut.hair_color} large />
        )}
        <button style={s.backBtn} onClick={onBack}>
          <ChevronLeft />
        </button>
        <div style={s.detailActions}>
          <button
            style={s.actionBtn}
            onClick={() => alert("Share coming soon")}
          >
            <ShareIcon />
          </button>
          <button style={s.actionBtn} onClick={() => alert("Edit coming soon")}>
            <EditIcon />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#0a0a0a",
                letterSpacing: "-0.5px",
              }}
            >
              {cut.name}
            </h2>
            <p style={{ fontSize: 13, color: "#999", marginTop: 3 }}>
              {new Date(cut.date).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div style={s.ratingPill}>
            {cut.rating === "Fire" ? "🔥" : cut.rating === "Good" ? "😊" : "😐"}{" "}
            {cut.rating}
          </div>
        </div>

        <div
          style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}
        >
          {(cut.tags || []).map((t) => (
            <span key={t} style={s.dtag}>
              {t}
            </span>
          ))}
        </div>

        <div style={s.divider} />

        {[
          ["Barber / Salon", cut.barber || "—"],
          ["Price paid", `₱${cut.price}`],
          ["Go back?", cut.go_back || "—"],
        ].map(([label, val]) => (
          <div key={label} style={s.detailRow}>
            <span style={s.detailLabel}>{label}</span>
            <span style={s.detailVal}>{val}</span>
          </div>
        ))}

        <div style={s.detailRow}>
          <span style={s.detailLabel}>Hair color</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: cut.hair_color,
                display: "inline-block",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
            <span style={s.detailVal}>{cut.hair_color}</span>
          </span>
        </div>

        <div style={s.divider} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#888",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Notes
        </div>
        <div style={s.notesBox}>{cut.notes || "No notes added."}</div>

        <button style={s.deleteBtn} onClick={onDelete}>
          Delete haircut
        </button>
      </div>
    </div>
  );
}

// Placeholder when no photo uploaded
function PlaceholderHair({ color = "#1a0a04", large }) {
  const size = large ? "100%" : "100%";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 213"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="160" height="213" fill="#1a1a1a" opacity="0.05" />
      <ellipse cx="80" cy="80" rx="42" ry="50" fill={color} />
      <path
        d={`M38 80 Q32 52 44 28 Q80 6 116 28 Q128 52 122 80`}
        fill={color}
      />
      <ellipse cx="80" cy="122" rx="29" ry="22" fill="#c8906a" />
      <rect x="51" y="136" width="58" height="77" rx="12" fill="#c8906a" />
    </svg>
  );
}

// Icons
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#bbb"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const XIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#bbb"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ccc"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const ChevronLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ShareIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const s = {
  container: { display: "flex", flexDirection: "column", height: "100%" },
  header: { padding: "16px 20px 0" },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "#0a0a0a",
    letterSpacing: "-0.5px",
  },
  sub: { fontSize: 13, color: "#999", marginTop: 3 },
  searchWrap: { padding: "12px 20px 0" },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#f5f5f5",
    borderRadius: 14,
    padding: "10px 14px",
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#0a0a0a",
    fontFamily: "inherit",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
  },
  filterRow: {
    display: "flex",
    gap: 8,
    padding: "12px 20px 0",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  fchip: {
    padding: "7px 14px",
    borderRadius: 30,
    border: "1.5px solid #e8e8e8",
    fontSize: 13,
    fontWeight: 500,
    color: "#666",
    background: "#fff",
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  fchipActive: { background: "#0a0a0a", color: "#fff", borderColor: "#0a0a0a" },
  sortRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px 8px",
  },
  countText: { fontSize: 13, color: "#999" },
  sortText: { fontSize: 13, color: "#666", fontWeight: 500 },
  gridWrap: { flex: 1, overflowY: "auto", padding: "0 14px 16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    cursor: "pointer",
    background: "#f3f3f3",
    position: "relative",
  },
  cardImg: {
    width: "100%",
    aspectRatio: "3/4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardPhoto: { width: "100%", height: "100%", objectFit: "cover" },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "10px 12px 12px",
    background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
  },
  cardName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    letterSpacing: "-0.2px",
  },
  cardMeta: { fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 2 },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "rgba(255,255,255,0.92)",
    color: "#0a0a0a",
    padding: "3px 8px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 600,
  },
  addCard: {
    borderRadius: 18,
    border: "2px dashed #e0e0e0",
    aspectRatio: "3/4",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    background: "#fafafa",
  },
  empty: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 14,
    padding: "40px 0",
  },
  detailImg: { width: "100%", aspectRatio: "4/5", overflow: "hidden" },
  backBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 34,
    height: 34,
    background: "rgba(255,255,255,0.15)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "none",
  },
  detailActions: {
    position: "absolute",
    top: 14,
    right: 14,
    display: "flex",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    background: "rgba(255,255,255,0.15)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "none",
  },
  ratingPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 10px",
    borderRadius: 20,
    background: "#0a0a0a",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  dtag: {
    padding: "5px 12px",
    borderRadius: 20,
    background: "#f3f3f3",
    fontSize: 12,
    fontWeight: 500,
    color: "#555",
  },
  divider: { height: "0.5px", background: "#ececec", margin: "16px 0" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
  },
  detailLabel: { fontSize: 13, color: "#999" },
  detailVal: { fontSize: 13, fontWeight: 500, color: "#0a0a0a" },
  notesBox: {
    fontSize: 13,
    color: "#666",
    lineHeight: 1.6,
    padding: "12px 14px",
    background: "#f7f7f7",
    borderRadius: 12,
  },
  deleteBtn: {
    width: "100%",
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    border: "1.5px solid #fecdd3",
    background: "#fff5f5",
    color: "#e24b4a",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
