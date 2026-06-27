// screens/GalleryScreen.jsx
import { useState, useEffect, useCallback } from "react"; // 1. Add useCallback
import { supabase } from "../../supabaseClient";

export default function GalleryScreen({ onAddNew }) {
  const [cuts, setCuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null); // holds the cut being edited
  const [typeFilter, setTypeFilter] = useState("personal"); // "all" | "personal" | "fast"
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  const FILTERS = [
    "All",
    "Taper",
    "Fade",
    "High",
    "Low",
    "Mid",
    "Burst",
    "Undercut",
    "Buzz",
  ];

  // 1. Define the function first
  const fetchCuts = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return; // Guard clause if no user is found

      const { data, error } = await supabase
        .from("haircuts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((c) => {
        const isFast = !c.name || c.name === "⚡ Fast Cut";
        return {
          ...c,
          type: isFast ? "fast" : "personal",
          name: c.name || "⚡ Fast Cut",
          rating: c.rating || null,
          location: c.location || "",
          tags: c.tags || [],
          notes: c.notes || "",
          photo_url: c.photo_url || null,
        };
      });

      setCuts(mapped);
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

  const deleteCut = async (cut) => {
    if (!window.confirm("Delete this haircut?")) return;
    const { error } = await supabase.from("haircuts").delete().eq("id", cut.id);
    if (error) {
      alert("Error deleting haircut: " + error.message);
    } else {
      setSelected(null);
      fetchCuts();
    }
  };

  const filtered = cuts.filter((c) => {
    // 1. Filter by Log Type ("all", "personal", "fast")
    const matchType =
      typeFilter === "all" ||
      (typeFilter === "personal" && c.type === "personal") ||
      (typeFilter === "fast" && c.type === "fast");

    // 2. Filter by Name Keywords (Low, Mid, High, etc.)
    const matchFilter =
      filter === "All" || c.name.toLowerCase().includes(filter.toLowerCase());

    // 3. Search by Name or Barber
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.barber?.toLowerCase().includes(search.toLowerCase());

    return matchType && matchFilter && matchSearch;
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  if (editing)
    return (
      <EditView
        cut={editing}
        onBack={() => setEditing(null)}
        onSaved={(updated) => {
          setEditing(null);
          setSelected(updated); // go back to detail with fresh data
          fetchCuts();
        }}
      />
    );

  // Detail view
  if (selected)
    return (
      <DetailView
        cut={selected}
        onBack={() => setSelected(null)}
        onDelete={() => deleteCut(selected)}
        onEdit={(cut) => setEditing(cut)} // ← new
      />
    );

  // Gallery view
  return (
    <div style={s.container}>
      {/* Log Type Selector */}
      <div style={s.typeToggleWrap}>
        <div style={s.typeToggle}>
          <button
            style={{ ...s.typeBtn, ...(typeFilter === "all" ? s.typeBtnActive : {}) }}
            onClick={() => setTypeFilter("all")}
          >
            All Cuts
          </button>
          <button
            style={{ ...s.typeBtn, ...(typeFilter === "personal" ? s.typeBtnActive : {}) }}
            onClick={() => setTypeFilter("personal")}
          >
            Personal Cuts
          </button>
          <button
            style={{ ...s.typeBtn, ...(typeFilter === "fast" ? s.typeBtnActive : {}) }}
            onClick={() => setTypeFilter("fast")}
          >
            ⚡ Fast Cuts
          </button>
        </div>
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
          {sortedAndFiltered.length} cut{sortedAndFiltered.length !== 1 ? "s" : ""}
        </span>
        <div style={s.sortSelectWrap}>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={s.sortSelect}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <ChevronDown />
        </div>
      </div>

      {/* Grid */}
      <div style={s.gridWrap}>
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : typeFilter === "fast" ? (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Price</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map((cut) => (
                  <tr
                    key={cut.id}
                    style={s.tr}
                    onClick={() => setSelected(cut)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <td style={s.td}>
                      {new Date(cut.date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontWeight: 600 }}>₱{cut.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ ...s.addCard, width: "100%", height: 50, marginTop: 12, display: "flex", flexDirection: "row", gap: 8 }} onClick={onAddNew}>
              <PlusIcon />
              <span style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>
                Add new
              </span>
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            {sortedAndFiltered.map((cut) => (
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
        {!loading && sortedAndFiltered.length === 0 && (
          <div style={s.empty}>No cuts match your search.</div>
        )}
      </div>
    </div>
  );
}

function DetailView({ cut, onBack, onDelete, onEdit }) {
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
            style={{ width: "100%", height: "90%", objectFit: "cover" }}
          />
        ) : (
          <PlaceholderHair large />
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
          {cut.type !== "fast" && (
            <button style={s.actionBtn} onClick={() => onEdit(cut)}>
              <EditIcon />
            </button>
          )}
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
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
              }}
            >
              {cut.name}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>
              {new Date(cut.date).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {cut.type !== "fast" && cut.rating && (
            <div style={s.ratingPill}>
              {cut.rating === "Fire" ? "🔥" : cut.rating === "Good" ? "😊" : "😐"}{" "}
              {cut.rating}
            </div>
          )}
        </div>

        {cut.type !== "fast" && cut.tags && cut.tags.length > 0 && (
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}
          >
            {cut.tags.map((t) => (
              <span key={t} style={s.dtag}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div style={s.divider} />

        {[
          cut.type !== "fast" && ["Barber / Salon", cut.location || "—"],
          ["Price paid", `₱${cut.price}`],
        ].filter(Boolean).map(([label, val]) => (
          <div key={label} style={s.detailRow}>
            <span style={s.detailLabel}>{label}</span>
            <span style={s.detailVal}>{val}</span>
          </div>
        ))}

        {cut.type !== "fast" && (
          <>
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
          </>
        )}

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

function EditView({ cut, onBack, onSaved }) {
  const [form, setForm] = useState({
    name: cut.name || "",
    date: cut.date || "",
    price: cut.price || "",
    location: cut.location || "",
    rating: cut.rating || "Good",
    notes: cut.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("haircuts")
      .update({
        name: form.name,
        date: form.date,
        price: Number(form.price),
        location: form.location,
        rating: form.rating,
        notes: form.notes,
      })
      .eq("id", cut.id)
      .select()
      .single();

    setSaving(false);
    if (error) return setError(error.message);
    onSaved(data);
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    border: "1.5px solid #e8e8e8",
    fontSize: 14,
    fontFamily: "inherit",
    color: "var(--text-primary)",
    background: "var(--bg-tertiary)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-tertiary)",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "0.5px solid var(--border-light)",
        }}
      >
        <button
          style={{ ...s.actionBtn, background: "var(--bg-secondary)" }}
          onClick={onBack}
        >
          <ChevronLeft />
        </button>
        <h2
          style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}
        >
          Edit Haircut
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 18px",
            borderRadius: 20,
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Form */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#fff5f5",
              color: "#e24b4a",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label style={labelStyle}>Cut Name</label>
          <input
            style={inputStyle}
            {...field("name")}
            placeholder="e.g. High Fade"
          />
        </div>

        <div>
          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" {...field("date")} />
        </div>

        <div>
          <label style={labelStyle}>Price (₱)</label>
          <input
            style={inputStyle}
            type="number"
            {...field("price")}
            placeholder="e.g. 150"
          />
        </div>

        <div>
          <label style={labelStyle}>Barber / Salon</label>
          <input
            style={inputStyle}
            {...field("location")}
            placeholder="e.g. Juan's Barbershop"
          />
        </div>

        <div>
          <label style={labelStyle}>Rating</label>
          <select style={inputStyle} {...field("rating")}>
            <option value="Fire">🔥 Fire</option>
            <option value="Good">😊 Good</option>
            <option value="Meh">😐 Meh</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            {...field("notes")}
            placeholder="Any details about this cut…"
          />
        </div>
      </div>
    </div>
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

const ChevronDown = ({ color = "#666" }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const s = {
  container: { display: "flex", flexDirection: "column", height: "100%" },
  tableWrap: {
    background: "var(--bg-primary)",
    borderRadius: 16,
    border: "1.5px solid var(--border-medium)",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    marginBottom: 20,
    boxSizing: "border-box",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "14px 18px",
    background: "var(--bg-tertiary)",
    borderBottom: "1.5px solid var(--border-medium)",
    color: "var(--text-tertiary)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  td: {
    padding: "16px 18px",
    borderBottom: "1px solid var(--border-light)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 500,
  },
  tr: {
    cursor: "pointer",
    transition: "background 0.15s",
  },
  typeToggleWrap: {
    padding: "14px 20px 6px",
    background: "var(--bg-primary)",
  },
  typeToggle: {
    display: "flex",
    background: "var(--bg-secondary)",
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  typeBtn: {
    flex: 1,
    padding: "8px 0",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-tertiary)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.18s",
  },
  typeBtnActive: {
    background: "var(--accent-color)",
    color: "var(--btn-primary-text)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  header: { padding: "16px 20px 0" },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  sub: { fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 },
  searchWrap: { padding: "12px 20px 0" },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "var(--bg-secondary)",
    borderRadius: 14,
    padding: "10px 14px",
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "var(--text-primary)",
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
    border: "1.5px solid var(--border-medium)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "var(--card-bg)",
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  fchipActive: { background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", borderColor: "var(--btn-primary-bg)" },
  sortRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px 8px",
  },
  countText: { fontSize: 13, color: "var(--text-tertiary)" },
  sortSelectWrap: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
  },
  sortSelect: {
    fontSize: 13,
    color: "var(--text-secondary)",
    fontWeight: 500,
    border: "none",
    background: "transparent",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    padding: 0,
    margin: 0,
  },
  gridWrap: { flex: 1, overflowY: "auto", padding: "0 14px 100px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    cursor: "pointer",
    background: "var(--bg-secondary)",
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
    background: "var(--tabbar-bg)",
    color: "var(--text-primary)",
    padding: "3px 8px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 600,
  },
  addCard: {
    borderRadius: 18,
    border: "2px dashed var(--border-color)",
    aspectRatio: "3/4",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    background: "var(--bg-tertiary)",
  },
  empty: {
    textAlign: "center",
    color: "var(--text-tertiary)",
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
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  dtag: {
    padding: "5px 12px",
    borderRadius: 20,
    background: "var(--bg-secondary)",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-secondary)",
  },
  divider: { height: "0.5px", background: "var(--border-light)", margin: "16px 0" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
  },
  detailLabel: { fontSize: 13, color: "var(--text-tertiary)" },
  detailVal: { fontSize: 13, fontWeight: 500, color: "var(--text-primary)" },
  notesBox: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    padding: "12px 14px",
    background: "var(--bg-secondary)",
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
