// screens/AddScreen.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function AddScreen({ onSave }) {
  const [mode, setMode] = useState("personal"); // "personal" | "fast"
  const [priceModal, setPriceModal] = useState({
    open: false,
    value: "",
    onSelect: null,
  });

  const openPriceModal = (currentVal, onSelect) => {
    setPriceModal({
      open: true,
      value: currentVal || "",
      onSelect,
    });
  };

  return (
    <div style={s.container}>
      {/* Mode Toggle */}
      <div style={s.modeToggleWrap}>
        <div style={s.modeToggle}>
          <button
            style={{ ...s.modeBtn, ...(mode === "personal" ? s.modeBtnActive : {}) }}
            onClick={() => setMode("personal")}
          >
            Personal Log
          </button>
          <button
            style={{ ...s.modeBtn, ...(mode === "fast" ? s.modeBtnActive : {}) }}
            onClick={() => setMode("fast")}
          >
            ⚡ Fast Log
          </button>
        </div>
      </div>

      {mode === "personal" ? (
        <PersonalLogForm onSave={onSave} onOpenPriceModal={openPriceModal} />
      ) : (
        <FastLogForm onSave={onSave} onOpenPriceModal={openPriceModal} />
      )}

      {priceModal.open && (
        <PriceModal
          value={priceModal.value}
          onClose={() => setPriceModal({ open: false, value: "", onSelect: null })}
          onSelect={(val) => {
            priceModal.onSelect(val);
            setPriceModal({ open: false, value: "", onSelect: null });
          }}
        />
      )}
    </div>
  );
}

// ─── Personal Log ────────────────────────────────────────────────────────────

