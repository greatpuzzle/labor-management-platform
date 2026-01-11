import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeRegistration } from "./components/EmployeeRegistration";
import { EmployeeContractApp } from "./components/EmployeeContractApp";
import { MainHome } from "./components/MainHome";
import { Payroll } from "./components/Payroll";
import { MyPage } from "./components/MyPage";
import { BottomTabBar } from "./components/BottomTabBar";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { toast } from 'sonner';
import { api } from '@shared/api';
import { initializePushNotifications } from './services/pushNotifications';
import { Capacitor } from '@capacitor/core';

type Tab = 'home' | 'payroll' | 'mypage';
type AppState = 'splash' | 'registration' | 'contract' | 'contract-install-required' | 'main';

export default function App() {
  // Splash & Auto Login
  const [appState, setAppState] = useState<AppState>('splash');
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);

  // 초대/계약서 관련 상태
  const [inviteCompanyId, setInviteCompanyId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [contractLoading, setContractLoading] = useState(false);


  // Splash & Auto Login: URL 파라미터 먼저 확인, 그 다음 localStorage 확인
  useEffect(() => {
    const checkUserState = async () => {
      try {
        console.log('[App] Checking user state...');
        console.log('[App] Full URL:', window.location.href);
        console.log('[App] Pathname:', window.location.pathname);
        console.log('[App] Search:', window.location.search);
        console.log('[App] Hash:', window.location.hash);

        // 1. 먼저 URL 파라미터 확인 (계약서 링크 또는 초대 링크)
        // 계약서 링크 확인 (/contract/:contractId)
        // 단, 이미 로그인되어 있고 계약서가 완료된 상태인 경우는 무시 (서명 완료 후)
        const pathMatch = window.location.pathname.match(/^\/contract\/(.+)$/);
        if (pathMatch) {
          const contractIdFromPath = pathMatch[1];
          
          // 이미 로그인된 근로자이고 계약서가 완료된 상태인지 확인
          const savedEmployeeId = localStorage.getItem('employeeId');
          if (savedEmployeeId) {
            try {
              const employee = await api.getEmployee(savedEmployeeId);
              if (employee.contractStatus === 'COMPLETED') {
                // 이미 계약서 서명 완료된 경우, URL만 변경하고 메인 화면으로
                console.log('[App] Contract already completed, redirecting to home');
                window.history.replaceState({}, '', '/');
                setEmployeeId(savedEmployeeId);
                setEmployeeName(localStorage.getItem('employeeName') || '');
                setCompanyName(localStorage.getItem('companyName') || '');
                setAppState('main');
                return;
              }
            } catch (error) {
              // 에러 발생 시 계속 진행 (계약서 로드 시도)
              console.error('[App] Failed to check contract status:', error);
            }
          }
          
          console.log('[App] Contract ID from path:', contractIdFromPath);
          setContractId(contractIdFromPath);
          await loadContractAndShow(contractIdFromPath);
          return;
        }

        // 초대 링크 확인 (?invite=companyId 또는 #invite=companyId)
        let invite: string | null = null;
        
        // Query parameter 확인
        const params = new URLSearchParams(window.location.search);
        invite = params.get('invite');
        
        // Hash parameter 확인
        if (!invite && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          invite = hashParams.get('invite');
        }
        
        // localStorage에서 pendingInvite 확인 (index.html에서 저장한 경우)
        if (!invite) {
          const pendingInvite = localStorage.getItem('pendingInvite');
          if (pendingInvite) {
            console.log('[App] Found invite in localStorage:', pendingInvite);
            invite = pendingInvite;
            localStorage.removeItem('pendingInvite');
          }
        }

        if (invite) {
          console.log('[App] Invite link detected:', invite);
          setInviteCompanyId(invite);
          await loadCompanyAndShow(invite);
          return;
        }

        // 2. URL 파라미터가 없으면 localStorage에서 저장된 근로자 정보 확인
        // 앱 설치 후 계약서 링크로 돌아온 경우 확인
        const pendingContractId = localStorage.getItem('pendingContractId');
        if (pendingContractId) {
          localStorage.removeItem('pendingContractId');
          console.log('[App] Found pending contract ID, loading:', pendingContractId);
          await loadContractAndShow(pendingContractId);
          return;
        }
        
        const savedEmployeeId = localStorage.getItem('employeeId');
        const savedEmployeeName = localStorage.getItem('employeeName');
        const savedCompanyName = localStorage.getItem('companyName');

        if (savedEmployeeId && savedEmployeeName) {
          console.log('[App] Found saved employee info, auto-login:', savedEmployeeId);
          // 저장된 정보가 있으면 자동 로그인
          setEmployeeId(savedEmployeeId);
          setEmployeeName(savedEmployeeName);
          setCompanyName(savedCompanyName || '');
          
          // 계약서 서명 여부 확인
          try {
            const employee = await api.getEmployee(savedEmployeeId);
            // employeeName이 설정되지 않은 경우 API에서 가져온 값으로 설정
            if (!savedEmployeeName && employee.name) {
              setEmployeeName(employee.name);
              localStorage.setItem('employeeName', employee.name);
            }
            if (employee.contractStatus === 'COMPLETED') {
              // 계약서 서명 완료 -> 메인 화면
              setAppState('main');
              
              // Push Notifications 초기화 (계약 완료된 근로자만)
              try {
                await initializePushNotifications(savedEmployeeId);
              } catch (error) {
                console.error('[App] Failed to initialize push notifications:', error);
              }
            } else {
              // 계약서 서명 미완료 -> 계약서 화면
              const contracts = await api.getContractsByEmployee(savedEmployeeId);
              const sentContract = contracts.find((c: any) => c.status === 'SENT');
              if (sentContract) {
                setContractId(sentContract.id);
                setContract(sentContract);
                setAppState('contract');
              } else {
                // 계약서 미발송 -> 메인 화면 (대기)
                setAppState('main');
              }
            }
          } catch (error: any) {
            console.error('[App] Failed to check employee state:', error);
            // 에러 발생 시에도 employeeName이 있으면 메인 화면으로
            if (savedEmployeeName) {
              setAppState('main');
            } else {
              // employeeName이 없으면 스플래시 화면으로
              setAppState('splash');
            }
          }
        } else {
          // 저장된 정보도 없고, URL 파라미터도 없으면 초기 화면
          console.log('[App] No saved info and no URL params, showing splash');
          setAppState('splash');
        }
      } catch (error: any) {
        console.error('[App] Failed to check user state:', error);
        setAppState('splash');
      } finally {
        setLoading(false);
      }
    };

    checkUserState();
  }, []);

  // 회사 정보 로드 및 등록 화면 표시
  const loadCompanyAndShow = async (companyId: string) => {
    console.log('[App] Loading company:', companyId);
    setLoading(true);
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
      setLoading(false);
    }
  };

  // 계약서 로드 및 표시 (웹/앱 구분)
  const loadContractAndShow = async (contractId: string) => {
    // 웹/앱 구분 먼저 확인
    const isNativeApp = Capacitor.isNativePlatform();
    console.log('[App] Contract link accessed - Is native app:', isNativeApp);
    
    if (!isNativeApp) {
      // 웹에서 접속: 개발 모드에서는 계약서 서명 가능, 프로덕션에서는 스토어로 리다이렉트
      const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.');
      
      if (!isDevelopment) {
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
  };

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
  const handleLogout = () => {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('companyName');
    setEmployeeId(null);
    setEmployeeName('');
    setCompanyName('');
    setAppState('splash');
  };

  // 로딩 화면
  if (loading || contractLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C950] mx-auto mb-4"></div>
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Splash 화면 (초대 링크나 계약서 링크 없음)
  if (appState === 'splash' && !inviteCompanyId && !contractId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">장애인 근로관리 시스템</h1>
          <p className="text-slate-600 mb-6">
            초대 링크 또는 계약서 링크를 통해 접속해주세요.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            홈으로 이동
          </Button>
        </div>
      </div>
    );
  }

  // 근로자 등록 화면
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

  // 계약서 서명 화면 (앱에서만 표시됨)
  // contract가 null이 아닐 때만 렌더링 (깜빡임 방지)
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

  // 웹에서 계약서 링크 접속 시 앱 설치 안내 화면
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
            onClick={() => setAppState('splash')}
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

  // 메인 화면 (탭바 기반)
  // appState가 'main'이지만 employeeId나 employeeName이 아직 설정되지 않은 경우 로딩 표시
  if (appState === 'main') {
    if (!employeeId || !employeeName) {
      // 상태가 아직 설정되지 않은 경우 로딩 화면 표시
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C950] mx-auto mb-4"></div>
            <p className="text-slate-600">로딩 중...</p>
          </div>
        </div>
      );
    }
    
    return (
      <>
        <div className="min-h-screen bg-slate-50 pb-20">
          {activeTab === 'home' && (
            <MainHome
              employeeId={employeeId}
              employeeName={employeeName}
              companyName={companyName}
            />
          )}
          {activeTab === 'payroll' && (
            <Payroll
              employeeId={employeeId}
              employeeName={employeeName}
            />
          )}
          {activeTab === 'mypage' && (
            <MyPage
              employeeId={employeeId}
              employeeName={employeeName}
              onLogout={handleLogout}
            />
          )}
        </div>
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <Toaster />
      </>
    );
  }

  // 기본 에러 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">오류가 발생했습니다</h1>
        <p className="text-slate-500 mb-4">
          올바른 링크를 통해 접속해주세요.
        </p>
        <Button onClick={() => window.location.href = '/'}>
          홈으로 이동
        </Button>
      </div>
    </div>
  );
}
