import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { X, Download, Share } from "lucide-react";
import { detectPWA } from "../utils/pwaDetect";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  onClose?: () => void;
}

export function PWAInstallPrompt({ onClose }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null);

  useEffect(() => {
    const detection = detectPWA();

    // 이미 설치되었거나 설치 불가능한 경우 표시 안 함
    if (!detection.canInstall) {
      return;
    }

    // 이전에 닫았는지 확인 (24시간 동안 다시 표시 안 함)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        return;
      }
    }

    // 플랫폼 설정
    if (detection.isAndroid) {
      setPlatform('android');

      // Android: beforeinstallprompt 이벤트 대기
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handler);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    } else if (detection.isIOS) {
      setPlatform('ios');
      // iOS: 바로 프롬프트 표시
      setShowPrompt(true);
    }
  }, []);

  const handleInstall = async () => {
    if (platform === 'android' && deferredPrompt) {
      // Android: 설치 프롬프트 표시
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA 설치 수락됨');
      } else {
        console.log('PWA 설치 거부됨');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
      onClose?.();
    }
  };

  const handleClose = () => {
    // 24시간 동안 다시 표시 안 함
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
    onClose?.();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        {/* Android Prompt */}
        {platform === 'android' && (
          <>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Download className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">앱으로 설치하기</h2>
              <p className="text-slate-600">
                홈 화면에 추가하여<br />더 빠르고 편리하게 사용하세요!
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={handleInstall}
                className="w-full h-14 text-lg font-bold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-xl"
              >
                지금 설치하기
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full h-12 text-slate-600"
              >
                나중에
              </Button>
            </div>
          </>
        )}

        {/* iOS Guide */}
        {platform === 'ios' && (
          <>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Share className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">앱으로 설치하기</h2>
              <p className="text-slate-600 text-sm">
                Safari에서 홈 화면에 추가하여<br />앱처럼 사용할 수 있습니다
              </p>
            </div>

            {/* Step-by-step guide */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">하단 공유 버튼 탭</p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    화면 하단 중앙의 <Share className="inline h-3 w-3" /> 아이콘을 탭하세요
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">"홈 화면에 추가" 선택</p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    메뉴에서 "홈 화면에 추가"를 찾아 선택하세요
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">"추가" 버튼 탭</p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    오른쪽 상단의 "추가" 버튼을 탭하면 완료!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full h-12 text-slate-600"
              >
                확인했습니다
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
