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

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
};
