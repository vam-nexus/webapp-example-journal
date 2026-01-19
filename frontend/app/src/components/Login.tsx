import { useState } from "react";
import { User, apiFetch } from "../App";

type LoginProps = {
    onLogin: (token: string, user: User) => void;
};

export default function Login({ onLogin }: LoginProps) {
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError("");

        try {
            const result = await apiFetch<{ access_token: string; user: User }>(
                `/api/public/login?username=${encodeURIComponent(username)}`,
                undefined,
                { method: "POST" }
            );
            onLogin(result.access_token, result.user);
        } catch (err) {
            setError(`Login failed: ${String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <form className="card" onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "400px" }}>
                <a
                    href="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                        color: "var(--text-secondary, #666)",
                        textDecoration: "none",
                        fontSize: "0.9rem"
                    }}
                >
                    <span>←</span> Back to Home
                </a>

                <h2 className="brand" style={{ textAlign: "center", marginBottom: "2rem" }}>Journal App</h2>

                <div className="row" style={{ flexDirection: "column" }}>
                    <label className="input">
                        Username
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username (e.g., demo, admin)"
                            autoFocus
                        />
                    </label>

                    {error && (
                        <div className="badge" style={{ background: "var(--berry)", color: "white", justifyContent: "center" }}>
                            {error}
                        </div>
                    )}

                    <button className="button" type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
                        {loading ? "Logging in..." : "Log In"}
                    </button>

                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        margin: "1.5rem 0",
                        color: "var(--text-secondary, #888)"
                    }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--border, #ddd)" }}></div>
                        <span style={{ fontSize: "0.85rem" }}>OR</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--border, #ddd)" }}></div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            const apiBase = import.meta.env.VITE_API_BASE ?? "";
                            window.location.href = `${apiBase}/auth/google/login`;
                        }}
                        className="button"
                        style={{
                            background: "white",
                            color: "#444",
                            border: "1px solid #ddd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.75rem",
                            fontWeight: 500
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853" />
                            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </button>
                </div>

                <p style={{ marginTop: "2rem", textAlign: "center", opacity: 0.7, fontSize: "0.9rem" }}>
                    Tip: Try <strong>demo</strong> or <strong>admin</strong>
                </p>
            </form>
        </div>
    );
}
