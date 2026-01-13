import React from "react";
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

// React 앱 마운트 (에러 처리 추가)
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[main] Root element not found!');
  throw new Error('Root element not found');
}

// 에러 경계 컴포넌트 추가
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: 'red' }}>앱 오류</h1>
          <p>앱을 불러오는 중 오류가 발생했습니다.</p>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '20px' }}>
            {this.state.error?.message || '알 수 없는 오류'}
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  console.log('[main] Mounting React app...');
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log('[main] React app mounted successfully');
} catch (error) {
  console.error('[main] Failed to mount React app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h1 style="color: red;">앱 로딩 오류</h1>
      <p>앱을 불러오는 중 오류가 발생했습니다.</p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">${error instanceof Error ? error.message : String(error)}</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">새로고침</button>
    </div>
  `;
}

