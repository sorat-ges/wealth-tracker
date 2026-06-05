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
    return <main className="app-shell center-state">กำลังโหลด...</main>;
  }

  if (!user) {
    return (
      <main className="app-shell auth-screen">
        <section className="auth-card">
          <p className="screen-kicker">Wealth Tracker</p>
          <h1>ติดตามความมั่งคั่งลงทุนแบบส่วนตัว</h1>
          <p>เข้าสู่ระบบด้วย Google เพื่อซิงก์สินทรัพย์ หนี้สิน snapshot และรายงานกำไรขาดทุนที่ยังไม่รับรู้</p>
          {error ? <p className="error-text">{error}</p> : null}
          <button
            className="primary-button"
            type="button"
            onClick={async () => {
              try {
                setError(null);
                await signInWithGoogle();
              } catch {
                setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาตรวจสอบ Firebase authorized domains แล้วลองอีกครั้ง");
              }
            }}
          >
            <LogIn size={18} />
            เข้าสู่ระบบด้วย Google
          </button>
        </section>
      </main>
    );
  }

  return children(user);
}
