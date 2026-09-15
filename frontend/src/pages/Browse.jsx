import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Browse.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://music-website-zzol.onrender.com/api'
const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID || 'bba9d5f5'

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'pakistani', label: '🇵🇰 Pakistani',      term: 'atif aslam',         country: 'PK' },
  { id: 'bollywood', label: '🎬 Bollywood',        term: 'arijit singh',        country: 'IN' },
  { id: 'international', label: '🌍 International', term: 'pop hits 2024',      country: 'US' },
  { id: 'pop',       label: '🎵 Pop',              term: 'pop',                 country: 'US' },
  { id: 'hiphop',    label: '🎤 Hip-Hop',          term: 'hip hop rap',         country: 'US' },
  { id: 'rnb',       label: '🎶 R&B',              term: 'rnb soul',            country: 'US' },
  { id: 'indie',     label: '🎸 Indie',            term: 'indie alternative',   country: 'US' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getMe() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return data.user || null
  } catch {
    return null
  }
}

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...options,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Something went wrong')
    return data
  }

async function searchJamendo(term, limit = 24) {
  try {
    if (!JAMENDO_CLIENT_ID) throw new Error('Add VITE_JAMENDO_CLIENT_ID to the frontend environment.')
    const params = new URLSearchParams({
      client_id: JAMENDO_CLIENT_ID,
      format: 'json',
      search: term,
      limit: String(limit),
      audioformat: 'mp32',
      imagesize: '300',
      include: 'licenses musicinfo',
    })
    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`)
    if (!res.ok) throw new Error('Jamendo music could not be loaded.')
    const data = await res.json()
    return (data.results || []).filter((track) => track.audio).map((track) => ({
      trackId: track.id,
      trackName: track.name,
      artistName: track.artist_name,
      primaryGenreName: track.musicinfo?.tags?.genres?.[0] || 'Independent',
      artworkUrl100: track.image || track.album_image,
      previewUrl: track.audio,
      trackViewUrl: track.shareurl,
    }))
  } catch (error) {
    console.error(error)
    return []
  }
}

async function searchITunes(term, country = 'PK', limit = 24) {
  try {
    const params = new URLSearchParams({
      term,
      media: 'music',
      entity: 'song',
      limit: String(limit),
      country,
    })
    const res = await fetch(`https://itunes.apple.com/search?${params}`)
    if (!res.ok) throw new Error('iTunes music could not be loaded.')
    const data = await res.json()
    return (data.results || []).filter((track) => track.previewUrl).map((track) => ({
      trackId: `itunes-${track.trackId}`,
      trackName: track.trackName,
      artistName: track.artistName,
      primaryGenreName: track.primaryGenreName || 'Pakistani',
      artworkUrl100: track.artworkUrl100?.replace('100x100bb', '300x300bb'),
      previewUrl: track.previewUrl,
      trackViewUrl: track.trackViewUrl,
    }))
  } catch (error) {
    console.error(error)
    return []
  }
}

