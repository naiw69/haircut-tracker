// screens/StatsScreen.jsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const PERIODS = ["This month", "Last 6 months", "This year", "All time"];

export default function StatsScreen() {
  const [cuts, setCuts] = useState([]);
  const [period, setPeriod] = useState("Last 6 months");
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "personal" | "fast"

  const fetchCuts = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return; // Guard clause if user isn't logged in

      const { data: personalData, error: personalError } = await supabase
        .from("haircuts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      const { data: fastData, error: fastError } = await supabase
        .from("fast_log_haircuts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (personalError) throw personalError;
      if (fastError) throw fastError;

      const personalMapped = (personalData || []).map((c) => ({ ...c, type: "personal" }));
      const fastMapped = (fastData || []).map((c) => ({
        ...c,
        type: "fast",
        name: "⚡ Fast Cut",
        rating: null,
        location: "",
        tags: [],
        notes: "",
        photo_url: null,
      }));

      const merged = [...personalMapped, ...fastMapped].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setCuts(merged);
    } catch (error) {
      console.error("Error fetching cuts:", error.message);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchCuts();
  }, [fetchCuts]);

  // Period-filtered cuts
  const periodStart = (() => {
    const now = new Date();
    const start = new Date(now);
    if (period === "This month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (period === "Last 6 months") {
      start.setMonth(start.getMonth() - 5);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (period === "This year") {
      return new Date(now.getFullYear(), 0, 1);
    }

    return null;
  })();

  const filteredCuts = cuts
    .filter((c) => {
      const matchType =
        typeFilter === "all" ||
        (typeFilter === "personal" && c.type === "personal") ||
        (typeFilter === "fast" && c.type === "fast");
      return matchType;
    })
    .filter((c) => {
      if (period === "All time") return true;
      return new Date(c.date) >= periodStart;
    });

  const totalCuts = filteredCuts.length;
  const totalSpent = filteredCuts.reduce(
    (s, c) => s + (parseFloat(c.price) || 0),
    0,
  );
  const avgPrice = totalCuts ? Math.round(totalSpent / totalCuts) : 0;

  // Average interval in days
  const avgInterval = (() => {
    if (filteredCuts.length < 2) return null;
    const sorted = [...filteredCuts].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const gaps = sorted
      .slice(1)
      .map(
        (c, i) =>
          (new Date(c.date) - new Date(sorted[i].date)) / (1000 * 60 * 60 * 24),
      );
    return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  })();

  // Breakdown data for selected period
  const periodData = (() => {
    const now = new Date();

    if (period === "This month") {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
        const count = filteredCuts.filter((c) => {
          const cd = new Date(c.date);
          return (
            cd.getFullYear() === d.getFullYear() &&
            cd.getMonth() === d.getMonth() &&
            cd.getDate() === d.getDate()
          );
        }).length;
        return { label: String(i + 1), count };
      });
    }

    if (period === "This year") {
      return Array.from({ length: now.getMonth() + 1 }, (_, i) => {
        const d = new Date(now.getFullYear(), i, 1);
        const label = d.toLocaleString("default", { month: "short" });
        const count = filteredCuts.filter((c) => {
          const cd = new Date(c.date);
          return (
            cd.getFullYear() === d.getFullYear() &&
            cd.getMonth() === d.getMonth()
          );
        }).length;
        return { label, count };
      });
    }

    if (period === "Last 6 months") {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const label = d.toLocaleString("default", { month: "short" });
        const count = filteredCuts.filter((c) => {
          const cd = new Date(c.date);
          return (
            cd.getMonth() === d.getMonth() &&
            cd.getFullYear() === d.getFullYear()
          );
        }).length;
        return { label, count };
      });
    }

    // All time
    const sortedCuts = [...filteredCuts].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    if (!sortedCuts.length) return [];

    const first = new Date(sortedCuts[0].date);
    let current = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    const data = [];
    while (current <= end) {
      const label = current.toLocaleString("default", { month: "short" });
      const count = filteredCuts.filter((c) => {
        const cd = new Date(c.date);
        return (
          cd.getFullYear() === current.getFullYear() &&
          cd.getMonth() === current.getMonth()
        );
      }).length;
      data.push({ label, count });
      current.setMonth(current.getMonth() + 1);
    }
    return data;
  })();

  const styleCounts = filteredCuts.reduce((acc, c) => {
    acc[c.name] = (acc[c.name] || 0) + 1;
    return acc;
  }, {});

  const topStyles = Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxStyle = topStyles[0]?.[1] || 1;

  // Rating breakdown
  const ratingCounts = { Fire: 0, Good: 0, Meh: 0 };
  filteredCuts.forEach((c) => {
    if (ratingCounts[c.rating] !== undefined) ratingCounts[c.rating]++;
  });

  // Next cut due
  const lastCut = filteredCuts[0];
  const nextDue =
    lastCut && avgInterval
      ? new Date(new Date(lastCut.date).getTime() + avgInterval * 86400000)
      : null;

  const lineData = {
    labels: periodData.map((m) => m.label),
    datasets: [
      {
        data: periodData.map((m) => m.count),
        borderColor: "#0a0a0a",
        backgroundColor: "rgba(10,10,10,0.06)",
        borderWidth: 2.5,
        pointBackgroundColor: "#0a0a0a",
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0a0a0a",
        titleColor: "#fff",
        bodyColor: "rgba(255,255,255,0.7)",
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: (ctx) => ` ${ctx.parsed.y} cuts` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#aaa", font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { color: "#aaa", font: { size: 11 }, stepSize: 1 },
        border: { display: false },
        min: 0,
      },
    },
  };

  const total = ratingCounts.Fire + ratingCounts.Good + ratingCounts.Meh || 1;
  const firePct = Math.round((ratingCounts.Fire / total) * 100);
  const goodPct = Math.round((ratingCounts.Good / total) * 100);
  const mehPct = 100 - firePct - goodPct;

  if (loading) return <div style={s.empty}>Loading stats…</div>;

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

      {/* Period selector */}
      <div style={s.periodRow}>
        {PERIODS.map((p) => (
          <button
            key={p}
            style={{ ...s.pchip, ...(period === p ? s.pchipActive : {}) }}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Overview stats */}
      <Section label="Overview">
        <div style={s.statGrid}>
          <StatCard
            val={totalCuts}
            label="Total cuts"
            trend={`↑ active tracker`}
            up
          />
          <StatCard
            val={`₱${avgPrice}`}
            label="Avg. price"
            trend="per haircut"
            neutral
          />
          <StatCard
            val={`₱${Math.round(totalSpent).toLocaleString()}`}
            label="Total Revenue"
            trend="all time"
            neutral
          />
          <StatCard
            val={avgInterval ? `${avgInterval}d` : "—"}
            label="Avg. interval"
            trend="between cuts"
            neutral
          />
        </div>
      </Section>

      {/* Line chart */}
      <Section label="Cuts per month">
        <div style={s.chartCard}>
          <div style={{ position: "relative", height: 160 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </Section>

      {/* Styles bar chart */}
      <Section label="Styles breakdown">
        <div style={s.chartCard}>
          {topStyles.length === 0 ? (
            <div style={s.empty}>No data yet</div>
          ) : (
            topStyles.map(([name, count]) => (
              <div key={name} style={s.barRow}>
                <div style={s.barLabel}>{name}</div>
                <div style={s.barTrack}>
                  <div
                    style={{
                      ...s.barFill,
                      width: `${Math.round((count / maxStyle) * 100)}%`,
                    }}
                  >
                    <span style={s.barNum}>{count}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Donut charts */}
      <Section label="Ratings">
        <div style={s.donutRow}>
          {/* Rating donut */}
          <div style={s.donutCard}>
            <div style={s.donutTitle}>By rating</div>
            <DonutChart
              segments={[
                { pct: firePct, color: "#0a0a0a" },
                { pct: goodPct, color: "#888" },
                { pct: mehPct, color: "#d8d8d8" },
              ]}
              center={totalCuts}
            />
            <div style={s.legend}>
              <LegItem color="#0a0a0a" label={`Fire ${firePct}%`} />
              <LegItem color="#888" label={`Good ${goodPct}%`} />
              <LegItem color="#d8d8d8" label={`Meh ${mehPct}%`} />
            </div>
          </div>
        </div>
      </Section>

      {/* Timeline */}
      <Section label="Recent history">
        <div style={s.chartCard}>
          {filteredCuts.slice(0, 3).map((c) => (
            <div key={c.id} style={s.tlRow}>
              <div style={s.tlDot}>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div style={s.tlName}>{c.name}</div>
                <div style={s.tlMeta}>
                  {new Date(c.date).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {c.type !== "fast" && (
                    <>
                      {" · "}
                      {c.barber || "—"}
                      {" · "}
                      {c.rating === "Fire"
                        ? "🔥"
                        : c.rating === "Good"
                          ? "😊"
                          : "😐"}{" "}
                      {c.rating}
                    </>
                  )}
                </div>
                <div style={s.tlPrice}>₱{c.price}</div>
              </div>
            </div>
          ))}
          {nextDue && (
            <div style={s.tlRow}>
              <div
                style={{
                  ...s.tlDot,
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                }}
              />
              <div>
                <div style={{ ...s.tlName, color: "#bbb" }}>Next cut due</div>
                <div style={s.tlMeta}>
                  ~
                  {nextDue.toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  ({avgInterval} days from last)
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

// Sub-components
function Section({ label, children }) {
  return (
    <div style={{ padding: "16px 20px 0" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#bbb",
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function StatCard({ val, label, trend, up, neutral }) {
  return (
    <div
      style={{
        background: "#f7f7f7",
        borderRadius: 14,
        padding: 14,
        borderTop: "1px solid rgba(255, 255, 255, 0.4)" /* Glass effect */,
        borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "3px 3px 3px rgba(0, 0, 0, 0.089)",
        backdropFilter: "blur(8px)" /* The blurring effect */,
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "#0a0a0a",
          letterSpacing: "-0.5px",
          fontFamily: "monospace",
        }}
      >
        {val}
      </div>
      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{label}</div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          marginTop: 5,
          color: up ? "#2e7d32" : neutral ? "#888" : "#c62828",
        }}
      >
        {trend}
      </div>
    </div>
  );
}

function DonutChart({ segments, center }) {
  const C = 2 * Math.PI * 30;
  const segmentElements = segments.reduce(
    (acc, { pct, color }, i) => {
      const dash = (pct / 100) * C;
      const gap = C - dash;
      acc.elements.push(
        <circle
          key={i}
          cx="44"
          cy="44"
          r="30"
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeDasharray={`${dash.toFixed(1)} ${gap.toFixed(1)}`}
          strokeDashoffset={-acc.offset}
          transform="rotate(-90 44 44)"
        />,
      );
      acc.offset += dash;
      return acc;
    },
    { offset: 0, elements: [] },
  ).elements;

  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle
        cx="44"
        cy="44"
        r="30"
        fill="none"
        stroke="#ececec"
        strokeWidth="13"
      />
      {segmentElements}
      <text
        x="44"
        y="48"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fontFamily="DM Mono,monospace"
        fill="#0a0a0a"
      >
        {center}
      </text>
    </svg>
  );
}

function LegItem({ color, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "#666",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}

const s = {
  container: { overflowY: "auto", paddingBottom: 32, fontFamily: "sans-serif" },
  typeToggleWrap: {
    padding: "14px 20px 6px",
    background: "#fff",
  },
  typeToggle: {
    display: "flex",
    background: "#f3f3f3",
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
    color: "#999",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.18s",
  },
  typeBtnActive: {
    background: "#0a0a0a",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  empty: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 14,
    padding: "32px 0",
  },
  periodRow: {
    display: "flex",
    gap: 6,
    padding: "14px 20px 0",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  pchip: {
    padding: "6px 14px",
    borderRadius: 30,
    border: "1.5px solid #e8e8e8",
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    background: "#fff",
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  pchipActive: { background: "#0a0a0a", color: "#fff", borderColor: "#0a0a0a" },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 10,
  },
  chartCard: {
    background: "#f7f7f7",
    borderRadius: 16,
    padding: 16,
    borderTop: "1px solid rgba(255, 255, 255, 0.4)" /* Glass effect */,
    borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "3px 3px 3px rgba(0, 0, 0, 0.089)",
    backdropFilter: "blur(8px)" /* The blurring effect */,
  },
  barRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  barLabel: {
    fontSize: 12,
    color: "#666",
    width: 68,
    textAlign: "right",
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  barTrack: {
    flex: 1,
    height: 24,
    background: "#ececec",
    borderRadius: 7,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#0a0a0a",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 8,
    minWidth: 32,
  },
  barNum: {
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    fontFamily: "monospace",
  },

  donutCard: {
    background: "#f7f7f7",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(255, 255, 255, 0.4)" /* Glass effect */,
    borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "3px 3px 3px rgba(0, 0, 0, 0.089)",
    backdropFilter: "blur(8px)" /* The blurring effect */,
  },
  donutTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    marginBottom: 10,
    textAlign: "center",
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    width: "100%",
    marginTop: 10,
  },
  barberRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
  },
  barberLeft: { display: "flex", alignItems: "center", gap: 10 },
  barberAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "#666",
    flexShrink: 0,
  },
  barberName: { fontSize: 13, fontWeight: 500, color: "#0a0a0a" },
  barberCount: { fontSize: 11, color: "#999", marginTop: 1 },
  barberPrice: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0a0a0a",
    fontFamily: "monospace",
  },
  tlRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 14,
  },
  tlDot: {
    width: 23,
    height: 23,
    borderRadius: "50%",
    background: "#0a0a0a",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tlName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0a0a0a",
    letterSpacing: "-0.2px",
  },
  tlMeta: { fontSize: 11, color: "#999", marginTop: 2 },
  tlPrice: {
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    marginTop: 3,
    fontFamily: "monospace",
  },
};
