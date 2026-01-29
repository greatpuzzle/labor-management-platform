import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FileText, User, Phone, LogOut, ChevronRight, Settings, AlertTriangle } from 'lucide-react';
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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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
        console.log('[MyPage] Loaded contracts:', employeeContracts);
        console.log('[MyPage] Contracts count:', employeeContracts?.length || 0);
        if (isMounted && !isAborted) {
          setContracts(employeeContracts || []);
        }
      } catch (error: any) {
        console.error('[MyPage] Failed to load contracts:', error);
        console.error('[MyPage] Error response:', error.response?.data);
        if (isMounted && !isAborted) {
          // 401/403 에러는 인증 문제이므로 조용히 처리 (토스트 표시 안 함)
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('[MyPage] Authentication error, setting empty contracts');
            setContracts([]);
          } else if (error.response?.status === 404) {
            setContracts([]);
          } else {
            // 네트워크 에러 등은 조용히 처리
            setContracts([]);
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
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    if (onLogout) {
      onLogout();
    }
    window.location.href = '/';
  };

  const completedContract = contracts.find(c => c.status === 'COMPLETED');
  
  // 디버깅: 계약서 상태 확인
  useEffect(() => {
    console.log('[MyPage] Contracts:', contracts);
    console.log('[MyPage] Completed contract:', completedContract);
    console.log('[MyPage] All contract statuses:', contracts.map(c => ({ id: c.id, status: c.status })));
  }, [contracts, completedContract]);

  const MenuItem = ({ icon: Icon, label, description, onClick, danger = false, disabled = false }: {
    icon: any;
    label: string;
    description?: string;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-4 transition-all active:scale-[0.99] ${
        danger
          ? 'hover:bg-red-50'
          : disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          danger ? 'bg-red-50' : disabled ? 'bg-slate-100' : 'bg-[#2E6B4E]/10'
        }`}>
          <Icon className={`h-5 w-5 ${
            danger ? 'text-red-500' : disabled ? 'text-slate-400' : 'text-[#2E6B4E]'
          }`} />
        </div>
        <div className="text-left">
          <span className={`font-semibold text-[15px] block ${
            danger ? 'text-red-600' : disabled ? 'text-slate-400' : 'text-slate-900'
          }`}>{label}</span>
          {description && (
            <span className="text-[13px] text-slate-500">{description}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-24">
      {/* 헤더 */}
      <div className="bg-[#2E6B4E] px-6 pt-14 pb-24">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4 text-white/70" />
          <span className="text-[13px] text-white/70">내 정보</span>
        </div>
        <h1 className="text-[26px] font-bold text-white tracking-tight">{employeeName}</h1>
      </div>

      {/* 프로필 카드 */}
      <div className="px-5 -mt-12">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#3D8B64] to-[#2E6B4E] flex items-center justify-center text-white text-[24px] font-bold shadow-lg shadow-[#2E6B4E]/20">
              {employeeName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-slate-900">{employeeName}</h2>
              <p className="text-[14px] text-slate-500">근로자</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <div className="px-5 mt-4 space-y-3">
        {/* 근로계약서 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <MenuItem
            icon={FileText}
            label="근로계약서 확인"
            description={completedContract ? "서명 완료" : contracts.length > 0 ? `${contracts.length}개 계약서` : "계약서 없음"}
            onClick={() => {
              console.log('[MyPage] Button clicked, contracts:', contracts);
              console.log('[MyPage] Completed contract:', completedContract);
              
              // COMPLETED 상태의 계약서가 있으면 우선 표시
              if (completedContract) {
                console.log('[MyPage] Showing completed contract:', completedContract);
                setSelectedContract(completedContract);
                setShowContractDialog(true);
              } 
              // COMPLETED가 없어도 다른 계약서가 있으면 최신 계약서 표시
              else if (contracts.length > 0) {
                console.log('[MyPage] Showing latest contract:', contracts[0]);
                setSelectedContract(contracts[0]);
                setShowContractDialog(true);
              } 
              else {
                console.log('[MyPage] No contracts found');
                toast.error('계약서가 없습니다.');
              }
            }}
            disabled={false}
          />
          <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl mx-4 bg-white">
              <DialogHeader>
                <DialogTitle className="text-[18px]">근로계약서</DialogTitle>
                <DialogDescription className="text-[14px]">서명 완료된 계약서를 확인할 수 있습니다.</DialogDescription>
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
          <MenuItem
            icon={User}
            label="내 정보"
            description="개인정보 확인"
          />
          <MenuItem
            icon={Phone}
            label="관리자 전화 연결"
            description="도움이 필요할 때"
            onClick={handleCallManager}
          />
        </div>

        {/* 로그아웃 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <MenuItem
            icon={LogOut}
            label="로그아웃"
            onClick={() => setShowLogoutDialog(true)}
            danger
          />
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="px-5 mt-8 mb-8">
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-slate-700">주식회사 그레이트 퍼즐</p>
          <p className="text-[11px] text-slate-500">대표 신규용 | 사업자 등록번호 506-81-93646</p>
          <p className="text-[11px] text-slate-500">전화번호 : 02-844-1230</p>
          <p className="text-[11px] text-slate-500">E-mail : info@greatpuzzle.org</p>
          <p className="text-[11px] text-slate-500">주소 : 경기도 부천시 소사구 양지로 205, 2동 6층 622호 (옥길동, 서영아너시티2)</p>
        </div>
      </div>

      {/* 로그아웃 확인 다이얼로그 */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="rounded-2xl mx-4 max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-[18px]">로그아웃</DialogTitle>
            <DialogDescription className="text-center text-[14px]">
              정말 로그아웃 하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1 h-12 rounded-xl border border-slate-200 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              취소
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 h-12 rounded-xl bg-red-500 font-semibold text-white transition-colors hover:bg-red-600"
            >
              로그아웃
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
