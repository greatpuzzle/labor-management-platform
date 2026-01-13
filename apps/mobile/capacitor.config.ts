import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecospott.labor',
  appName: '근로자 관리',
  webDir: 'dist',
  server: {
    // 개발 중에는 아래 주석을 해제하여 로컬 서버 사용
    // url: 'http://localhost:5174',
    // cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'automatic'
  },
  // Deep Link 설정 (카카오톡에서 앱으로 연결)
  app: {
    // Android Intent URL scheme
    // 예: labor://contract/contractId
    // 또는 https://gp-ecospot.com/contract/contractId (App Links)
  }
};

export default config;
