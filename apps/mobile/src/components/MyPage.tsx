import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FileText, User, Phone, LogOut } from 'lucide-react';
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

  // 근로자 정보 로드
  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return;

      setLoading(true);
      try {
        // 근로자 정보는 App.tsx에서 가져오거나 별도 API 필요
        // 일단 기본 정보만 표시
        const employeeContracts = await api.getContractsByEmployee(employeeId);
        setContracts(employeeContracts);
      } catch (error: any) {
        console.error('[MyPage] Failed to load employee:', error);
        toast.error('정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [employeeId]);

  // 계약서 확인
  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setShowContractDialog(true);
  };

  // 관리자 전화 연결
  const handleCallManager = () => {
    // 회사 전화번호 (나중에 동적으로 가져오기)
    const companyPhone = '032-4567-8901';
    window.location.href = `tel:${companyPhone}`;
  };

  // 로그아웃
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 p-4">
      {/* 프로필 카드 */}
      <Card className="w-full p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#00C950] flex items-center justify-center text-white text-2xl font-bold">
            {employeeName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{employeeName}</h2>
            <p className="text-sm text-slate-600">근로자</p>
          </div>
        </div>
      </Card>

      {/* 근로계약서 확인 */}
      <Card className="w-full p-4 mb-4">
        <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
          <DialogTrigger asChild>
            <button 
              onClick={() => {
                if (completedContract) {
                  setSelectedContract(completedContract);
                }
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors"
              disabled={!completedContract}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-900">근로계약서 확인</span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>근로계약서</DialogTitle>
              <DialogDescription>서명 완료된 계약서를 확인할 수 있습니다.</DialogDescription>
            </DialogHeader>
            {selectedContract ? (
              <div className="mt-4">
                {selectedContract.pdfUrl ? (
                  <iframe
                    src={selectedContract.pdfUrl}
                    className="w-full h-[600px] border border-slate-200 rounded-lg"
                    title="근로계약서"
                  />
                ) : selectedContract.signatureUrl ? (
                  <img
                    src={selectedContract.signatureUrl}
                    alt="근로계약서"
                    className="w-full h-auto border border-slate-200 rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    계약서가 아직 준비되지 않았습니다.
                  </div>
                )}
              </div>
            ) : completedContract ? (
              <div className="mt-4">
                {completedContract.pdfUrl ? (
                  <iframe
                    src={completedContract.pdfUrl}
                    className="w-full h-[600px] border border-slate-200 rounded-lg"
                    title="근로계약서"
                  />
                ) : completedContract.signatureUrl ? (
                  <img
                    src={completedContract.signatureUrl}
                    alt="근로계약서"
                    className="w-full h-auto border border-slate-200 rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    계약서가 아직 준비되지 않았습니다.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                서명 완료된 계약서가 없습니다.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>

      {/* 내 정보 */}
      <Card className="w-full p-4 mb-4">
        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-slate-900">내 정보</span>
          </div>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </Card>

      {/* 관리자 전화 연결 */}
      <Card className="w-full p-4 mb-4">
        <button
          onClick={handleCallManager}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-slate-900">관리자 전화 연결</span>
          </div>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </Card>

      {/* 로그아웃 */}
      <Card className="w-full p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg transition-colors text-red-600"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">로그아웃</span>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </Card>
    </div>
  );
}

