import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { api } from '@shared/api';
import { toast } from 'sonner';
import { Loader2, Briefcase } from 'lucide-react';

// 카카오 JavaScript SDK 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

interface PhoneLoginProps {
  onLoginSuccess: (employeeId: string, employeeName: string, companyName: string, contractStatus: string) => void;
}

export function PhoneLogin({ onLoginSuccess }: PhoneLoginProps) {
  const [kakaoLoading, setKakaoLoading] = useState(false);

  // 카카오 SDK 초기화 및 자동 로그인 시도
  useEffect(() => {
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        // 카카오 JavaScript SDK 키 (환경 변수에서 가져오거나 하드코딩)
        const kakaoJsKey = import.meta.env.VITE_KAKAO_JS_KEY || '';
        if (kakaoJsKey) {
          window.Kakao.init(kakaoJsKey);
          console.log('[PhoneLogin] Kakao SDK initialized');
          
          // 자동 로그인 시도 (카카오톡에서 이미 로그인된 경우)
          checkAutoLogin();
        }
      } else if (window.Kakao && window.Kakao.isInitialized()) {
        // 이미 초기화되어 있으면 바로 자동 로그인 시도
        checkAutoLogin();
      }
    };

    // 카카오 SDK 스크립트 로드
    if (!window.Kakao) {
      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      script.integrity = 'sha384-TiCue99IJ55PMHkoDVNHs95s4dkfGqA4E6x7xXrqJXU5K+Q';
      script.crossOrigin = 'anonymous';
      script.onload = initKakao;
      document.head.appendChild(script);
    } else {
      initKakao();
    }
  }, []);

  // 자동 로그인 확인 (카카오톡에서 이미 로그인된 경우)
  const checkAutoLogin = async () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      return;
    }

    try {
      // 이미 발급된 액세스 토큰이 있는지 확인
      const accessToken = window.Kakao.Auth.getAccessToken();
      
      if (accessToken) {
        console.log('[PhoneLogin] Found existing Kakao access token, attempting auto login');
        setKakaoLoading(true);
        
        // 자동 로그인 시도 (회원가입은 근로자 정보 입력 화면에서 처리)
        const loginResult = await api.loginByKakao(accessToken);
        
        if (loginResult.employee) {
          const employee = loginResult.employee;
          const companyName = employee.company?.name || '';
          const contractStatus = (employee as any).contractStatus || 'PENDING';
          
          toast.success('로그인 성공');
          onLoginSuccess(employee.id, employee.name, companyName, contractStatus);
        } else {
          console.log('[PhoneLogin] Auto login failed - employee not found');
        }
        
        setKakaoLoading(false);
      } else {
        console.log('[PhoneLogin] No existing Kakao access token found');
      }
    } catch (error: any) {
      console.log('[PhoneLogin] Auto login check failed (this is OK if user is not logged in):', error);
      // 자동 로그인 실패는 정상적인 경우이므로 에러를 표시하지 않음
      setKakaoLoading(false);
    }
  };

  // 카카오 로그인 처리
  const handleKakaoLogin = async () => {
    setKakaoLoading(true);
    
    // 카카오 SDK가 없거나 초기화되지 않았을 때 테스트 계정으로 로그인
    const kakaoJsKey = import.meta.env.VITE_KAKAO_JS_KEY || '';
    if (!kakaoJsKey || !window.Kakao || !window.Kakao.isInitialized()) {
      console.log('[PhoneLogin] Kakao SDK not available, using test account');
      try {
        // 테스트 계정으로 로그인 (김철수, 010-1234-1234)
        const testPhone = '01012341234';
        const testCi = 'test-kakao-ci-1234567890';
        
        const loginResult = await api.loginByPhone(testPhone, testCi);
        
        if (loginResult.employee) {
          const employee = loginResult.employee;
          const companyName = employee.company?.name || '';
          const contractStatus = (employee as any).contractStatus || 'PENDING';

          // localStorage 저장은 App.tsx에서 계약서 서명 완료 시에만 수행
          toast.success('로그인 성공 (테스트 계정)');
          onLoginSuccess(employee.id, employee.name, companyName, contractStatus);
        } else {
          toast.error('등록된 정보가 없습니다. 회사의 초대 링크를 통해 먼저 등록해주세요.');
        }
      } catch (error: any) {
        console.error('[PhoneLogin] Test login failed:', error);
        const errorMessage = error.response?.data?.message || '로그인에 실패했습니다.';
        toast.error(errorMessage);
      } finally {
        setKakaoLoading(false);
      }
      return;
    }

    // 실제 카카오 로그인
    try {
      // 카카오 로그인 실행
      window.Kakao.Auth.login({
        success: async (authObj: any) => {
          try {
            // 카카오 액세스 토큰으로 백엔드 로그인 (회원가입은 근로자 정보 입력 화면에서 처리)
            const loginResult = await api.loginByKakao(authObj.access_token);

            if (loginResult.employee) {
              const employee = loginResult.employee;
              const companyName = employee.company?.name || '';
              const contractStatus = (employee as any).contractStatus || 'PENDING';

              // localStorage 저장은 App.tsx에서 계약서 서명 완료 시에만 수행
              toast.success('로그인 성공');
              onLoginSuccess(employee.id, employee.name, companyName, contractStatus);
            } else {
              toast.error('등록된 정보가 없습니다. 회사의 초대 링크를 통해 먼저 등록해주세요.');
            }
          } catch (error: any) {
            console.error('[PhoneLogin] Kakao login/register failed:', error);
            const errorMessage = error.response?.data?.message || '카카오 로그인에 실패했습니다.';
            toast.error(errorMessage);
          } finally {
            setKakaoLoading(false);
          }
        },
        fail: (err: any) => {
          console.error('[PhoneLogin] Kakao Auth.login failed:', err);
          toast.error('카카오 로그인에 실패했습니다.');
          setKakaoLoading(false);
        },
      });
    } catch (error: any) {
      console.error('[PhoneLogin] Kakao login error:', error);
      toast.error('카카오 로그인 중 오류가 발생했습니다.');
      setKakaoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 로고 영역 */}
      <div className="pt-20 pb-8 px-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-11 h-11 bg-[#2E6B4E] rounded-xl flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[#2E6B4E]">장애인 근로관리</h2>
            <p className="text-[11px] text-slate-400">근로자용 모바일 앱</p>
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-slate-900 mb-2 tracking-tight">
            안녕하세요
          </h1>
          <p className="text-[15px] text-slate-500 leading-relaxed">
            카카오 계정으로 로그인하세요.
          </p>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-6">
        {/* 카카오 로그인 버튼 */}
        <Button
          type="button"
          onClick={handleKakaoLogin}
          disabled={kakaoLoading}
          className="w-full h-14 text-[15px] font-semibold bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {kakaoLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              로그인 중...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.477 0 0 3.582 0 8c0 2.797 1.797 5.27 4.5 6.75L3.5 20l5.5-3.045c.5.055 1.01.083 1.5.083 5.523 0 10-3.582 10-8S15.523 0 10 0z" fill="#000000"/>
              </svg>
              카카오로 로그인
            </>
          )}
        </Button>

        {/* 하단 안내 */}
        <div className="mt-12 py-6 border-t border-slate-100">
          <p className="text-[13px] text-center text-slate-400 leading-relaxed">
            카카오톡으로 받은 계약서 링크로도<br />
            자동 로그인이 가능합니다.
          </p>
          <p className="text-[12px] text-center text-slate-400 mt-3 leading-relaxed">
            회사 초대 링크를 통해 먼저 등록해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
