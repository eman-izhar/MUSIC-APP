import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Favorites.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://music-website-zzol.onrender.com/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState(null);
  const [notice, setNotice] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    Promise.all([request("/auth/me"), request("/music/favorites")])
      .then(([userData, favoriteData]) => {
        setUser(userData.user);
        setFavorites(favoriteData.favorites || []);
      })
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, []);

  function playTrack(track) {
    setActiveTrack(track);
    if (!track.uri || !audioRef.current) return;
    audioRef.current.src = track.uri;
    audioRef.current.play().catch(() => setNotice("Press play to start this track."));
  }

  async function removeFavorite(trackId) {
    try {
      const data = await request(`/music/favorites/${encodeURIComponent(trackId)}`, {
        method: "DELETE",
      });
      setFavorites(data.favorites || []);
      if (activeTrack?.trackId === trackId) setActiveTrack(null);
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (loading) {
    return <div className="favorites-page"><p className="favorites-status">Loading your favourites...</p></div>;
  }

  if (!user) {
    return (
      <div className="favorites-page">
        <div className="favorites-message">
          <p className="favorites-eyebrow">PRIVATE FREQUENCY / 03</p>
          <h1>Sign in to see your favourites.</h1>
          <Link className="favorites-cta" to="/">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="favorites-page">
      <header className="favorites-topbar">
        <Link className="favorites-brand" to="/">
          <span>◒</span> SONORA<span className="favorites-dot">.</span>
        </Link>
        <div className="favorites-actions">
          <span>{user.username}</span>
          <Link to="/">Back home</Link>
        </div>
      </header>

      <section className="favorites-hero">
        <p className="favorites-eyebrow">YOUR COLLECTION / 03</p>
        <h1>Your <em>favourites.</em></h1>
        <p>Every track you wanted to keep close, in one place.</p>
      </section>

      {notice && <p className="favorites-notice">{notice}</p>}

      <section className="favorites-content">
        <div className="favorites-heading">
          <h2>Saved tracks</h2>
          <span>{favorites.length} saved</span>
        </div>
        {favorites.length === 0 ? (
          <div className="favorites-empty">
            <span>♡</span>
            <h2>Your list is waiting.</h2>
            <p>Add tracks from your library and they will appear here.</p>
            <Link to="/" className="favorites-cta">Explore your library</Link>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((track, index) => (
              <article className="favorites-track" key={track.trackId}>
                <span className="favorites-number">{String(index + 1).padStart(2, "0")}</span>
                <button
                  className={`favorites-play ${track.color || "violet"}`}
                  onClick={() => playTrack(track)}
                  aria-label={`Play ${track.title}`}
                >
                  {activeTrack?.trackId === track.trackId ? "Ⅱ" : "▶"}
                </button>
                <div className="favorites-track-meta">
                  <strong>{track.title}</strong>
                  <span>{track.artist} <i>·</i> {track.genre}</span>
                </div>
                <button
                  className="favorites-remove"
                  onClick={() => removeFavorite(track.trackId)}
                  aria-label={`Remove ${track.title} from favourites`}
                >
                  ♥
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <audio ref={audioRef} controls className="favorites-audio" />
    </main>
  );
}
