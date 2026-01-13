import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FileText, User, Phone, LogOut, ChevronRight, Settings } from 'lucide-react';
import { api, Employee } from '@shared/api';
import { toast } from 'sonner';

interface MyPageProps {
  employeeId: string;
  employeeName: string;
  onLogout?: () => void;
}

export function MyPage({ employeeId, employeeName, onLogout }: MyPageProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const hasLoadedRef = useRef(false);
  const currentEmployeeIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isAborted = false;

    const loadEmployee = async () => {
      if (!employeeId) return;

      if (currentEmployeeIdRef.current !== employeeId) {
        hasLoadedRef.current = false;
        currentEmployeeIdRef.current = employeeId;
        setContracts([]);
      }

      if (hasLoadedRef.current) return;

      hasLoadedRef.current = true;
      setLoading(true);
      try {
        const employeeContracts = await api.getContractsByEmployee(employeeId);
        if (isMounted && !isAborted) {
          setContracts(employeeContracts);
        }
      } catch (error: any) {
        console.error('[MyPage] Failed to load employee:', error);
        if (isMounted && !isAborted) {
          // 404 에러인 경우 (테스트 employeeId 등): 조용히 처리
          if (error.response?.status === 404) {
            console.log('[MyPage] Employee not found in DB (test ID?), using empty contracts');
            setContracts([]);
          } else {
            toast.error('정보를 불러오는데 실패했습니다.');
            hasLoadedRef.current = false;
          }
        }
      } finally {
        if (isMounted && !isAborted) {
          setLoading(false);
        }
      }
    };

    loadEmployee();

    return () => {
      isMounted = false;
      isAborted = true;
    };
  }, [employeeId]);

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setShowContractDialog(true);
  };

  const handleCallManager = () => {
    const companyPhone = '032-4567-8901';
    window.location.href = `tel:${companyPhone}`;
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employeeId');
      localStorage.removeItem('employeeName');
      if (onLogout) {
        onLogout();
      }
      window.location.href = '/';
    }
  };

  const completedContract = contracts.find(c => c.status === 'COMPLETED');

  const MenuItem = ({ icon: Icon, label, onClick, danger = false, disabled = false }: {
    icon: any;
    label: string;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
        danger
          ? 'hover:bg-red-50 text-red-600'
          : disabled
            ? 'opacity-50 cursor-not-allowed text-slate-400'
            : 'hover:bg-slate-50 text-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          danger ? 'bg-red-50' : 'bg-slate-100'
        }`}>
          <Icon className={`h-5 w-5 ${danger ? 'text-red-500' : 'text-slate-600'}`} />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-2 text-emerald-100 mb-1">
          <Settings className="h-4 w-4" />
          <span className="text-sm">내 정보</span>
        </div>
        <h1 className="text-2xl font-bold text-white">{employeeName}</h1>
      </div>

      {/* 프로필 카드 */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/30">
              {employeeName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">{employeeName}</h2>
              <p className="text-sm text-slate-500">근로자</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <div className="px-5 mt-4 space-y-3">
        {/* 근로계약서 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
            <DialogTrigger asChild>
              <div>
                <MenuItem
                  icon={FileText}
                  label="근로계약서 확인"
                  onClick={() => {
                    if (completedContract) {
                      setSelectedContract(completedContract);
                    }
                  }}
                  disabled={!completedContract}
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>근로계약서</DialogTitle>
                <DialogDescription>서명 완료된 계약서를 확인할 수 있습니다.</DialogDescription>
              </DialogHeader>
              {selectedContract ? (
                <div className="mt-4">
                  {selectedContract.pdfUrl ? (
                    <iframe
                      src={selectedContract.pdfUrl}
                      className="w-full h-[600px] border border-slate-200 rounded-xl"
                      title="근로계약서"
                    />
                  ) : selectedContract.signatureUrl ? (
                    <img
                      src={selectedContract.signatureUrl}
                      alt="근로계약서"
                      className="w-full h-auto border border-slate-200 rounded-xl"
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      계약서가 아직 준비되지 않았습니다.
                    </div>
                  )}
                </div>
              ) : completedContract ? (
                <div className="mt-4">
                  {completedContract.pdfUrl ? (
                    <iframe
                      src={completedContract.pdfUrl}
                      className="w-full h-[600px] border border-slate-200 rounded-xl"
                      title="근로계약서"
                    />
                  ) : completedContract.signatureUrl ? (
                    <img
                      src={completedContract.signatureUrl}
                      alt="근로계약서"
                      className="w-full h-auto border border-slate-200 rounded-xl"
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      계약서가 아직 준비되지 않았습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  서명 완료된 계약서가 없습니다.
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* 내 정보 & 관리자 연결 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
          <MenuItem icon={User} label="내 정보" />
          <MenuItem icon={Phone} label="관리자 전화 연결" onClick={handleCallManager} />
        </div>

        {/* 로그아웃 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <MenuItem icon={LogOut} label="로그아웃" onClick={handleLogout} danger />
        </div>
      </div>
    </div>
  );
}
