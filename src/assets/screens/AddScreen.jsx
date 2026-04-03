// screens/AddScreen.jsx
import { useState } from "react";
import { supabase } from "../../supabaseClient";

const STEPS = ["Style", "Location", "Photo", "Notes"];

export default function AddScreen({ onSave }) {
  const [step, setStep] = useState(0);
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

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    if (step === 0 && !form.name.trim()) {
      setErrors({ name: "Please enter a style name" });
      return false;
    }
    setErrors({});
    return true;
  };

  const next = async () => {
    if (!validate()) return;
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    // Final step — save to Supabase
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    if (error) {
      setErrors({ submit: error.message });
      return;
    }
    setSaved(true);
  };

  if (saved)
    return (
      <div style={s.successWrap}>
        <div style={s.successCircle}>
          <CheckIcon />
        </div>
        <h2 style={s.successTitle}>Haircut saved!</h2>
        <p style={s.successSub}>Your cut has been logged to your gallery.</p>
        <button
          style={s.btnBlack}
          onClick={() => {
            setSaved(false);
            setStep(0);
            onSave?.();
          }}
        >
          Back to gallery
        </button>
      </div>
    );

  return (
    <div style={s.container}>
      {/* Progress */}
      <div style={s.progressTrack}>
        <div
          style={{
            ...s.progressFill,
            width: `${((step + 1) / STEPS.length) * 100}%`,
          }}
        />
      </div>

      <div style={s.body}>
        {/* Step 0 — Style */}
        {step === 0 && (
          <div>
            <StepHeader
              num={1}
              title="What's the style?"
              sub="Name the cut and pick a category."
            />
            <Field label="Style name" error={errors.name}>
              <input
                style={{ ...s.input, ...(errors.name ? s.inputErr : {}) }}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Low fade with taper"
              />
            </Field>
            <Field label="Your rating">
              <div style={s.ratingRow}>
                {[
                  ["😐", "Meh"],
                  ["😊", "Good"],
                  ["🔥", "Fire"],
                ].map(([icon, label]) => (
                  <button
                    key={label}
                    style={{
                      ...s.ratingBtn,
                      ...(form.rating === label ? s.ratingBtnSel : {}),
                    }}
                    onClick={() => set("rating", label)}
                  >
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div>
            <StepHeader
              num={2}
              title="Where & how much?"
              sub="Log the barber and what you paid."
            />
            <Field label="Barber / Salon">
              <input
                style={s.input}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Juan's Barbershop"
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
                style={s.input}
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>
        )}

        {/* Step 2 — Photo */}
        {step === 2 && (
          <div>
            <StepHeader
              num={3}
              title="Add a photo"
              sub="A picture is worth a thousand cuts."
            />
            <Field label="Photo">
              <PhotoUpload
                value={form.photo_url}
                onChange={(url) => set("photo_url", url)}
                userId={null}
              />
            </Field>
          </div>
        )}

        {/* Step 3 — Notes */}
        {step === 3 && (
          <div>
            <StepHeader
              num={4}
              title="Any notes?"
              sub="Details you want to remember."
            />
            <Field label="Notes">
              <textarea
                style={{
                  ...s.input,
                  height: 90,
                  resize: "none",
                  lineHeight: 1.6,
                }}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="What did you ask for? Length, texture, details…"
              />
            </Field>
            <Field label="Tags">
              <ChipRow
                multi
                options={[
                  "Summer",
                  "Work",
                  "Wedding",
                  "Casual",
                  "Special",
                  "Everyday",
                ]}
                value={form.tags}
                onChange={(v) => set("tags", v)}
              />
            </Field>

            {errors.submit && (
              <p style={{ color: "#e24b4a", fontSize: 13 }}>{errors.submit}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div style={s.bottomBar}>
        <button style={s.btnBlack} disabled={loading} onClick={next}>
          {loading
            ? "Saving…"
            : step === STEPS.length - 1
              ? "Save haircut"
              : "Continue"}
          {!loading && <ArrowIcon />}
        </button>
      </div>
    </div>
  );
}

// Sub-components
function StepHeader({ num, title, sub }) {
  return (
    <div style={{ padding: "20px 0 24px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#bbb",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        Step {num} of 4
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#0a0a0a",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#999", marginTop: 5 }}>{sub}</div>
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
            border: `1.5px solid ${isSelected(opt) ? "#0a0a0a" : "#e8e8e8"}`,
            background: isSelected(opt) ? "#0a0a0a" : "#fff",
            color: isSelected(opt) ? "#fff" : "#666",
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
            border: `2.5px solid ${value === c ? "#0a0a0a" : "transparent"}`,
            transform: value === c ? "scale(1.12)" : "scale(1)",
            transition: "all 0.15s",
            outline: c === "#f5f0e8" ? "1px solid #ddd" : "none",
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
  },
  progressTrack: {
    height: 3,
    background: "#f0f0f0",
    margin: "0 22px",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#0a0a0a",
    borderRadius: 2,
    transition: "width 0.4s ease",
  },
  body: { flex: 1, overflowY: "auto", padding: "0 22px 20px" },
  input: {
    width: "100%",
    background: "#f7f7f7",
    border: "1.5px solid #ebebeb",
    borderRadius: 13,
    padding: "13px 15px",
    fontSize: 15,
    color: "#0a0a0a",
    fontFamily: "inherit",
    outline: "none",
  },
  inputErr: { borderColor: "#e24b4a" },
  ratingRow: { display: "flex", gap: 10 },
  ratingBtn: {
    flex: 1,
    padding: "12px 8px",
    borderRadius: 12,
    border: "1.5px solid #e8e8e8",
    background: "#fff",
    fontSize: 13,
    fontWeight: 500,
    color: "#888",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    fontFamily: "inherit",
  },
  ratingBtnSel: {
    borderColor: "#0a0a0a",
    background: "#0a0a0a",
    color: "#fff",
  },
  bottomBar: {
    padding: "16px 22px 24px",
    background: "#fff",
    borderTop: "0.5px solid #f0f0f0",
  },
  btnBlack: {
    width: "100%",
    background: "#0a0a0a",
    color: "#fff",
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
    background: "#0a0a0a",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "#0a0a0a",
    letterSpacing: "-0.5px",
    marginBottom: 8,
  },
  successSub: { fontSize: 14, color: "#999", lineHeight: 1.6, maxWidth: 220 },
};
