import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://music-website-zzol.onrender.com/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

async function searchITunes(term, entity, limit = 12) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    term,
  )}&media=music&entity=${entity}&limit=${limit}&country=PK`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results || [];
}

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
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [query, setQuery] = useState("");
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
  const googleButtonRef = useRef(null);
  const audioRef = useRef(null);

  const visibleTracks = useMemo(
    () =>
      tracks.filter((track) =>
        `${track.title} ${track.artist} ${track.genre}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [tracks, query],
  );

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
    Promise.all([
      searchITunes("atif aslam", "song")
        .then((results) =>
          setTracks(
            results
              .filter((track) => track.previewUrl)
              .map((track) => ({
                id: track.trackId,
                title: track.trackName,
                artist: track.artistName,
                genre: track.primaryGenreName || "New release",
                color: "violet",
                uri: track.previewUrl,
              })),
          ),
        )
        .catch(() => setTracks([])),
      searchITunes("atif aslam", "album")
        .then((results) =>
          setAlbums(
            results.map((album) => ({
              id: album.collectionId,
              title: album.collectionName,
              artist: album.artistName,
            })),
          ),
        )
        .catch(() => setAlbums([])),
    ]);
  }, [user]);

  function updateAuth(event) {
    setAuthForm({ ...authForm, [event.target.name]: event.target.value });
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
      const data = await request("/music/uploadMusic", {
        method: "POST",
        body,
      });
      setTracks([
        {
          ...data.music,
          artist: user.username,
          genre: "Fresh upload",
          color: "pink",
        },
        ...tracks,
      ]);
      setUpload({ title: "", file: null });
      setNotice("Track uploaded to your orbit.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function playTrack(track) {
    setActiveTrack(track);
    if (!track.uri) return;
    if (audioRef.current) audioRef.current.src = track.uri;
    audioRef.current
      ?.play()
      .catch(() => setNotice("Press play on the player to start this track."));
  }

  return (
    <main className="app-shell">
      <MouseStars />
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">◒</span> SONORA
          <span className="brand-dot">.</span>
        </a>
        <nav>
          <a href="#discover">Discover</a>
          <a href="#albums">Albums</a>
          {user?.role === "artist" && <a href="#studio">Studio</a>}
        </nav>
        <div className="top-actions">
          {user ? (
            <>
              {user?.role === "user" && (
                <a
                  href="/#/browse"
                  style={{
                    padding: "8px 18px",
                    background: "#7c3aed",
                    color: "#fff",
                    borderRadius: "20px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  🎵 Browse Music
                </a>
              )}
              <span className="user-pill">
                {(user.username || "Listener").slice(0, 1).toUpperCase()} <b>{user.username || "Listener"}</b>{" "}
                <small>{user.role === "artist" ? "Artist" : "Listener"}</small>
              </span>
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
      </header>
      {notice && (
        <div className="notice">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
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
          <section className="dashboard-hero" id="discover">
            <div>
              <p className="eyebrow">YOUR DAILY FREQUENCY</p>
              <h1>
                Find your
                <br />
                <em>next favorite.</em>
              </h1>
              <p className="hero-sub">
                A living collection of sounds for every version of you.
              </p>
            </div>
            <div className="hero-orbit">
              <span className="orbit-ring ring-one"></span>
              <span className="orbit-ring ring-two"></span>
              <span className="orbit-core">♫</span>
              <span className="orbit-label">
                LIVE
                <br />
                SIGNAL
              </span>
            </div>
          </section>
          <section className="content-grid">
            <div className="feed-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE LIBRARY</p>
                  <h2>Made for your ears</h2>
                </div>
                <label className="search">
                  <span>⌕</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search the signal"
                  />
                </label>
              </div>
              <div className="track-list">
                {visibleTracks.map((track, index) => (
                  <article
                    className={`track-row ${activeTrack?.id === track.id ? "is-playing" : ""}`}
                    key={track.id || track._id || index}
                  >
                    <button
                      className={`play-btn ${track.color || "violet"}`}
                      onClick={() => playTrack(track)}
                      aria-label={`Play ${track.title}`}
                    >
                      {activeTrack?.id === track.id ? "Ⅱ" : "▶"}
                    </button>
                    <div className="track-meta">
                      <strong>{track.title}</strong>
                      <span>
                        {track.artist || "Unknown artist"} <i>·</i>{" "}
                        {track.genre || "New release"}
                      </span>
                    </div>
                    <div className="mini-wave">▂▅▃▇▆▃</div>
                    <span className="track-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </article>
                ))}
                {visibleTracks.length === 0 && (
                  <p className="empty-state">No tracks match that search.</p>
                )}
              </div>
            </div>
            <aside className="side-panel" id="albums">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">COLLECTED WORLDS</p>
                  <h2>Albums</h2>
                </div>
                <span className="count-label">
                  {albums.length} total
                </span>
              </div>
              {albums.map((album, index) => (
                <div
                  className="album-item"
                  key={album._id || album.id || index}
                >
                  <div className={`album-art art-${index % 3}`}>
                    <span>{["◌", "✦", "≈"][index % 3]}</span>
                  </div>
                  <div>
                    <strong>{album.title}</strong>
                    <span>
                      {album.artist?.username ||
                        album.artist ||
                        "Various artists"}
                    </span>
                  </div>
                  <button aria-label={`Open ${album.title}`}>↗</button>
                </div>
              ))}
            </aside>
          </section>
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
      <div className="player-dock">
        {activeTrack ? (
          <>
            <div className="now-playing">
              <span className="equalizer">▂▅▇</span>
              <div>
                <small>NOW PLAYING</small>
                <strong>{activeTrack.title}</strong>
              </div>
            </div>
            <audio ref={audioRef} controls />
          </>
        ) : (
          <span>Select a track to start listening</span>
        )}
      </div>
    </main>
  );
}

export default App;
