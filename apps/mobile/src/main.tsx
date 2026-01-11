import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";

// Capacitor 확인 (네이티브 앱 환경에서만 사용 가능)
// 웹 브라우저에서는 Capacitor가 없으므로 안전하게 확인
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  console.log('[Capacitor] Running in native app');
} else {
  console.log('[Capacitor] Running in web browser');
}

createRoot(document.getElementById("root")!).render(<App />);

