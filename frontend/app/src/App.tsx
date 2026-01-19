import { useEffect, useMemo, useState, useRef } from "react";

export type User = {
  id: string;
  username: string;
  is_admin: boolean;
};

type JournalEntry = {
  id: string;
  text: string;
  mood: number;
  entry_datetime: string;
};

type MoodDay = {
  date: string;
  average_mood: number;
  entries: number;
};

type Settings = {
  display_name: string;
  reminder_time: string;
  theme: string;
  timezone: string;
};

// Common timezones list since Intl.supportedValuesOf might be missing in TS lib
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  // Fallback to local if not in list
  Intl.DateTimeFormat().resolvedOptions().timeZone
].filter((v, i, a) => a.indexOf(v) === i).sort();;

type Tab = "new" | "history" | "calendar" | "settings";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function apiFetch<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

import Login from "./components/Login";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [calendar, setCalendar] = useState<MoodDay[]>([]);
  const [settings, setSettings] = useState({
    display_name: "",
    reminder_time: "09:00",
    theme: "warm",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [entryText, setEntryText] = useState("");
  const [mood, setMood] = useState(7);
  const [hoverMood, setHoverMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef(""); // Store text before recording starts

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const username = useMemo(() => user?.username ?? "demo", [user]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const list = await apiFetch<{ items: JournalEntry[] }>("/api/user/journal", token);
        const moodDays = await apiFetch<{ days: MoodDay[] }>("/api/user/mood-calendar", token);
        const userSettings = await apiFetch<Settings>("/api/user/settings", token);

        setEntries(list.items);
        setCalendar(moodDays.days);
        setSettings(userSettings);
      } catch (error) {
        setStatus(`Failed loading data: ${String(error)}`);
      }
    };

    load();
  }, [token]);

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setStatus("");
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setEntries([]);
    setCalendar([]);
    setActiveTab("new");
    setStatus("");
  };

  const saveEntry = async () => {
    if (!token || !entryText.trim()) return;

    setSaving(true);
    try {
      const result = await apiFetch<{ item: JournalEntry }>("/api/user/journal", token, {
        method: "POST",
        body: JSON.stringify({ text: entryText, mood })
      });
      setEntries((prev) => [result.item, ...prev]);
      setEntryText("");
      setStatus("Entry saved. Nice work.");
      const moodDays = await apiFetch<{ days: MoodDay[] }>("/api/user/mood-calendar", token);
      setCalendar(moodDays.days);
      setActiveTab("history");
    } catch (error) {
      setStatus(`Save failed: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async () => {
    if (!token) return;

    try {
      const next = await apiFetch<Settings>("/api/user/settings", token, {
        method: "PUT",
        body: JSON.stringify(settings)
      });
      setSettings(next);
      setStatus("Settings updated.");
    } catch (error) {
      setStatus(`Settings failed: ${String(error)}`);
    }
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const getMoodColor = (m: number) => {
    if (m <= 3) return 'var(--berry)';
    if (m <= 6) return 'var(--sunrise)';
    return 'var(--leaf)';
  };

  return (
    <div className={`app-shell ${isMenuOpen ? 'menu-open' : ''}`} data-theme={settings.theme}>
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="brand">Journal App</div>
          <button className="burger-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        <div className="sidebar-content">
          <div className="nav">
            <button className={activeTab === "new" ? "active" : ""} onClick={() => { setActiveTab("new"); setIsMenuOpen(false); }}>
              New Entry
            </button>
            <button
              className={activeTab === "history" ? "active" : ""}
              onClick={() => { setActiveTab("history"); setIsMenuOpen(false); }}
            >
              Journal History
            </button>
            <button
              className={activeTab === "calendar" ? "active" : ""}
              onClick={() => { setActiveTab("calendar"); setIsMenuOpen(false); }}
            >
              Mood Calendar
            </button>
            <button
              className={activeTab === "settings" ? "active" : ""}
              onClick={() => { setActiveTab("settings"); setIsMenuOpen(false); }}
            >
              Settings
            </button>
          </div>
          <div className="user-profile">
            <div className="badge">
              {username}
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 0 0 4px",
                  fontSize: "1rem",
                  lineHeight: 1,
                  opacity: 0.6
                }}
                title="Logout"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        {status && <div className="badge">{status}</div>}
      </aside>
      <main className="content">
        {activeTab === "new" && (
          <section className="card" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden' // proper containment
          }}>
            <div style={{ flexShrink: 0 }}>
              <h2>Welcome back, {settings.display_name || "Friend"}!</h2>
              <p style={{ marginBottom: '2rem', color: 'var(--ink)', opacity: 0.8 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="row" style={{ alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <label className="input" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Mood</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '2rem', marginRight: '0.5rem', lineHeight: 1 }}>
                        {(hoverMood || mood) <= 2 ? "⛈️" :
                          (hoverMood || mood) <= 4 ? "🌧️" :
                            (hoverMood || mood) <= 6 ? "☁️" :
                              (hoverMood || mood) <= 8 ? "⛅" :
                                "☀️"}
                      </span>
                      <span style={{ color: 'var(--leaf)', fontWeight: 'bold', verticalAlign: 'middle' }}>
                        {(hoverMood || mood) <= 2 ? "Stormy" :
                          (hoverMood || mood) <= 4 ? "Rainy" :
                            (hoverMood || mood) <= 6 ? "Cloudy" :
                              (hoverMood || mood) <= 8 ? "Brightening" :
                                "Sunny"}
                      </span>
                    </div>
                  </div>

                  {/* Signal Strength / Weather Bars */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '6px',
                      height: '60px',
                      padding: '10px 0'
                    }}
                    onMouseLeave={() => setHoverMood(null)}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => {
                      const isActive = value <= (hoverMood || mood);
                      const isHovered = hoverMood === value;

                      // Calculate height: 40% base + steps
                      const height = `${30 + (value * 7)}%`;

                      // Colors
                      let color = "var(--sky)";
                      if (isActive) {
                        if (value <= 3) color = "var(--berry)";
                        else if (value <= 6) color = "var(--sunrise)";
                        else color = "var(--leaf)";
                      }

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setMood(value)}
                          onMouseEnter={() => setHoverMood(value)}
                          style={{
                            flex: 1,
                            height: height,
                            background: isActive ? color : '#e0e0e0', // Darker gray for placeholder
                            border: isActive ? 'none' : '1px solid #ccc', // Border for placeholder
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: isActive ? 1 : 0.6, // Higher opacity
                            transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                            transformOrigin: 'bottom',
                            boxShadow: isActive ? '0 2px 4px var(--shadow)' : 'none'
                          }}
                          aria-label={`Mood ${value}`}
                          title={`${value}/10`}
                        />
                      );
                    })}
                  </div>
                </label>
              </div>
            </div>

            <div style={{ position: 'relative', flex: 1, minHeight: 0, marginBottom: '1rem', display: 'flex', flexDirection: 'column' }}>
              <textarea
                value={entryText}
                onChange={(event) => setEntryText(event.target.value)}
                placeholder="Write about your day..."
                style={{
                  fontFamily: '"Patrick Hand", cursive',
                  fontSize: '1.35rem',
                  lineHeight: '1.6',
                  padding: '2rem',
                  backgroundImage: 'linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.05) 31px, rgba(0,0,0,0.05) 32px)',
                  backgroundSize: '100% 32px',
                  backgroundColor: 'var(--cream)',
                  border: '1px solid var(--peach)',
                  borderRadius: '16px',
                  width: '100%',
                  height: '100%', // Fill flex container
                  resize: 'none', // Disable manual resize
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  opacity: isRecording ? 0.7 : 1,
                  boxSizing: 'border-box',
                  overflowY: 'auto' // Allow internal scrolling
                }}
                readOnly={isRecording}
              />
              {/* Voice Input Button - Pinned to bottom right of container */}
              {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
                <button
                  type="button"
                  onClick={() => {
                    // Check if already recording: stop if so
                    if (isRecording && recognitionRef.current) {
                      console.log("Stopping voice recognition...");
                      recognitionRef.current.stop();
                      return;
                    }

                    console.log("Starting voice recognition...");
                    setStatus("Initializing mic...");

                    // @ts-ignore - SpeechRecognition types might be missing
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

                    if (!SpeechRecognition) {
                      setStatus("Voice not supported in this browser.");
                      return;
                    }

                    // Abort previous instance if exists (just in case state got out of sync)
                    if (recognitionRef.current) {
                      recognitionRef.current.abort();
                    }

                    const recognition = new SpeechRecognition();
                    recognitionRef.current = recognition; // Store in ref to prevent GC

                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-US';

                    recognition.onstart = () => {
                      console.log("Voice recognition started");
                      setStatus("Listening...");
                      setIsRecording(true);
                      baseTextRef.current = entryText; // Save current text
                    };

                    recognition.onresult = (event: any) => {
                      // Construct transcript from all results in this session
                      let transcript = "";
                      for (let i = 0; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript;
                        // Add space if not last
                        /* 
                           Note: simple concatenation. 
                           Smart spacing (like " " between results) is cleaner.
                        */
                      }

                      // Better spacing approach:
                      const pieces = [];
                      for (let i = 0; i < event.results.length; i++) {
                        pieces.push(event.results[i][0].transcript);
                      }
                      const currentSessionText = pieces.join(' '); // Join chunks with space

                      // Combine base text + current session text
                      const spacer = baseTextRef.current && currentSessionText ? " " : "";
                      setEntryText(baseTextRef.current + spacer + currentSessionText);

                      setStatus("Voice input received.");
                    };

                    recognition.onerror = (event: any) => {
                      console.error("Voice recognition error", event);
                      if (event.error === 'no-speech') {
                        setStatus("No speech detected.");
                      } else if (event.error === 'aborted') {
                        setStatus(""); // Ignore aborted error
                      } else {
                        setStatus("Error: " + event.error);
                      }
                      // Note: onend will fire after this
                    };

                    recognition.onend = () => {
                      console.log("Voice recognition ended");
                      setIsRecording(false);
                      recognitionRef.current = null; // Clear ref
                      // clear status after a moment if it was just "Listening..."
                      setTimeout(() => setStatus(prev => prev === "Listening..." ? "" : prev), 2000);
                    };

                    try {
                      recognition.start();
                    } catch (e) {
                      console.error("Failed to start recognition:", e);
                      setStatus("Mic failed to start.");
                    }
                  }}
                  title={isRecording ? "Stop recording" : "Start recording"}
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    right: '24px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: isRecording ? '3px solid #ffcccc' : 'none',
                    background: isRecording ? 'var(--berry)' : 'var(--ink)',
                    color: 'white',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isRecording ? '0 0 15px var(--berry)' : '0 4px 12px var(--shadow)',
                    transition: 'all 0.2s',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isRecording ? (
                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '2px' }} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  )}
                </button>
              )}
            </div>

            <div className="row" style={{ flexShrink: 0 }}>
              <button className="button" onClick={saveEntry} disabled={saving}>
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="card">
            <h2>Journal History</h2>
            <div className="entry-list">
              {entries.length === 0 && <div className="entry">No entries yet.</div>}
              {entries.map((entry) => (
                <article key={entry.id} className="entry">
                  <div className="badge" style={{ backgroundColor: getMoodColor(entry.mood), color: 'white' }}>Mood {entry.mood}</div>
                  <p>{entry.text}</p>
                  <small>{new Date(entry.entry_datetime).toLocaleString()}</small>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "calendar" && (
          <section className="card">
            <h2>Mood Calendar</h2>
            <div className="calendar-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '1rem'
            }}>
              {calendar.length === 0 && <div className="entry">No mood data yet.</div>}
              {calendar.map((day) => (
                <div key={day.date} className="entry" style={{
                  backgroundColor: getMoodColor(day.average_mood),
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '1rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <strong style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{new Date(day.date).getDate()}</strong>
                  <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{new Date(day.date).toLocaleString('default', { month: 'short' })}</span>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    {day.average_mood.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="card">
            <h2>Settings</h2>
            <div className="row">
              <label className="input">
                Display name
                <input
                  value={settings.display_name}
                  onChange={(event) => setSettings({ ...settings, display_name: event.target.value })}
                />
              </label>
              <label className="input">
                Reminder time
                <input
                  type="time"
                  value={settings.reminder_time}
                  onChange={(event) => setSettings({ ...settings, reminder_time: event.target.value })}
                />
              </label>
              <label className="input">
                Theme
                <select
                  value={settings.theme}
                  onChange={(event) => setSettings({ ...settings, theme: event.target.value })}
                >
                  <option value="warm">Warm</option>
                  <option value="citrus">Citrus</option>
                  <option value="sunset">Sunset</option>
                </select>
              </label>
              <label className="input">
                Timezone
                <select
                  value={settings.timezone}
                  onChange={(event) => setSettings({ ...settings, timezone: event.target.value })}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="button" onClick={updateSettings}>
              Save Settings
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