async function searchCategory(category) {
  const jamendoTracks = await searchJamendo(category.term)
  if (category.id !== 'pakistani') return jamendoTracks
  const itunesTracks = await searchITunes(category.term, category.country)
  return [...itunesTracks, ...jamendoTracks]
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Browse({ embedded = false, initialUser = null }) {
  const [user, setUser]                   = useState(initialUser)
  const [checking, setChecking]           = useState(!initialUser)
  const [activeCategory, setActiveCategory] = useState('pakistani')
  const [tracks, setTracks]               = useState([])
    const [favoriteTracks, setFavoriteTracks] = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTrack, setActiveTrack]     = useState(null)
  const [isPlaying, setIsPlaying]         = useState(false)
  const audioRef                          = useRef(null)

  // ── Check who is logged in ───────────────────────────────────────────────
  useEffect(() => {
    if (initialUser) return
    getMe().then((u) => { setUser(u); setChecking(false) })
  }, [initialUser])

  useEffect(() => {
    if (!user) return
    request('/music/favorites')
      .then((data) => setFavoriteTracks(data.favorites || []))
      .catch(() => setFavoriteTracks([]))
  }, [user])

  // ── Fetch tracks when category changes ───────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== 'user') return
    const cat = CATEGORIES.find((c) => c.id === activeCategory)
    if (!cat) return
    searchCategory(cat).then((results) => {
      setTracks(results)
      setLoading(false)
    })
  }, [activeCategory, user])

  // ── Play track ───────────────────────────────────────────────────────────
  function playTrack(track) {
    if (activeTrack?.trackId === track.trackId) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
      else           { audioRef.current?.play();  setIsPlaying(true)  }
    } else {
      setActiveTrack(track)
    }
  }

  async function toggleFavorite(event, track) {
    event.stopPropagation()
    const isFavorite = favoriteTracks.some((favorite) => favorite.trackId === track.trackId)
    try {
      const data = isFavorite
        ? await request(`/music/favorites/${encodeURIComponent(track.trackId)}`, { method: 'DELETE' })
        : await request('/music/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackId: track.trackId,
              title: track.trackName,
              artist: track.artistName,
              genre: track.primaryGenreName,
              color: 'violet',
              uri: track.previewUrl,
            }),
          })
      setFavoriteTracks(data.favorites || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (activeTrack && audioRef.current) {
      audioRef.current.src = activeTrack.previewUrl
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [activeTrack])

  // ── Loading auth ─────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="browse-shell">
        <div className="browse-center-msg">
          <div className="browse-spinner" />
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="browse-shell">
        <div className="browse-center-msg">
          <p className="browse-eyebrow">ACCESS DENIED</p>
          <h2>Sign in to browse music.</h2>
          <Link className="browse-cta" to="/">Go to Sign In →</Link>
        </div>
      </div>
    )
  }

  // ── Artist role — not allowed ─────────────────────────────────────────────
  if (user.role !== 'user') {
    return (
      <div className="browse-shell">
        <div className="browse-center-msg">
          <span className="browse-big-icon">🎙️</span>
          <p className="browse-eyebrow">ARTISTS CREATE</p>
          <h2>Browse is for listeners.</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '8px 0 24px' }}>
            Switch to a listener account to explore music by category.
          </p>
          <Link className="browse-cta" to="/">← Back</Link>
        </div>
      </div>
    )
  }

  // ── Main browse UI (listener only) ───────────────────────────────────────
  return (
    <div className={`browse-shell ${embedded ? 'embedded' : ''} ${activeTrack ? 'has-player' : ''}`}>

      {!embedded && (
        <header className="browse-topbar">
          <Link className="browse-brand" to="/">
            <span className="browse-brand-mark">◒</span> SONORA<span className="browse-dot">.</span>
          </Link>
          <div className="browse-topbar-right">
            <span className="browse-username">{user.username}</span>
            <Link className="browse-favorites-btn" to="/favorites">Favourites</Link>
            <Link className="browse-ghost-btn" to="/">← Back</Link>
          </div>
        </header>
      )}

      {/* ── Hero ── */}
      <div className="browse-hero">
        <p className="browse-eyebrow">DISCOVER / 02</p>
        <h1>Find your next<br /><em>obsession.</em></h1>
        <p className="browse-hero-sub">
          30-second previews · {tracks.length > 0 ? `${tracks.length} tracks` : 'Loading…'}
        </p>
      </div>

      {/* ── Category tabs ── */}
      <div className="browse-tabs-wrap">
        <div className="browse-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`browse-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => { setLoading(true); setActiveCategory(cat.id) }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Track grid ── */}
      <main className="browse-main">
        {loading ? (
          <div className="browse-loading-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="browse-card-skeleton" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="browse-center-msg">
            <p>No tracks found. Try another category.</p>
          </div>
        ) : (
          <div className="browse-grid">
            {tracks.map((track) => {
              const isActive = activeTrack?.trackId === track.trackId
              return (
                <div
                  key={track.trackId}
                  className={`browse-card ${isActive ? 'active' : ''}`}
                  onClick={() => playTrack(track)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && playTrack(track)}
                >
                  {/* Album art */}
                  <div className="browse-art-wrap">
                    <img
                      src={track.artworkUrl100?.replace('100x100bb', '300x300bb')}
                      alt={track.trackName}
                      className="browse-art"
                      loading="lazy"
                    />
                    <div className="browse-overlay">
                      <span className="browse-play-icon">
                        {isActive && isPlaying ? '⏸' : '▶'}
                      </span>
                    </div>
                    {isActive && (
                      <div className="browse-now-playing-badge">NOW PLAYING</div>
                    )}
                    <button
                      className={`browse-favorite-btn ${favoriteTracks.some((favorite) => favorite.trackId === track.trackId) ? 'is-favorite' : ''}`}
                      onClick={(event) => toggleFavorite(event, track)}
                      aria-label={`${favoriteTracks.some((favorite) => favorite.trackId === track.trackId) ? 'Remove' : 'Add'} ${track.trackName} ${favoriteTracks.some((favorite) => favorite.trackId === track.trackId) ? 'from' : 'to'} favourites`}
                    >
                      {favoriteTracks.some((favorite) => favorite.trackId === track.trackId) ? '♥' : '♡'}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="browse-card-info">
                    <p className="browse-track-name">{track.trackName}</p>
                    <p className="browse-artist-name">{track.artistName}</p>
                    <p className="browse-preview-label">▷ 30s preview</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Bottom player ── */}
      {activeTrack && (
        <div className="browse-player">
          <img
            src={activeTrack.artworkUrl100}
            alt={activeTrack.trackName}
            className="browse-player-art"
          />
          <div className="browse-player-info">
            <p className="browse-player-title">{activeTrack.trackName}</p>
            <p className="browse-player-artist">{activeTrack.artistName}</p>
          </div>
          <audio
            ref={audioRef}
            controls
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="browse-player-audio"
          />
          <button
            className="browse-player-close"
            onClick={() => { setActiveTrack(null); setIsPlaying(false) }}
            aria-label="Close player"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}