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

  const fetchCuts = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return; // Guard clause if user isn't logged in

      const { data, error } = await supabase
        .from("haircuts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      setCuts(data || []);
    } catch (error) {
      console.error("Error fetching cuts:", error.message);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchCuts();
  }, [fetchCuts]);

  // Derived stats
  const totalCuts = cuts.length;
  const totalSpent = cuts.reduce((s, c) => s + (parseFloat(c.price) || 0), 0);
  const avgPrice = totalCuts ? Math.round(totalSpent / totalCuts) : 0;

  // Average interval in days
  const avgInterval = (() => {
    if (cuts.length < 2) return null;
    const sorted = [...cuts].sort(
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

  // Monthly counts for line chart (last 6 months)
  const monthlyData = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const count = cuts.filter((c) => {
        const cd = new Date(c.date);
        return (
          cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
        );
      }).length;
      return { label, count };
    });
  })();

  // Style breakdown
  const styleCounts = cuts.reduce((acc, c) => {
    acc[c.name] = (acc[c.name] || 0) + 1;
    return acc;
  }, {});
  const topStyles = Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxStyle = topStyles[0]?.[1] || 1;

  // Rating breakdown
  const ratingCounts = { Fire: 0, Good: 0, Meh: 0 };
  cuts.forEach((c) => {
    if (ratingCounts[c.rating] !== undefined) ratingCounts[c.rating]++;
  });

  // Next cut due
  const lastCut = cuts[0];
  const nextDue =
    lastCut && avgInterval
      ? new Date(new Date(lastCut.date).getTime() + avgInterval * 86400000)
      : null;

  const lineData = {
    labels: monthlyData.map((m) => m.label),
    datasets: [
      {
        data: monthlyData.map((m) => m.count),
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
      <Section label="Ratings & lengths">
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
          {/* Length donut */}
          <LengthDonut cuts={cuts} />
        </div>
      </Section>

      {/* Timeline */}
      <Section label="Recent history">
        <div style={s.chartCard}>
          {cuts.slice(0, 3).map((c) => (
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
                  {" · "}
                  {c.barber || "—"}
                  {" · "}
                  {c.rating === "Fire"
                    ? "🔥"
                    : c.rating === "Good"
                      ? "😊"
                      : "😐"}{" "}
                  {c.rating}
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
    <div style={{ background: "#f7f7f7", borderRadius: 14, padding: 14 }}>
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
  let offset = 0;
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
      {segments.map(({ pct, color }, i) => {
        const dash = (pct / 100) * C;
        const gap = C - dash;
        const el = (
          <circle
            key={i}
            cx="44"
            cy="44"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="13"
            strokeDasharray={`${dash.toFixed(1)} ${gap.toFixed(1)}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 44 44)"
          />
        );
        offset += dash;
        return el;
      })}
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

function LengthDonut({ cuts }) {
  const counts = { Short: 0, Medium: 0, Long: 0 };
  cuts.forEach((c) => {
    if (counts[c.category] !== undefined) counts[c.category]++;
  });
  const total = cuts.length || 1;
  const sPct = Math.round((counts.Short / total) * 100);
  const mPct = Math.round((counts.Medium / total) * 100);
  const lPct = 100 - sPct - mPct;
  return (
    <div style={s.donutCard}>
      <div style={s.donutTitle}>By length</div>
      <DonutChart
        segments={[
          { pct: sPct, color: "#0a0a0a" },
          { pct: mPct, color: "#888" },
          { pct: lPct, color: "#d8d8d8" },
        ]}
        center={cuts.length}
      />
      <div style={s.legend}>
        <LegItem color="#0a0a0a" label={`Short ${sPct}%`} />
        <LegItem color="#888" label={`Medium ${mPct}%`} />
        <LegItem color="#d8d8d8" label={`Long ${lPct}%`} />
      </div>
    </div>
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
  chartCard: { background: "#f7f7f7", borderRadius: 16, padding: 16 },
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
  donutRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 10,
  },
  donutCard: {
    background: "#f7f7f7",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
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
