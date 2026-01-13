import React, { useState, useEffect, useRef, memo } from 'react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Clock, Play, Square, AlertCircle, CheckCircle2, Briefcase, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { api, WorkRecord, WorkSchedule } from '@shared/api';

interface MainHomeProps {
  employeeId: string;
  employeeName: string;
  companyName: string;
}

type WorkState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

const MainHomeComponent = ({ employeeId, employeeName, companyName }: MainHomeProps) => {
  const [currentWork, setCurrentWork] = useState<WorkRecord | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<WorkSchedule | null>(null);
  const [workState, setWorkState] = useState<WorkState>('NOT_STARTED');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showEndWorkDialog, setShowEndWorkDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueType, setIssueType] = useState<'none' | 'machine' | 'health'>('none');

  // 이전 employeeId를 추적하여 불필요한 재로딩 방지
  const previousEmployeeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      return;
    }

    // employeeId가 변경되지 않았으면 재로딩하지 않음
    if (previousEmployeeIdRef.current === employeeId) {
      return;
    }

    previousEmployeeIdRef.current = employeeId;

    const loadData = async () => {
      try {
        const workRecord = await api.getCurrentWorkRecord(employeeId);
        setCurrentWork(workRecord || null);

        if (workRecord) {
          setWorkState(workRecord.status as WorkState);
          if (workRecord.status === 'IN_PROGRESS' && workRecord.startTime) {
            const start = new Date(workRecord.startTime);
            const now = new Date();
            const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
            setElapsedTime(diff);
          }
        } else {
          setWorkState('NOT_STARTED');
        }

        const schedule = await api.getTodaySchedule(employeeId);
        setTodaySchedule(schedule);
      } catch (error: any) {
        console.error('[MainHome] Failed to load data:', error);
        // 404 에러인 경우 (테스트 employeeId 등): 조용히 처리하고 기본 상태 유지
        if (error.response?.status === 404) {
          console.log('[MainHome] Employee not found in DB (test ID?), using default state');
          setCurrentWork(null);
          setTodaySchedule(null);
          setWorkState('NOT_STARTED');
        }
        // 다른 에러는 조용히 처리 (이미 기본 상태로 설정됨)
      }
    };

    loadData();
  }, [employeeId]);

  useEffect(() => {
    if (workState !== 'IN_PROGRESS' || !currentWork?.startTime) return;

    const interval = setInterval(() => {
      const start = new Date(currentWork.startTime!);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      setElapsedTime(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [workState, currentWork]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartWork = async () => {
    if (!employeeId) {
      toast.error('근로자 정보가 없습니다.');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const workRecord = await api.createWorkRecord(employeeId, {
        startTime: now.toISOString(),
        notes: '',
      });

      setCurrentWork(workRecord);
      setWorkState('IN_PROGRESS');
      setElapsedTime(0);
      toast.success('출근 완료');
    } catch (error: any) {
      console.error('[MainHome] Failed to start work:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || '출근 처리에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEndWorkClick = () => {
    setShowEndWorkDialog(true);
  };

  const handleCompleteWork = async () => {
    if (!currentWork) {
      toast.error('근무 기록이 없습니다.');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const updatedRecord = await api.updateWorkRecord(currentWork.id, {
        endTime: now.toISOString(),
        notes: '업무 완료',
      });

      setCurrentWork(updatedRecord);
      setWorkState('COMPLETED');
      setElapsedTime(0);
      setShowEndWorkDialog(false);
      toast.success('퇴근 완료');
    } catch (error: any) {
      console.error('[MainHome] Failed to end work:', error);
      toast.error('퇴근 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = () => {
    setShowEndWorkDialog(false);
    setShowIssueDialog(true);
  };

  const handleEmergencyCall = () => {
    const companyPhone = '032-4567-8901';
    window.location.href = `tel:${companyPhone}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 출근 전 */}
      {workState === 'NOT_STARTED' && (
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-12 pb-8 rounded-b-3xl">
            <div className="flex items-center gap-2 text-emerald-100 mb-1">
              <Sun className="h-4 w-4" />
              <span className="text-sm">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {employeeName}님
            </h1>
            <p className="text-emerald-100 text-sm">{companyName}</p>
          </div>

          {/* 오늘의 업무 */}
          <div className="px-5 -mt-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-slate-600" />
                <h2 className="font-semibold text-slate-900">오늘의 업무</h2>
              </div>

              {todaySchedule && todaySchedule.tasks.length > 0 ? (
                <ul className="space-y-3">
                  {todaySchedule.tasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{task}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">오늘 예정된 업무가 없습니다.</p>
              )}
            </div>
          </div>

          {/* 출근 버튼 */}
          <div className="px-5 mt-6">
            <Button
              onClick={handleStartWork}
              disabled={loading}
              className="w-full h-16 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30"
            >
              <Play className="mr-3 h-6 w-6" />
              출근하기
            </Button>
          </div>
        </div>
      )}

      {/* 근무 중 */}
      {workState === 'IN_PROGRESS' && (
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-12 pb-10 rounded-b-3xl">
            <p className="text-emerald-100 text-sm mb-2">근무 중</p>
            <div className="flex items-baseline gap-2">
              <Clock className="h-8 w-8 text-white" />
              <span className="text-5xl font-bold text-white tracking-tight">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          {/* 상태 카드 */}
          <div className="px-5 -mt-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-900">업무 진행 중</span>
              </div>
              <p className="text-sm text-slate-500">
                오늘도 열심히 일하고 계시네요!
              </p>
            </div>
          </div>

          {/* 긴급 연락 */}
          <div className="px-5 mt-4">
            <button
              onClick={handleEmergencyCall}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <span className="font-medium text-slate-700">긴급 상황 신고</span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 퇴근 완료 */}
      {workState === 'COMPLETED' && (
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 pt-12 pb-10 rounded-b-3xl">
            <div className="flex items-center gap-2 text-slate-300 mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">퇴근 완료</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              수고하셨습니다!
            </h1>
          </div>

          {/* 근무 요약 */}
          <div className="px-5 -mt-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">오늘의 근무</h2>

              {currentWork?.duration && (
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-slate-500">총 근무 시간</span>
                  <span className="font-semibold text-slate-900">
                    {Math.floor(currentWork.duration / 60)}시간 {currentWork.duration % 60}분
                  </span>
                </div>
              )}

              <p className="text-sm text-slate-400 mt-4">
                내일도 좋은 하루 되세요!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 퇴근 다이얼로그 */}
      <AlertDialog open={showEndWorkDialog} onOpenChange={setShowEndWorkDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>퇴근하기</AlertDialogTitle>
            <AlertDialogDescription>
              오늘의 근무를 종료하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteWork}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
            >
              퇴근하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 특이사항 다이얼로그 */}
      <AlertDialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>특이사항 선택</AlertDialogTitle>
            <AlertDialogDescription>
              사유를 선택해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <button
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                issueType === 'machine'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setIssueType('machine')}
            >
              기계 고장
            </button>
            <button
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                issueType === 'health'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setIssueType('health')}
            >
              건강 문제
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (issueType === 'none') {
                  toast.error('사유를 선택해주세요.');
                  return;
                }

                const issueText = issueType === 'machine' ? '기계 고장' : '건강 문제';

                setLoading(true);
                try {
                  const now = new Date();
                  const updatedRecord = await api.updateWorkRecord(currentWork!.id, {
                    endTime: now.toISOString(),
                    notes: `특이사항: ${issueText}`,
                  });

                  setCurrentWork(updatedRecord);
                  setWorkState('COMPLETED');
                  setElapsedTime(0);
                  setShowIssueDialog(false);
                  toast.success('특이사항이 전송되었습니다.');
                } catch (error: any) {
                  console.error('[MainHome] Failed to end work with issue:', error);
                  toast.error('처리에 실패했습니다.');
                } finally {
                  setLoading(false);
                  setIssueType('none');
                }
              }}
              disabled={loading || issueType === 'none'}
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 퇴근 버튼 (근무 중일 때만) */}
      {workState === 'IN_PROGRESS' && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 z-40">
          <Button
            onClick={handleEndWorkClick}
            disabled={loading}
            className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg"
          >
            <Square className="mr-2 h-5 w-5" />
            퇴근하기
          </Button>
        </div>
      )}
    </div>
  );
};

// React.memo로 감싸서 불필요한 리렌더링 방지
export const MainHome = memo(MainHomeComponent);
