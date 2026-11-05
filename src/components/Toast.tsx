import { useEffect, useState } from 'react';
import { setToast } from '../lib/order';

export default function Toast() {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null);

  useEffect(() => {
    let t = 0;
    setToast((text) => {
      setMsg({ text, key: Date.now() });
      window.clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 3600);
    });
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="toast" role="status" aria-live="polite">
      {msg && (
        <p key={msg.key} className="toast__msg">
          {msg.text}
        </p>
      )}
    </div>
  );
}
