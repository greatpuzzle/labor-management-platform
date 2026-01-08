/**
 * PWA 플랫폼 감지 유틸리티
 */

export interface PWADetection {
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean; // PWA로 설치되어 실행 중인지
  canInstall: boolean; // 설치 가능한지
}

/**
 * iOS 기기 감지
 */
export const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

/**
 * Android 기기 감지
 */
export const isAndroidDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

/**
 * PWA 설치 여부 감지 (standalone 모드)
 */
export const isStandaloneMode = (): boolean => {
  // iOS
  if ('standalone' in window.navigator) {
    return (window.navigator as any).standalone === true;
  }

  // Android / Desktop
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return false;
};

/**
 * PWA 설치 가능 여부 감지
 */
export const detectPWA = (): PWADetection => {
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  const isStandalone = isStandaloneMode();

  // 이미 설치된 경우는 설치 불가
  const canInstall = !isStandalone && (isIOS || isAndroid);

  return {
    isIOS,
    isAndroid,
    isStandalone,
    canInstall,
  };
};
