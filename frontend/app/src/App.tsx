import { useEffect, useMemo, useState } from "react";

type User = {
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
};

type Tab = "new" | "history" | "calendar" | "settings";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function apiFetch<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [calendar, setCalendar] = useState<MoodDay[]>([]);
  const [settings, setSettings] = useState<Settings>({
    display_name: "Friend",
    reminder_time: "20:00",
    theme: "warm"
  });
  const [entryText, setEntryText] = useState("");
  const [mood, setMood] = useState(7);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const username = useMemo(() => user?.username ?? "demo", [user]);

  useEffect(() => {
    const authenticate = async () => {
      const login = await apiFetch<{ access_token: string; user: User }>(
        `/api/public/login?username=demo`,
        undefined,
        { method: "POST" }
      );
      setToken(login.access_token);
      setUser(login.user);
    };

    authenticate().catch((error) => {
      setStatus(`Login failed: ${String(error)}`);
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      const list = await apiFetch<{ items: JournalEntry[] }>("/api/user/journal", token);
      const moodDays = await apiFetch<{ days: MoodDay[] }>("/api/user/mood-calendar", token);
      const userSettings = await apiFetch<Settings>("/api/user/settings", token);

      setEntries(list.items);
      setCalendar(moodDays.days);
      setSettings(userSettings);
    };

    load().catch((error) => {
      setStatus(`Failed loading data: ${String(error)}`);
    });
  }, [token]);

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Journal App</div>
          <div className="badge">{username}</div>
        </div>
        <div className="nav">
          <button className={activeTab === "new" ? "active" : ""} onClick={() => setActiveTab("new")}>
            New Entry
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            Journal History
          </button>
          <button
            className={activeTab === "calendar" ? "active" : ""}
            onClick={() => setActiveTab("calendar")}
          >
            Mood Calendar
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
        {status && <div className="badge">{status}</div>}
      </aside>
      <main className="content">
        {activeTab === "new" && (
          <section className="card">
            <h2>New Journal Entry</h2>
            <p>Capture what happened today and how it felt.</p>
            <div className="row">
              <label className="input">
                Mood (1-10)
                <select value={mood} onChange={(event) => setMood(Number(event.target.value))}>
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <textarea
              value={entryText}
              onChange={(event) => setEntryText(event.target.value)}
              placeholder="Write about your day..."
            />
            <div className="row">
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
                  <div className="badge">Mood {entry.mood}</div>
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
            <div className="calendar-grid">
              {calendar.length === 0 && <div className="entry">No mood data yet.</div>}
              {calendar.map((day) => (
                <div key={day.date} className="entry">
                  <strong>{day.date}</strong>
                  <p>Average mood: {day.average_mood.toFixed(1)}</p>
                  <small>{day.entries} entries</small>
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
