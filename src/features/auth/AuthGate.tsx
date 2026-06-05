import { onAuthStateChanged, type User } from "firebase/auth";
import { LogIn } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { auth, signInWithGoogle } from "../../firebase/auth";

type AuthGateProps = {
  children: (user: User) => ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <main className="app-shell center-state">Loading...</main>;
  }

  if (!user) {
    return (
      <main className="app-shell auth-screen">
        <section className="auth-card">
          <p className="screen-kicker">Wealth Tracker</p>
          <h1>Private investable wealth tracking.</h1>
          <p>Sign in with Google to sync manual assets, liabilities, snapshots, and unrealized P/L reports.</p>
          {error ? <p className="error-text">{error}</p> : null}
          <button
            className="primary-button"
            type="button"
            onClick={async () => {
              try {
                setError(null);
                await signInWithGoogle();
              } catch {
                setError("Google sign-in failed. Check Firebase authorized domains and try again.");
              }
            }}
          >
            <LogIn size={18} />
            Continue with Google
          </button>
        </section>
      </main>
    );
  }

  return children(user);
}
