import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { api } from '@shared/api';

/**
 * Push Notification 초기화 및 토큰 등록
 */
export async function initializePushNotifications(employeeId: string): Promise<string | null> {
  // 웹 환경에서는 Push Notifications가 지원되지 않음
  if (!Capacitor.isNativePlatform()) {
    console.log('[PushNotifications] Not running on native platform, skipping initialization');
    return null;
  }

  try {
    // 권한 요청
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    
    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotifications] Push notification permission denied');
      return null;
    }

    // 푸시 알림 등록
    await PushNotifications.register();

    // 토큰 등록 이벤트 리스너
    let pushToken: string | null = null;
    
    PushNotifications.addListener('registration', async (token) => {
      console.log('[PushNotifications] Push registration success, token:', token.value);
      pushToken = token.value;
      
      // 백엔드에 토큰 등록
      try {
        const platform = Capacitor.getPlatform(); // 'android' or 'ios'
        await api.registerPushToken(employeeId, token.value, platform);
        console.log('[PushNotifications] Token registered on backend');
      } catch (error) {
        console.error('[PushNotifications] Failed to register token on backend:', error);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[PushNotifications] Error on registration:', error);
    });

    // 푸시 알림 수신 이벤트 리스너
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Push notification received:', notification);
    });

    // 푸시 알림 클릭 이벤트 리스너
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[PushNotifications] Push notification action performed:', notification);
      
      // 알림 데이터에 따라 앱 내부 네비게이션 처리
      if (notification.notification.data) {
        // 예: { action: 'contract', contractId: '...' }
        const { action, contractId } = notification.notification.data;
        if (action === 'contract' && contractId) {
          window.location.href = `/contract/${contractId}`;
        }
      }
    });

    return pushToken;
  } catch (error) {
    console.error('[PushNotifications] Failed to initialize:', error);
    return null;
  }
}

/**
 * Push Notification 토큰 해제
 */
export async function unregisterPushNotifications(employeeId: string): Promise<void> {
  try {
    await api.unregisterPushToken(employeeId);
  } catch (error) {
    console.error('[PushNotifications] Failed to unregister token:', error);
  }
}