function PersonalLogForm({ onSave, onOpenPriceModal }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rating: "Good",
    location: "",
    date: new Date().toISOString().split("T")[0],
    price: 0,
    photo_url: null,
    notes: "",
    tags: ["Everyday"],
  });
  const [errors, setErrors] = useState({});
  const [history, setHistory] = useState({ names: [], locations: [] });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("haircuts")
          .select("name, location")
          .eq("user_id", user.id);
        if (data && !error) {
          const names = [...new Set(data.map((item) => item.name).filter(Boolean))];
          const locations = [...new Set(data.map((item) => item.location).filter(Boolean))];
          setHistory({ names, locations });
        }
      } catch (err) {
        console.error("Error fetching haircut history:", err);
      }
    };
    fetchHistory();
  }, []);

  const validate = () => {
    if (!form.name.trim()) {
      setErrors({ name: "Please enter a style name" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("haircuts").insert({
      user_id: user.id,
      name: form.name,
      rating: form.rating,
      location: form.location,
      date: form.date,
      price: parseFloat(form.price) || 0,
      notes: form.notes,
      tags: form.tags,
      photo_url: form.photo_url,
    });
    setLoading(false);
    if (error) { setErrors({ submit: error.message }); return; }
    setSaved(true);
  };

  if (saved)
    return (
      <div style={s.successWrap}>
        <div style={s.successCircle}><CheckIcon /></div>
        <h2 style={s.successTitle}>Haircut saved!</h2>
        <p style={s.successSub}>Your cut has been logged to your gallery.</p>
        <button style={s.btnBlack} onClick={() => { setSaved(false); onSave?.(); }}>
          Back to gallery
        </button>
      </div>
    );

  return (
    <>
      <div style={s.body}>
        <Field label="Style name" error={errors.name}>
          <AutocompleteInput
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Low fade with taper"
            suggestions={history.names}
            error={errors.name}
          />
        </Field>

        <Field label="Your rating">
          <div style={s.ratingRow}>
            {[["😐", "Meh"], ["😊", "Good"], ["🔥", "Fire"]].map(([icon, label]) => (
              <button
                key={label}
                style={{ ...s.ratingBtn, ...(form.rating === label ? s.ratingBtnSel : {}) }}
                onClick={() => set("rating", label)}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Barber / Salon">
          <AutocompleteInput
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Juan's Barbershop"
            suggestions={history.locations}
          />
        </Field>

        <Field label="Date of cut">
          <input
            style={s.input}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>

        <Field label="Price paid (₱)">
          <input
            style={{ ...s.input, cursor: "pointer" }}
            type="text"
            readOnly
            value={form.price ? `₱${form.price}` : "₱0"}
            onClick={() => onOpenPriceModal(form.price, (newPrice) => set("price", newPrice))}
            placeholder="Tap to set price"
          />
        </Field>

        <Field label="Photo">
          <PhotoUpload value={form.photo_url} onChange={(url) => set("photo_url", url)} userId={null} />
        </Field>

        <Field label="Notes">
          <textarea
            style={{ ...s.input, height: 90, resize: "none", lineHeight: 1.6 }}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="What did you ask for? Length, texture, details…"
          />
        </Field>

        <Field label="Tags">
          <ChipRow
            multi
            options={["Summer", "Work", "Wedding", "Casual", "Special", "Everyday"]}
            value={form.tags}
            onChange={(v) => set("tags", v)}
          />
        </Field>

        {errors.submit && (
          <p style={{ color: "#e24b4a", fontSize: 13, marginTop: 12 }}>{errors.submit}</p>
        )}
      </div>

      <div style={s.bottomBar}>
        <button style={s.btnBlack} disabled={loading} onClick={handleSubmit}>
          {loading ? "Saving…" : "Save haircut"}
          {!loading && <ArrowIcon />}
        </button>
      </div>
    </>
  );
}

// ─── Fast Log ─────────────────────────────────────────────────────────────────

function FastLogForm({ onSave, onOpenPriceModal }) {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleFastLog = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from("haircuts").insert({
        user_id: user.id,
        price: parseFloat(price) || 0,
        date: new Date().toISOString().split("T")[0],
        name: "⚡ Fast Cut",
        rating: null,
        location: "",
        notes: "",
        tags: [],
        photo_url: null,
      });
      if (insertError) { setError(insertError.message); return; }
      setSuccess(true);
      setPrice("");
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={s.body}>
        <div style={s.fastLogCard}>
          <div style={s.fastLogIcon}>✂️</div>
          <p style={s.fastLogTitle}>Quick add a haircut</p>
          <p style={s.fastLogSub}>No details needed — just tap the button. Optionally set a price first.</p>

          <div style={s.fastLogRow}>
            <div style={{ ...s.fastLogPriceWrap, cursor: "pointer" }} onClick={() => onOpenPriceModal(price, (newPrice) => setPrice(newPrice))}>
              <span style={s.fastLogCurrency}>₱</span>
              <input
                style={{ ...s.fastLogPriceInput, cursor: "pointer" }}
                type="text"
                readOnly
                value={price || "0"}
                placeholder="0"
              />
            </div>
            <button
              style={{ ...s.btnBlack, ...s.fastLogBtn }}
              disabled={loading}
              onClick={handleFastLog}
            >
              {loading ? "Adding…" : "Add Haircut"}
              {!loading && <ArrowIcon />}
            </button>
          </div>

          {error && <p style={{ color: "#e24b4a", fontSize: 13, marginTop: 12 }}>{error}</p>}
          {success && (
            <p style={{ color: "#2e7d32", fontSize: 14, fontWeight: 600, marginTop: 14 }}>
              ✓ Haircut logged successfully!
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function AutocompleteInput({ value, onChange, placeholder, suggestions, error }) {
  const [show, setShow] = useState(false);

  // filter suggestions based on input value
  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes((value || "").toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        style={{ ...s.input, ...(error ? s.inputErr : {}) }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setShow(true)}
        onBlur={() => {
          // Delay closing so that click on suggestion can be registered
          setTimeout(() => {
            setShow(false);
          }, 200);
        }}
      />
      {show && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1.5px solid #ebebeb",
            borderRadius: 13,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            zIndex: 100,
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {filtered.map((item, index) => (
            <div
              key={item + index}
              onMouseDown={() => {
                // Use onMouseDown so it fires before onBlur
                onChange({ target: { value: item } });
                setShow(false);
              }}
              style={{
                padding: "12px 15px",
                fontSize: 14,
                color: "#333",
                cursor: "pointer",
                borderBottom: index === filtered.length - 1 ? "none" : "1.5px solid #f5f5f5",
                transition: "background 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
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
        {label}
      </div>
      {children}
      {error && (
        <div style={{ fontSize: 12, color: "#e24b4a", marginTop: 5 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function ChipRow({ options, value, onChange, multi = false }) {
  const isSelected = (opt) =>
    multi ? (value || []).includes(opt) : value === opt || value === opt;
  const toggle = (opt) => {
    if (multi) {
      const cur = value || [];
      onChange(
        cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt],
      );
    } else {
      onChange(opt);
    }
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          style={{
            padding: "8px 16px",
            borderRadius: 30,
            border: `1.5px solid ${isSelected(opt) ? "var(--accent-color)" : "var(--border-medium)"}`,
            background: isSelected(opt) ? "var(--accent-color)" : "var(--card-bg)",
            color: isSelected(opt) ? "var(--btn-primary-text)" : "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function PhotoUpload({ value, onChange, userId }) {
  const [uploading, setUploading] = useState(false);

  const compressImage = (file, maxDim = 1200, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = async () => {
        const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image compression failed"));
            } else {
              resolve(
                new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                }),
              );
            }
          },
          "image/jpeg",
          quality,
        );
      };
      image.onerror = reject;
      image.src = URL.createObjectURL(file);
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    let uploadFile = file;
    try {
      uploadFile = await compressImage(file, 1200, 0.7);
    } catch (error) {
      console.warn("Compression failed, falling back to original file:", error);
      uploadFile = file;
    }

    const ext = "jpg";
    const finalUserId = userId || "public";
    const path = `${finalUserId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("haircut-photos")
      .upload(path, uploadFile, { upsert: true });

    if (!error) {
      const { data } = supabase.storage
        .from("haircut-photos")
        .getPublicUrl(path);
      onChange(data.publicUrl);
    } else {
      console.error("Upload error:", error);
    }
    setUploading(false);
  };

  if (value)
    return (
      <div>
        <img
          src={value}
          alt="Haircut"
          style={{
            width: "100%",
            borderRadius: 14,
            aspectRatio: "4/3",
            objectFit: "cover",
          }}
        />
        <button
          onClick={() => onChange(null)}
          style={{
            fontSize: 12,
            color: "#e24b4a",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          Remove photo
        </button>
      </div>
    );

  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        border: "2px dashed #ddd",
        borderRadius: 16,
        padding: "28px 20px",
        cursor: "pointer",
        background: "#fafafa",
        textAlign: "center",
      }}
    >
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#ececec",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PhotoIcon />
      </div>
      <span style={{ fontSize: 13, color: "#aaa" }}>
        {uploading ? "Uploading…" : "Tap to upload a photo"}
      </span>
    </label>
  );
}

function ColorPicker({ value, onChange }) {
  const colors = [
    "#1a0a04",
    "#3d2b1f",
    "#8b5e3c",
    "#c4984a",
    "#d4c5a9",
    "#f5f0e8",
    "#b22222",
    "#d4a5d0",
    "#4a90d9",
    "#2e8b57",
    "#888880",
  ];
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}
    >
      {colors.map((c) => (
        <div
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: "100%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: c,
            cursor: "pointer",
            border: `2.5px solid ${value === c ? "var(--accent-color)" : "transparent"}`,
            transform: value === c ? "scale(1.12)" : "scale(1)",
            transition: "all 0.15s",
            outline: c === "#f5f0e8" ? "1px solid var(--border-medium)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// Icons
const CheckIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const PhotoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#888"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const s = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    fontFamily: "sans-serif",
    background: "var(--bg-primary)",
  },
  modeToggleWrap: {
    padding: "14px 22px 10px",
    background: "var(--bg-primary)",
    borderBottom: "0.5px solid var(--border-light)",
  },
  modeToggle: {
    display: "flex",
    background: "var(--bg-secondary)",
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-tertiary)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.18s",
  },
  modeBtnActive: {
    background: "var(--accent-color)",
    color: "var(--btn-primary-text)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  fastLogCard: {
    marginTop: 24,
    background: "var(--bg-secondary)",
    borderRadius: 20,
    padding: "28px 20px 24px",
    textAlign: "center",
    border: "1.5px solid var(--border-medium)",
  },
  fastLogIcon: { fontSize: 40, marginBottom: 12 },
  fastLogTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 6,
  },
  fastLogSub: {
    fontSize: 13,
    color: "var(--text-tertiary)",
    lineHeight: 1.6,
    marginBottom: 24,
  },
  fastLogRow: {
    display: "flex",
    gap: 10,
    alignItems: "stretch",
  },
  fastLogPriceWrap: {
    display: "flex",
    alignItems: "center",
    background: "var(--bg-primary)",
    border: "1.5px solid var(--border-medium)",
    borderRadius: 13,
    padding: "0 14px",
    gap: 4,
    flex: "0 0 110px",
  },
  fastLogCurrency: {
    fontSize: 15,
    color: "var(--text-tertiary)",
    fontWeight: 600,
  },
  fastLogPriceInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    fontSize: 15,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    outline: "none",
    padding: "13px 0",
  },
  fastLogBtn: {
    flex: 1,
    borderRadius: 13,
    padding: "13px 16px",
    fontSize: 14,
  },
  body: { flex: 1, overflowY: "auto", padding: "0 22px 20px" },
  input: {
    width: "100%",
    background: "var(--bg-secondary)",
    border: "1.5px solid var(--border-medium)",
    borderRadius: 13,
    padding: "13px 15px",
    fontSize: 15,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  inputErr: { borderColor: "#e24b4a" },
  ratingRow: { display: "flex", gap: 10 },
  ratingBtn: {
    flex: 1,
    padding: "12px 8px",
    borderRadius: 12,
    border: "1.5px solid var(--border-medium)",
    background: "var(--card-bg)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-tertiary)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    fontFamily: "inherit",
  },
  ratingBtnSel: {
    borderColor: "var(--accent-color)",
    background: "var(--accent-color)",
    color: "var(--btn-primary-text)",
  },
  bottomBar: {
    padding: "16px 22px 100px",
    background: "var(--bg-primary)",
    borderTop: "0.5px solid var(--border-light)",
  },
  btnBlack: {
    width: "100%",
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
    border: "none",
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "inherit",
  },
  successWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 28px",
    textAlign: "center",
    minHeight: 420,
  },
  successCircle: {
    width: 72,
    height: 72,
    background: "var(--accent-color)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    marginBottom: 8,
  },
  successSub: { fontSize: 14, color: "var(--text-tertiary)", lineHeight: 1.6, maxWidth: 220 },
};

function PriceModal({ value, onClose, onSelect }) {
  const [customVal, setCustomVal] = useState(value || "");
  const presets = [50, 80, 100, 150, 200, 250, 300, 350, 400];

  const handleDone = () => {
    onSelect(customVal);
  };

  return (
    <>
      <div style={m.backdrop} onClick={onClose} />
      <div style={m.sheet}>
        <div style={m.handle} />
        <h3 style={m.title}>Select Price</h3>
        
        {/* 3x3 Grid of Presets */}
        <div style={m.grid}>
          {presets.map((p) => {
            const isSelected = Number(customVal) === p;
            return (
              <button
                key={p}
                onClick={() => setCustomVal(p.toString())}
                style={{
                  ...m.presetBtn,
                  ...(isSelected ? m.presetBtnActive : {})
                }}
              >
                ₱{p}
              </button>
            );
          })}
        </div>

        {/* Custom Price Input */}
        <div style={{ marginTop: 20 }}>
          <p style={m.fieldLabel}>Or enter custom price (₱)</p>
          <input
            style={m.input}
            type="number"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="Enter custom amount"
          />
        </div>

        <button style={m.saveBtn} onClick={handleDone}>
          Done
        </button>
      </div>
    </>
  );
}

const m = {
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "var(--backdrop-bg)",
    zIndex: 1000,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "var(--sheet-bg)",
    borderRadius: "24px 24px 0 0",
    padding: "16px 24px 32px",
    zIndex: 1001,
    boxShadow: "var(--sheet-shadow)",
    boxSizing: "border-box",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: "var(--border-medium)",
    margin: "0 auto 16px",
  },
  title: {
    margin: "0 0 16px",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--text-primary)",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  presetBtn: {
    padding: "12px 0",
    borderRadius: 12,
    border: "1.5px solid var(--border-medium)",
    background: "var(--card-bg)",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  presetBtnActive: {
    borderColor: "var(--btn-primary-bg)",
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
  },
  fieldLabel: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-tertiary)",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "13px 15px",
    borderRadius: 13,
    border: "1.5px solid var(--border-medium)",
    fontSize: 15,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    background: "var(--bg-secondary)",
  },
  saveBtn: {
    width: "100%",
    padding: 14,
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 18,
    fontFamily: "inherit",
  },
};