import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { EmployeeRegistration } from "./components/EmployeeRegistration";
import { EmployeeContractApp } from "./components/EmployeeContractApp";
import { MainHome } from "./components/MainHome";
import { Payroll } from "./components/Payroll";
import { MyPage } from "./components/MyPage";
import { BottomTabBar } from "./components/BottomTabBar";
import { PhoneLogin } from "./components/PhoneLogin";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { toast } from 'sonner';
import { api } from '@shared/api';
import { initializePushNotifications } from './services/pushNotifications';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type Tab = 'home' | 'payroll' | 'mypage';
type AppState = 'splash' | 'registration' | 'contract' | 'contract-install-required' | 'main';

export default function App() {
  // 초기 상태를 완전히 동기적으로 설정하여 깜빡임 방지
  const savedEmployeeId = typeof window !== 'undefined' ? localStorage.getItem('employeeId') : null;
  const savedEmployeeName = typeof window !== 'undefined' ? localStorage.getItem('employeeName') : null;
  const savedCompanyName = typeof window !== 'undefined' ? localStorage.getItem('companyName') : null;
  
  // 초기 상태 결정 (동기적으로)
  const initialAppState: AppState = (savedEmployeeId && savedEmployeeName) ? 'main' : 'splash';
  
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [employeeId, setEmployeeId] = useState<string | null>(savedEmployeeId);
  const [employeeName, setEmployeeName] = useState<string>(savedEmployeeName || '');
  const [companyName, setCompanyName] = useState<string>(savedCompanyName || '');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(false); // 초기에는 항상 false
  
  // 초기화 완료 여부를 추적하는 ref (무한 루프 방지)
  const hasInitializedRef = useRef(false);

  // 초대/계약서 관련 상태
  const [inviteCompanyId, setInviteCompanyId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [contractLoading, setContractLoading] = useState(false);

  // 디버깅 로그 제거 - 불필요한 재렌더링 방지

  // 회사 정보 로드 및 등록 화면 표시 (useEffect 앞에 정의)
  const loadCompanyAndShow = useCallback(async (companyId: string) => {
    console.log('[App] Loading company:', companyId);
    // 초기화가 완료된 후에는 loading 상태를 변경하지 않음 (무한 루프 방지)
    if (!hasInitializedRef.current) {
    setLoading(true);
    }
    try {
      const company = await api.getCompany(companyId);
      console.log('[App] Company loaded:', company);
      
      if (company) {
        setCompanyName(company.name);
        setInviteCompanyId(companyId);
        setAppState('registration');
        console.log('[App] Company loaded, showing registration screen');
      } else {
        console.error('[App] Company not found:', companyId);
        toast.error('유효하지 않은 초대 링크입니다.');
        setAppState('splash');
      }
    } catch (error: any) {
      console.error('[App] Failed to load company:', error);
      const errorMessage = error.response?.data?.message || error.message || '회사 정보를 불러올 수 없습니다.';
      console.error('[App] Error details:', error.response?.data);
      toast.error(errorMessage);
      setAppState('splash');
    } finally {
      if (!hasInitializedRef.current) {
      setLoading(false);
      }
    }
  }, []);

  // 계약서 로드 및 표시 (웹/앱 구분) - useCallback으로 감싸서 안정적인 참조 유지
  // loadContractInWebView를 내부에 정의하여 순환 참조 방지
  const loadContractAndShow = useCallback(async (contractId: string) => {
    // 웹뷰에서 계약서 로드하는 내부 함수 (순환 참조 방지)
  const loadContractInWebView = async (contractId: string) => {
    console.log('[App] Loading contract in webview:', contractId);
    setContractLoading(true);
    try {
      const contractData = await api.getContract(contractId);
      if (contractData && contractData.employee) {
        setContract(contractData);
        setEmployeeId(contractData.employee.id);
        setEmployeeName(contractData.employee.name);
        setCompanyName(contractData.employee.company?.name || '');
        
        // localStorage에 저장 (앱 재시작 시 사용)
        localStorage.setItem('employeeId', contractData.employee.id);
        localStorage.setItem('employeeName', contractData.employee.name);
        localStorage.setItem('companyName', contractData.employee.company?.name || '');
        
        // 웹뷰에서도 계약서 서명 화면 표시
        setAppState('contract');
      } else {
        toast.error('계약서 정보를 불러올 수 없습니다.');
      }
    } catch (error: any) {
      console.error('[App] Failed to load contract:', error);
      toast.error(error.response?.data?.message || '계약서를 불러올 수 없습니다.');
    } finally {
      setContractLoading(false);
    }
  };

    // 웹/앱 구분 먼저 확인
    const isNativeApp = Capacitor.isNativePlatform();
    
    // Capacitor 객체 존재 여부 확인 (더 강력한 감지)
    const hasCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
    
    // PWA standalone 모드 감지 (PWA로 설치된 경우)
    const isStandalone = 
      ('standalone' in window.navigator && (window.navigator as any).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches;
    
    // 앱이 설치되어 있는지 확인 (Capacitor 네이티브 앱 또는 PWA)
    const isInstalledApp = isNativeApp || hasCapacitor || isStandalone;
    
    console.log('[App] Contract link accessed - Is native app:', isNativeApp);
    console.log('[App] Has Capacitor object:', hasCapacitor);
    console.log('[App] Is standalone (PWA):', isStandalone);
    console.log('[App] Is installed app:', isInstalledApp);
    console.log('[App] User agent:', navigator.userAgent);
    
    if (!isInstalledApp) {
      // 웹 브라우저에서 접속: 개발 모드 또는 카카오톡 웹뷰에서는 계약서 서명 가능
      const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.');
      
      // 카카오톡 웹뷰 감지
      const isKakaoTalk = /KAKAOTALK/i.test(navigator.userAgent);
      const isInAppBrowser = isKakaoTalk || /Line/i.test(navigator.userAgent) || /NAVER/i.test(navigator.userAgent);
      
      console.log('[App] Is KakaoTalk:', isKakaoTalk);
      console.log('[App] Is in-app browser:', isInAppBrowser);
      
      // 카카오톡 웹뷰에서 앱으로 연결 시도
      if (isKakaoTalk) {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        
        // 환경 변수에서 앱스토어 링크 확인
        const androidStoreUrl = import.meta.env.VITE_ANDROID_PLAY_STORE_URL;
        const iosStoreUrl = import.meta.env.VITE_IOS_APP_STORE_URL;
        
        // 앱 deep link URL 생성 (앱스토어 링크가 없어도 시도)
        let appDeepLink = null;
        
        if (isAndroid) {
          // Android Intent URL
          if (androidStoreUrl) {
            // 앱스토어 링크가 있으면 fallback URL 포함
            appDeepLink = `intent://contract/${contractId}#Intent;scheme=labor;package=com.ecospott.labor;S.browser_fallback_url=${encodeURIComponent(androidStoreUrl)};end`;
          } else {
            // 앱스토어 링크가 없으면 앱만 시도 (실패하면 웹뷰에서 계속)
            appDeepLink = `intent://contract/${contractId}#Intent;scheme=labor;package=com.ecospott.labor;end`;
          }
        } else if (isIOS) {
          // iOS custom scheme
          appDeepLink = `labor://contract/${contractId}`;
        }
        
        if (appDeepLink) {
          console.log('[App] Attempting to open app with deep link:', appDeepLink);
          
          // 앱으로 연결 시도
          // 앱이 설치되어 있으면 앱이 열리고, 없으면 웹뷰에서 계속 진행
          const tryOpenApp = () => {
            window.location.href = appDeepLink!;
            
            // 일정 시간 후에도 페이지가 그대로 있으면 앱이 설치되지 않은 것으로 간주
            // 웹뷰에서 계약서 서명 가능하도록 계속 진행
            setTimeout(async () => {
              console.log('[App] App not installed or failed to open, continuing in webview');
              await loadContractInWebView(contractId);
            }, 1500);
          };
          
          tryOpenApp();
          return; // 앱 연결 시도 후 리턴
        }
      }
      
      // 개발 모드이거나 카카오톡/인앱 브라우저에서는 웹에서도 계약서 서명 가능
      if (!isDevelopment && !isInAppBrowser) {
        // 프로덕션 환경: 스토어로 리다이렉트
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        
        // 환경 변수에서 스토어 링크 가져오기
        const androidStoreUrl = import.meta.env.VITE_ANDROID_PLAY_STORE_URL;
        const iosStoreUrl = import.meta.env.VITE_IOS_APP_STORE_URL;
        
        let storeUrl = null;
        if (isAndroid && androidStoreUrl) {
          storeUrl = androidStoreUrl;
        } else if (isIOS && iosStoreUrl) {
          storeUrl = iosStoreUrl;
        }
        
        // 스토어로 리다이렉트 (앱 설치 후 계약서 링크로 돌아올 수 있도록 contractId를 localStorage에 저장)
        localStorage.setItem('pendingContractId', contractId);
        
        if (storeUrl) {
          // 실제 스토어 링크가 설정된 경우
          console.log('[App] Redirecting to app store:', storeUrl);
          window.location.href = storeUrl;
          return;
        } else {
          // 스토어 링크가 설정되지 않은 경우 - 계약서 정보를 로드해서 안내 메시지 표시
          console.log('[App] App store link not configured, loading contract info for display');
          setContractLoading(true);
          try {
            const contractData = await api.getContract(contractId);
            if (contractData && contractData.employee) {
              setContract(contractData);
              setEmployeeId(contractData.employee.id);
              setEmployeeName(contractData.employee.name);
              setCompanyName(contractData.employee.company?.name || '');
              setAppState('contract-install-required');
              return;
            } else {
              toast.error('계약서 정보를 불러올 수 없습니다.');
              setAppState('splash');
              return;
            }
          } catch (error: any) {
            console.error('[App] Failed to load contract:', error);
            toast.error(error.response?.data?.message || '계약서를 불러올 수 없습니다.');
            setAppState('splash');
            return;
          } finally {
            setContractLoading(false);
          }
        }
      } else {
        // 개발 환경: 웹에서도 계약서 서명 가능 (테스트용)
        console.log('[App] Development mode: Loading contract for web testing');
        setContractLoading(true);
        try {
          const contractData = await api.getContract(contractId);
          if (contractData && contractData.employee) {
            setContract(contractData);
            setEmployeeId(contractData.employee.id);
            setEmployeeName(contractData.employee.name);
            setCompanyName(contractData.employee.company?.name || '');
            
            // localStorage에 저장 (앱 재시작 시 사용)
            localStorage.setItem('employeeId', contractData.employee.id);
            localStorage.setItem('employeeName', contractData.employee.name);
            localStorage.setItem('companyName', contractData.employee.company?.name || '');
            
            // 개발 모드에서는 웹에서도 계약서 서명 화면 표시
            setAppState('contract');
          } else {
            toast.error('계약서 정보를 불러올 수 없습니다.');
          }
        } catch (error: any) {
          console.error('[App] Failed to load contract:', error);
          toast.error(error.response?.data?.message || '계약서를 불러올 수 없습니다.');
        } finally {
          setContractLoading(false);
        }
        return;
      }
    }
    
    // 앱에서 접속: 계약서 정보 로드 후 서명 화면 표시
    setContractLoading(true);
    try {
      const contractData = await api.getContract(contractId);
      if (contractData && contractData.employee) {
        setContract(contractData);
        setEmployeeId(contractData.employee.id);
        setEmployeeName(contractData.employee.name);
        setCompanyName(contractData.employee.company?.name || '');
        
        // localStorage에 저장 (앱 재시작 시 사용)
        localStorage.setItem('employeeId', contractData.employee.id);
        localStorage.setItem('employeeName', contractData.employee.name);
        localStorage.setItem('companyName', contractData.employee.company?.name || '');
        
        // 앱에서 계약서 서명 화면 표시
        setAppState('contract');
      } else {
        toast.error('계약서 정보를 불러올 수 없습니다.');
      }
    } catch (error: any) {
      console.error('[App] Failed to load contract:', error);
      toast.error(error.response?.data?.message || '계약서를 불러올 수 없습니다.');
    } finally {
      setContractLoading(false);
    }
  }, []); // 빈 의존성 배열: 내부 함수는 클로저로 캡처되므로 안정적

  // Deep Link 처리 (앱이 deep link로 열렸을 때)
  // loadContractAndShow를 의존성 배열에서 제거하고 함수 내부에서 직접 호출
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      console.log('[App] Setting up deep link listener');
      
      // 앱이 deep link로 열렸을 때 처리
      const listener = App.addListener('appUrlOpen', (event) => {
        console.log('[App] App opened with URL:', event.url);
        
        // labor://contract/contractId 형식 파싱
        const contractMatch = event.url.match(/labor:\/\/contract\/(.+)/);
        if (contractMatch) {
          const contractId = contractMatch[1];
          console.log('[App] Deep link contract ID:', contractId);
          // 함수가 정의되어 있는지 확인 후 호출
          if (typeof loadContractAndShow === 'function') {
            loadContractAndShow(contractId);
          }
          return;
        }
        
        // intent:// 형식 파싱 (Android)
        const intentMatch = event.url.match(/intent:\/\/contract\/(.+?)#/);
        if (intentMatch) {
          const contractId = intentMatch[1];
          console.log('[App] Intent deep link contract ID:', contractId);
          // 함수가 정의되어 있는지 확인 후 호출
          if (typeof loadContractAndShow === 'function') {
            loadContractAndShow(contractId);
          }
          return;
        }
      });
      
      // 컴포넌트 언마운트 시 리스너 제거
      return () => {
        console.log('[App] Removing deep link listener');
        listener.then(l => l.remove());
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 의존성 배열: 함수는 useCallback으로 안정적 참조 유지

  // Splash & Auto Login: URL 파라미터만 확인 (localStorage는 이미 초기 상태에서 처리됨)
  useEffect(() => {
    // 이미 초기화가 완료되었으면 체크하지 않음 (무한 루프 방지)
    if (hasInitializedRef.current) {
      return;
    }

    // 초기화 시작 플래그 설정 (중복 실행 방지)
    hasInitializedRef.current = true;

    const checkUserState = async () => {
      try {
        // URL 파라미터만 확인 (localStorage는 이미 초기 상태에서 처리됨)
        
        // 1. 계약서 링크 확인 (/contract/:contractId)
        const pathMatch = window.location.pathname.match(/^\/contract\/(.+)$/);
        if (pathMatch) {
          const contractIdFromPath = pathMatch[1];
          
          // 이미 로그인된 근로자이고 계약서가 완료된 상태인지 확인
          if (employeeId) {
            try {
              const employee = await api.getEmployee(employeeId);
              if (employee.contractStatus === 'COMPLETED') {
                // 이미 계약서 서명 완료된 경우, URL만 변경하고 메인 화면 유지
                window.history.replaceState({}, '', '/');
                return;
              }
            } catch (error) {
              // 에러 발생 시 계속 진행 (계약서 로드 시도)
            }
          }
          
          // 계약서 로드
          setContractId(contractIdFromPath);
          await loadContractAndShow(contractIdFromPath);
          return;
        }

        // 2. 초대 링크 확인 (?invite=companyId 또는 #invite=companyId)
        let invite: string | null = null;
        const params = new URLSearchParams(window.location.search);
        invite = params.get('invite');
        
        if (!invite && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          invite = hashParams.get('invite');
        }
        
        if (!invite) {
          const pendingInvite = localStorage.getItem('pendingInvite');
          if (pendingInvite) {
            invite = pendingInvite;
            localStorage.removeItem('pendingInvite');
          }
        }

        if (invite) {
          setInviteCompanyId(invite);
          await loadCompanyAndShow(invite);
          return;
        }

        // 3. 앱 설치 후 계약서 링크로 돌아온 경우 확인
        const pendingContractId = localStorage.getItem('pendingContractId');
        if (pendingContractId) {
          localStorage.removeItem('pendingContractId');
          await loadContractAndShow(pendingContractId);
          return;
        }
        
        // 4. 이미 초기 상태에서 설정된 경우, 계약서 서명 여부만 확인 (비동기로 처리하여 리렌더링 방지)
        if (employeeId && employeeName && appState === 'main') {
          // 비동기로 처리하여 즉시 리렌더링 방지
          Promise.resolve().then(async () => {
            try {
              const employee = await api.getEmployee(employeeId);
              if (employee.contractStatus !== 'COMPLETED') {
                // 계약서 서명 미완료 -> 계약서 화면으로 변경
                const contracts = await api.getContractsByEmployee(employeeId);
                const sentContract = contracts.find((c: any) => c.status === 'SENT');
                if (sentContract) {
                  // 상태를 한 번에 배치 업데이트
                  setContractId(sentContract.id);
                  setContract(sentContract);
                  setAppState('contract');
                }
              } else {
                // Push Notifications 초기화 (계약 완료된 근로자만)
                try {
                  await initializePushNotifications(employeeId);
                } catch (error) {
                  console.error('[App] Failed to initialize push notifications:', error);
                }
              }
            } catch (error: any) {
              // 404 에러인 경우 (테스트 employeeId 등): 무시
              if (error.response?.status !== 404) {
                console.error('[App] Failed to check employee state:', error);
              }
            }
          });
        }
      } catch (error: any) {
        console.error('[App] Failed to check user state:', error);
      }
    };

    checkUserState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 의존성 배열: 컴포넌트 마운트 시 한 번만 실행

  // 근로자 등록 완료 (웹에서만 실행, 앱으로 이동하지 않음)
  const handleEmployeeRegistered = async (employeeData: any) => {
    try {
      const newEmployee = await api.createEmployee(inviteCompanyId!, {
        name: employeeData.name,
        phone: employeeData.phone,
        dob: employeeData.dob,
        disabilityLevel: employeeData.disabilityLevel,
        disabilityType: employeeData.disabilityType,
        disabilityRecognitionDate: employeeData.disabilityRecognitionDate,
        emergencyContactName: employeeData.emergencyContactName,
        emergencyContactPhone: employeeData.emergencyContactPhone,
        sensitiveInfoConsent: employeeData.sensitiveInfoConsent,
      });
      
      console.log('[App] Employee registered successfully:', newEmployee.id);
      
      // localStorage에만 저장 (웹에서 등록 정보 저장)
      // 주의: 웹에서는 앱으로 이동하지 않음, 완료 화면만 표시
      localStorage.setItem('employeeId', newEmployee.id);
      localStorage.setItem('employeeName', newEmployee.name);
      localStorage.setItem('companyName', companyName);
      
      // EmployeeRegistration 컴포넌트에서 완료 화면(step='complete')을 표시하도록 함
      // 앱으로 이동하지 않음 - 계약서 발송 대기 중이라는 메시지만 표시
      
      toast.success('등록이 완료되었습니다. 계약서 발송을 기다려주세요.');
    } catch (error: any) {
      console.error('[App] Failed to register employee:', error);
      toast.error(error.response?.data?.message || '등록에 실패했습니다.');
    }
  };

  // 계약서 서명 완료
  const handleContractSigned = useCallback(async () => {
    // localStorage에서 employeeId와 employeeName을 가져와서 상태를 확실히 보장
    const savedEmployeeId = localStorage.getItem('employeeId') || employeeId;
    const savedEmployeeName = localStorage.getItem('employeeName') || employeeName;
    const savedCompanyName = localStorage.getItem('companyName') || companyName;
    
    if (!savedEmployeeId) {
      console.error('[App] handleContractSigned: employeeId가 없습니다.');
      return;
    }

    console.log('[App] handleContractSigned called');

    // localStorage 업데이트 (이미 설정되어 있어도 다시 설정)
    localStorage.setItem('employeeId', savedEmployeeId);
    localStorage.setItem('employeeName', savedEmployeeName);
    localStorage.setItem('companyName', savedCompanyName);
    
    // 상태를 먼저 설정하여 깜빡임 방지 (employeeId, employeeName이 먼저 설정되도록)
    setEmployeeId(savedEmployeeId);
    setEmployeeName(savedEmployeeName);
    setCompanyName(savedCompanyName);
    
    // 그 다음 contract와 appState 업데이트
    setContractId(null);
    setContract(null);
    setAppState('main');
    setActiveTab('home');
    
    // Push Notifications 초기화 (계약 완료된 근로자만)
    // 비동기 작업은 상태 업데이트 이후에 수행
    try {
      await initializePushNotifications(savedEmployeeId);
    } catch (error) {
      console.error('[App] Failed to initialize push notifications:', error);
    }
    
    toast.success('계약서 서명이 완료되었습니다.');
  }, [employeeId, employeeName, companyName]);

  // 로그아웃
  const handleLogout = useCallback(() => {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('companyName');
    setEmployeeId(null);
    setEmployeeName('');
    setCompanyName('');
    setAppState('splash');
    hasInitializedRef.current = false; // 초기화 상태 리셋
  }, []);

  // 핸드폰 인증 로그인 성공 처리 (useCallback으로 안정적인 참조 유지)
  const handlePhoneLoginSuccess = useCallback((newEmployeeId: string, newEmployeeName: string, newCompanyName: string) => {
    console.log('[App] Phone login success, setting state:', { newEmployeeId, newEmployeeName, newCompanyName });

    // 상태 업데이트 전에 초기화 플래그 먼저 설정 (재진입 방지)
    hasInitializedRef.current = true;

    // React 18 automatic batching으로 모든 상태가 한 번에 업데이트됨
    // 순서: loading 먼저 false → 그 다음 나머지 상태들
    setLoading(false);
    setEmployeeId(newEmployeeId);
    setEmployeeName(newEmployeeName);
    setCompanyName(newCompanyName);
    setAppState('main');
  }, []);

  // 조건부 렌더링을 단순화하여 깜빡임 방지
  // appState를 기준으로 명확하게 분기 처리
  
  // 1. 계약서 서명 화면 (최우선)
  if (appState === 'contract' && contract && employeeId) {
    return (
      <>
        <EmployeeContractApp
          contract={contract}
          employeeName={employeeName}
          onClose={() => {
            setContract(null);
            setContractId(null);
            setAppState('main');
          }}
          onWorkStart={handleContractSigned}
        />
        <Toaster />
      </>
    );
  }

  // 2. 계약서 설치 필요 화면
  if (appState === 'contract-install-required' && contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">앱 설치 필요</h1>
            <p className="text-slate-600">
              계약서 서명을 위해서는 앱을 설치해야 합니다.
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>앱 설치 링크가 설정되지 않았습니다.</strong><br />
              관리자에게 문의하여 앱 설치 링크를 받아주세요.
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">계약서 정보:</p>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
              <p><strong>회사:</strong> {companyName}</p>
              <p><strong>근로자:</strong> {employeeName}</p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              if (employeeId && employeeName) {
                setAppState('main');
              } else {
                setAppState('splash');
              }
            }}
            className="w-full"
            variant="outline"
          >
            홈으로 이동
          </Button>
        </div>
        <Toaster />
      </div>
    );
  }

  // 3. 근로자 등록 화면
  if (appState === 'registration' && inviteCompanyId) {
    return (
      <>
        <EmployeeRegistration
          companyName={companyName}
          onSubmit={handleEmployeeRegistered}
          onHome={() => setAppState('splash')}
        />
        <Toaster />
      </>
    );
  }

  // 4. 계약서 로딩 중
  if (contractLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-500">계약서 불러오는 중...</p>
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  // 5. 메인 화면 (appState가 'main'이고 필요한 정보가 모두 있을 때)
  if (appState === 'main' && employeeId && employeeName) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 pb-20">
          <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
            <MainHome
              employeeId={employeeId}
              employeeName={employeeName}
              companyName={companyName}
            />
          </div>
          <div style={{ display: activeTab === 'payroll' ? 'block' : 'none' }}>
            <Payroll
              employeeId={employeeId}
              employeeName={employeeName}
            />
          </div>
          <div style={{ display: activeTab === 'mypage' ? 'block' : 'none' }}>
            <MyPage
              employeeId={employeeId}
              employeeName={employeeName}
              onLogout={handleLogout}
            />
          </div>
        </div>
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <Toaster />
      </>
    );
  }

  // 6. 로딩 화면 (loading이 true일 때만)
  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-500">로딩 중...</p>
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  // 7. Splash 화면 (기본값)
  return (
    <>
      <PhoneLogin onLoginSuccess={handlePhoneLoginSuccess} />
      <Toaster />
    </>
  );
}
