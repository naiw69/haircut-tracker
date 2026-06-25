// AuthScreen.jsx
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient"; // your supabase client
import HomePage from "./Home";

import logo from "../public/logo.png";


export function AuthScreen() {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setInitializing(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignup = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  if (initializing) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <img style={styles.loadingLogo} src={logo} alt="Logo" />
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <HomePage />;
  }

  if (success) {
    return (
      <div style={styles.center}>
        <p>
          Check your inbox! We sent a confirmation link to{" "}
          <strong>{email}</strong>.
        </p>
        <button onClick={() => setSuccess(false)}>Back to login</button>
      </div>
    );
  }

  return (


    <div style={styles.container}>

      <div>
        <img style={{ maxWidth: 150, maxHeight: 150, display: "block", margin: "auto", paddingBottom: "48px" }} src={logo} alt="Logo" />
      </div>

      <div style={styles.tabs}>
        <button
          style={tab === "login" ? styles.tabActive : styles.tab}
          onClick={() => setTab("login")}
        >
          Log in
        </button>


        <button
          style={tab === "signup" ? styles.tabActive : styles.tab}
          onClick={() => setTab("signup")}
        >
          Sign up
        </button>
      </div>


      {tab === "signup" && (
        <input
          style={styles.input}
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <input
        style={styles.input}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        style={styles.input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p style={styles.error}>{error}</p>}

      <button
        style={styles.btnMain}
        disabled={loading}
        onClick={tab === "login" ? handleLogin : handleSignup}
      >
        {loading
          ? "Please wait…"
          : tab === "login"
            ? "Log in"
            : "Create account"}
      </button>

      {/*  <button style={styles.btnGoogle} onClick={handleGoogle}>
        Continue with Google
      </button>
*/}
    </div>
  );
}

const styles = {
  title: { textAlign: "center", fontSize: 32, marginBottom: 28 },
  container: {
    maxWidth: 390,
    margin: "0 auto",
    padding: "130px 28px",
    fontFamily: "sans-serif",
  },
  center: { textAlign: "center", padding: 40 },
  tabs: {
    display: "flex",
    background: "#f7f7f7",
    borderRadius: 12,
    padding: 3,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    background: "none",
    border: "none",
    color: "#888",
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  tabActive: {
    flex: 1,
    padding: "8px 0",
    background: "#fff",
    border: "none",
    color: "#0a0a0a",
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    marginBottom: 14,
    background: "#f7f7f7",
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    fontSize: 15,
    fontFamily: "sans-serif",
    outline: "none",
  },
  btnMain: {
    width: "100%",
    boxSizing: "border-box",
    background: "#0a0a0a",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 14,
  },
  btnGoogle: {
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    cursor: "pointer",
  },
  error: { color: "#d32f2f", fontSize: 13, marginBottom: 12 },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    background: "#ffffff",
    fontFamily: "sans-serif",
  },
  loadingContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
  },
  loadingLogo: {
    maxWidth: 100,
    maxHeight: 100,
    animation: "pulse 2s infinite ease-in-out",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #0a0a0a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

// Inject auth screen animation styles
if (typeof document !== "undefined" && !document.getElementById("auth-screen-styles")) {
  const style = document.createElement("style");
  style.id = "auth-screen-styles";
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(0.95); opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
}
