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
                </div>

                <p style={{ marginTop: "2rem", textAlign: "center", opacity: 0.7, fontSize: "0.9rem" }}>
                    Tip: Try <strong>demo</strong> or <strong>admin</strong>
                </p>
            </form>
        </div>
    );
}
