import React, { useState, useEffect } from 'react';
import { EmployeeRegistration } from "./components/EmployeeRegistration";
import { EmployeeContractApp } from "./components/EmployeeContractApp";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { WorkTimeTracker } from "./components/WorkTimeTracker";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { toast } from 'sonner';
import { api } from '@shared/api';

export default function App() {
  const [inviteCompanyId, setInviteCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showEmployeeContract, setShowEmployeeContract] = useState(false);
  const [showWorkTracker, setShowWorkTracker] = useState(false);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

  useEffect(() => {
    console.log('[Mobile App] Full URL:', window.location.href);
    console.log('[Mobile App] URL search:', window.location.search);
    console.log('[Mobile App] URL hash:', window.location.hash);

    // Try query params first
    let params = new URLSearchParams(window.location.search);
    let invite = params.get('invite');

    // If not found in query params, try hash
    if (!invite && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      invite = hashParams.get('invite');
      console.log('[Mobile App] Hash params:', Object.fromEntries(hashParams.entries()));
    }

    // If still not found, try localStorage (saved by index.html)
    if (!invite) {
      const pendingInvite = localStorage.getItem('pendingInvite');
      if (pendingInvite) {
        console.log('[Mobile App] Found invite in localStorage:', pendingInvite);
        invite = pendingInvite;
        // Clear it after using
        localStorage.removeItem('pendingInvite');
      }
    }

    console.log('[Mobile App] All URL params:', Object.fromEntries(params.entries()));
    console.log('[Mobile App] Invite link detected:', invite);

    if (invite) {
      setInviteCompanyId(invite);
      loadCompanyName(invite);
    } else {
      console.log('[Mobile App] No invite parameter found in URL, hash, or localStorage');
    }
  }, []);

  const loadCompanyName = async (companyId: string) => {
    setLoading(true);
    setLoadError(false);
    try {
      console.log('[Mobile App] Loading company:', companyId);
      const company = await api.getCompany(companyId);
      console.log('[Mobile App] Company loaded:', company);
      setCompanyName(company.name);
    } catch (error) {
      console.error('[Mobile App] Failed to load company:', error);
      setLoadError(true);
      toast.error('회사 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEmployee = async (data: {
    name: string;
    phone: string;
    dob: string;
    disabilityLevel: '중증' | '경증';
    disabilityType: string;
    disabilityRecognitionDate: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    documentUrl?: string;
    sensitiveInfoConsent: boolean;
  }) => {
    if (!inviteCompanyId) return;

    try {
      await api.createEmployee(inviteCompanyId, data);
      setCurrentEmployeeName(data.name);
      toast.success('직원 등록이 완료되었습니다!');
      // Show PWA prompt before contract (will auto-skip if not applicable)
      setShowPWAPrompt(true);
    } catch (error: any) {
      console.error('Failed to register employee:', error);
      toast.error(error.response?.data?.message || '직원 등록에 실패했습니다.');
    }
  };

  const handlePWAPromptClose = () => {
    setShowPWAPrompt(false);
    // After PWA prompt, show contract app
    setShowEmployeeContract(true);
  };

  // 1. Work Tracker (Priority 1 - after contract)
  if (showWorkTracker) {
    return (
      <>
        <WorkTimeTracker employeeName={currentEmployeeName} />
        <Toaster />
      </>
    );
  }

  // 2. Employee Contract App Flow (Priority 2)
  if (showEmployeeContract) {
    return (
      <>
        <EmployeeContractApp
          employeeName={currentEmployeeName}
          onWorkStart={() => {
            setShowEmployeeContract(false);
            setShowWorkTracker(true);
          }}
          onClose={() => {
            setShowEmployeeContract(false);
            setInviteCompanyId(null);
            setCurrentEmployeeName("");
          }}
        />
        <Toaster />
      </>
    );
  }

  // 3. Invite/Registration View (Priority 3)
  if (inviteCompanyId) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="text-slate-500">회사 정보를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    if (loadError || !companyName) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {loadError ? '회사 정보를 불러올 수 없습니다' : '유효하지 않은 링크'}
            </h1>
            <p className="text-slate-500 mb-4">
              {loadError
                ? '백엔드 서버가 실행 중인지 확인해주세요.'
                : '올바른 초대 링크인지 확인해주세요.'}
            </p>
            <Button className="mt-4" onClick={() => {
              setInviteCompanyId(null);
              setLoadError(false);
            }}>
              홈으로 이동
            </Button>
            {loadError && (
              <Button
                variant="outline"
                className="mt-2 ml-2"
                onClick={() => loadCompanyName(inviteCompanyId)}
              >
                다시 시도
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <EmployeeRegistration
          companyName={companyName}
          onSubmit={handleRegisterEmployee}
          onHome={() => setShowEmployeeContract(true)}
        />
        {showPWAPrompt && <PWAInstallPrompt onClose={handlePWAPromptClose} />}
        <Toaster />
      </>
    );
  }

  // 4. Landing Page (when no invite link)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">근로자 계약 관리</h1>
        <p className="text-slate-500">
          초대 링크를 통해 접속해주세요.
        </p>
      </div>
    </div>
  );
}

