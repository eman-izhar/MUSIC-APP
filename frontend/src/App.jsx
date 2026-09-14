import { useEffect, useRef, useState } from "react";
import "./App.css";
import Browse from "./pages/Browse.jsx";

const API_URL =
  import.meta.env.VITE_API_URL || "https://music-website-zzol.onrender.com/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

function MouseStars() {
  const [stars, setStars] = useState([]);
  const nextId = useRef(0);
  const frameRef = useRef(null);
  const pointerRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    function handlePointerMove(event) {
      pointerRef.current = event;
      if (cursorRef.current) {
        cursorRef.current.style.left = `${event.clientX}px`;
        cursorRef.current.style.top = `${event.clientY}px`;
      }
      if (frameRef.current) return;

      frameRef.current = requestAnimationFrame(() => {
        const pointer = pointerRef.current;
        const starId = nextId.current++;
        const angle = Math.random() * Math.PI * 2;
        const distance = 18 + Math.random() * 20;
        setStars((currentStars) => [
          ...currentStars.slice(-11),
          {
            id: starId,
            x: pointer.clientX + Math.cos(angle) * distance,
            y: pointer.clientY + Math.sin(angle) * distance,
            size: 7 + Math.random() * 9,
            rotation: Math.random() * 45,
            note: Math.random() > 0.72 ? "♫" : "♪",
          },
        ]);
        frameRef.current = null;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="mouse-stars" aria-hidden="true">
      <span className="mouse-cursor" ref={cursorRef} />
      {stars.map((star) => (
        <span
          className="mouse-note"
          key={star.id}
          aria-hidden="true"
          style={{
            left: star.x,
            top: star.y,
            fontSize: star.size * 2,
            "--note-rotation": `${star.rotation - 22}deg`,
          }}
        >
          {star.note}
        </span>
      ))}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [upload, setUpload] = useState({ title: "", file: null });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: "", profileImage: "" });
  const googleButtonRef = useRef(null);

  useEffect(() => {
    request("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user || authMode !== "login" || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setLoading(true);
          setNotice("");
          try {
            const data = await request("/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            setUser(data.user);
            setNotice(`Welcome, ${data.user.username}.`);
          } catch (error) {
            setNotice(error.message);
          } finally {
            setLoading(false);
          }
        },
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "filled_black",
        size: "large",
        width: 330,
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
    return () => script.remove();
  }, [authMode, user]);

  useEffect(() => {
    if (!user) return;
    request("/music/favorites")
      .then((data) => setFavoriteTracks(data.favorites || []))
      .catch(() => setFavoriteTracks([]));
  }, [user]);

  function updateAuth(event) {
    setAuthForm({ ...authForm, [event.target.name]: event.target.value });
  }

  function openProfile() {
    setProfileForm({
      username: user.username || "",
      profileImage: user.profileImage || "",
    });
    setProfileOpen(true);
  }

  function chooseProfileImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      setNotice("Choose an image smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setProfileForm((current) => ({ ...current, profileImage: reader.result }));
    reader.readAsDataURL(file);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const data = await request("/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      setUser(data.user);
      setProfileOpen(false);
      setNotice("Profile updated.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const identifier = authForm.username.trim();
      const payload =
        authMode === "login"
          ? {
              [identifier.includes("@") ? "email" : "username"]: identifier,
              password: authForm.password,
            }
          : authForm;
      const data = await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setUser(data.user);
      setNotice(`Welcome, ${data.user.username}.`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setFavoriteTracks([]);
    setNotice("You have been signed out.");
  }

  async function uploadMusic(event) {
    event.preventDefault();
    if (!upload.title || !upload.file)
      return setNotice("Add a title and audio file first.");
    const body = new FormData();
    body.append("title", upload.title);
    body.append("music", upload.file);
    setLoading(true);
    try {
      await request("/music/uploadMusic", {
        method: "POST",
        body,
      });
      setUpload({ title: "", file: null });
      setNotice("Track uploaded to your orbit.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function scrollToSection(event, sectionId) {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="app-shell">
      <MouseStars />
      <header className="topbar">
        <a className="brand" href="#top" onClick={(event) => scrollToSection(event, "top")}>
          <span className="brand-mark">◒</span> SONORA
          <span className="brand-dot">.</span>
        </a>
        <nav>
          {user?.role === "artist" && (
            <a href="#studio" onClick={(event) => scrollToSection(event, "studio")}>
              Studio
            </a>
          )}
        </nav>
        {user && (
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        )}
        <div className={`top-actions ${user ? "desktop-actions" : ""}`}>
          {user ? (
            <>
              {user?.role === "user" && (
                <>
                  <a className="browse-nav-btn" href="/#/browse">
                    🎵 Browse Music
                  </a>
                  <a className="favorites-nav-btn" href="/#/favorites">
                    ♡ Favourites <span className="favorite-nav-count">{favoriteTracks.length}</span>
                  </a>
                </>
              )}
              <button className="user-pill" onClick={openProfile} aria-label="Open profile settings">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" />
                ) : (
                  <span>{(user.username || "Listener").slice(0, 1).toUpperCase()}</span>
                )}
                <b>{user.username || "Listener"}</b>
                <small>{user.role === "artist" ? "Artist account" : "Listener account"}</small>
              </button>
              <button className="ghost-btn" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button
              className="outline-btn"
              onClick={() => setAuthMode("login")}
            >
              Sign in
            </button>
          )}
        </div>
        {user && (
          <div className={`mobile-nav-menu ${mobileNavOpen ? "is-open" : ""}`}>
            {user.role === "artist" && (
              <a href="#studio" onClick={(event) => { scrollToSection(event, "studio"); setMobileNavOpen(false); }}>
                Studio
              </a>
            )}
            {user.role === "user" && (
              <>
                <a href="/#/browse" onClick={() => setMobileNavOpen(false)}>🎵 Browse Music</a>
                <a href="/#/favorites" onClick={() => setMobileNavOpen(false)}>
                  ♡ Favourites <span className="favorite-nav-count">{favoriteTracks.length}</span>
                </a>
              </>
            )}
            <div className="mobile-nav-account">
              <span>{user.username || "Listener"}</span>
              <button className="ghost-btn" onClick={() => { logout(); setMobileNavOpen(false); }}>
                Log out
              </button>
            </div>
          </div>
        )}
      </header>
      {notice && (
        <div className="notice">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      {profileOpen && (
        <div className="profile-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProfileOpen(false)}>
          <form className="profile-card" onSubmit={saveProfile}>
            <div className="card-top">
              <span>Profile settings</span>
              <button type="button" className="profile-close" onClick={() => setProfileOpen(false)} aria-label="Close profile settings">×</button>
            </div>
            <div className="profile-preview">
              {profileForm.profileImage ? (
                <img src={profileForm.profileImage} alt="Profile preview" />
              ) : (
                <span>{(profileForm.username || "L").slice(0, 1).toUpperCase()}</span>
              )}
              <label className="profile-upload">
                Change image
                <input type="file" accept="image/*" onChange={chooseProfileImage} />
              </label>
              {profileForm.profileImage && (
                <button type="button" className="remove-image" onClick={() => setProfileForm({ ...profileForm, profileImage: "" })}>
                  Remove
                </button>
              )}
            </div>
            <label className="profile-field">
              <span>Name</span>
              <input
                value={profileForm.username}
                onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })}
                minLength="2"
                maxLength="30"
                required
              />
            </label>
            <div className="profile-account-type">
              <span>Account type</span>
              <strong>{user.role === "artist" ? "Artist" : "Listener"}</strong>
            </div>
            <p className="profile-email">{user.email}</p>
            <button className="primary-btn" disabled={loading}>{loading ? "Saving..." : "Save profile"}</button>
          </form>
        </div>
      )}
      {!user ? (
        <section className="auth-layout" id="top">
          <div className="intro">
            <p className="eyebrow">PRIVATE FREQUENCY / 01</p>
            <h1>
              Your sound.
              <br />
              <em>Unfiltered.</em>
            </h1>
            <p className="intro-copy">
              A vivid home for the tracks that find you first. Plug in, tune out
              the noise, and keep your rotation close.
            </p>
            <div className="signal">
              <span className="signal-bars">▂ ▅ ▇ ▆ ▃</span>
              <span>curated in real time</span>
            </div>
            <div className="guitar-scene" aria-hidden="true">
              <div className="guitar-glow"></div>
              <div className="guitar">
                <span className="guitar-neck"></span>
                <span className="guitar-head">
                  <i></i><i></i><i></i>
                </span>
                <span className="guitar-body">
                  <span className="guitar-soundhole"></span>
                  <span className="guitar-bridge"></span>
                </span>
                <span className="guitar-string string-one"></span>
                <span className="guitar-string string-two"></span>
                <span className="guitar-string string-three"></span>
              </div>
              <span className="guitar-note guitar-note-one">♪</span>
              <span className="guitar-note guitar-note-two">♫</span>
            </div>
          </div>
          <form className="auth-card" onSubmit={submitAuth}>
            <div className="card-top">
              <span>
                {authMode === "login" ? "Welcome in" : "Join the frequency"}
              </span>
              <span className="card-index">
                0{authMode === "login" ? "1" : "2"}
              </span>
            </div>
            <h2>
              {authMode === "login" ? (
                <>
                  Pick up where
                  <br />
                  you left off.
                </>
              ) : (
                <>
                  Make room for
                  <br />
                  new sounds.
                </>
              )}
            </h2>
            {authMode === "register" && (
              <input
                name="username"
                placeholder="Username"
                value={authForm.username}
                onChange={updateAuth}
                required
              />
            )}
            {authMode === "register" && (
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={authForm.email}
                onChange={updateAuth}
                required
              />
            )}
            {authMode === "login" && (
              <input
                name="username"
                placeholder="Username or email"
                value={authForm.username}
                onChange={updateAuth}
                required
              />
            )}
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={updateAuth}
              required
            />
            {authMode === "login" && (
              <p style={{ textAlign: "right", margin: "4px 0 0" }}>
                <a
                  href="#/forgot-password"
                  style={{ color: "#a78bfa", fontSize: "13px" }}
                >
                  Forgot password?
                </a>
              </p>
            )}
            {authMode === "register" && (
              <>
                <select name="role" value={authForm.role} onChange={updateAuth}>
                  <option value="user">Listener account</option>
                  <option value="artist">Artist account</option>
                </select>
                <p className="auth-role">
                  Registering as{" "}
                  <strong>
                    {authForm.role === "artist" ? "Artist" : "Listener"}
                  </strong>
                </p>
              </>
            )}
            <button className="primary-btn" disabled={loading}>
              {loading
                ? "Connecting..."
                : authMode === "login"
                  ? "Enter Sonora  →"
                  : "Create account  →"}
            </button>
            {authMode === "login" && GOOGLE_CLIENT_ID && (
              <>
                <div className="auth-divider"><span>or</span></div>
                <div className="google-button" ref={googleButtonRef} />
              </>
            )}
            <button
              type="button"
              className="switch-btn"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </form>
        </section>
      ) : (
        <>
          {user.role === "user" && <Browse embedded initialUser={user} />}
          {user.role === "artist" && (
            <section className="studio" id="studio">
              <div>
                <p className="eyebrow">ARTIST MODE</p>
                <h2>
                  Send something
                  <br />
                  <em>into the world.</em>
                </h2>
                <p>Upload a new signal and it will appear in your library.</p>
              </div>
              <form className="upload-form" onSubmit={uploadMusic}>
                <input
                  placeholder="Track title"
                  value={upload.title}
                  onChange={(event) =>
                    setUpload({ ...upload, title: event.target.value })
                  }
                  required
                />
                <label className="file-input">
                  {upload.file ? upload.file.name : "Choose an audio file"}
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) =>
                      setUpload({ ...upload, file: event.target.files[0] })
                    }
                    required
                  />
                </label>
                <button className="primary-btn" disabled={loading}>
                  Upload track ↑
                </button>
              </form>
            </section>
          )}
        </>
      )}
      <footer>
        <span>SONORA / A PRIVATE FREQUENCY</span>
        <span>
          VOLUME UP <b>◖◗</b>
        </span>
      </footer>
    </main>
  );
}

export default App;
