import React, { useState, useEffect, useRef, memo } from 'react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Clock, Play, Square, CheckCircle2, Briefcase, Building2, ChevronRight } from 'lucide-react';
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

  const previousEmployeeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    if (previousEmployeeIdRef.current === employeeId) return;

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
        // 401/403 에러는 인증 문제이므로 조용히 처리 (기본 상태 유지)
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('[MainHome] Authentication error, using default state');
          setCurrentWork(null);
          setTodaySchedule(null);
          setWorkState('NOT_STARTED');
        } else if (error.response?.status === 404) {
          setCurrentWork(null);
          setTodaySchedule(null);
          setWorkState('NOT_STARTED');
        } else {
          // 네트워크 에러 등도 기본 상태 유지
          setCurrentWork(null);
          setTodaySchedule(null);
          setWorkState('NOT_STARTED');
        }
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  };

  const getFormattedDate = () => {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}요일`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-24">
      {/* 출근 전 */}
      {workState === 'NOT_STARTED' && (
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="bg-[#2E6B4E] px-6 pt-14 pb-24">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-white/70" />
                <span className="text-[13px] text-white/70">{companyName}</span>
              </div>
              <span className="text-[13px] text-white/70">{getFormattedDate()}</span>
            </div>
            <p className="text-[14px] text-white/80 mb-1">{getGreeting()}</p>
            <h1 className="text-[26px] font-bold text-white tracking-tight">
              {employeeName}님
            </h1>
          </div>

          {/* 오늘의 업무 카드 */}
          <div className="px-5 -mt-12">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#2E6B4E]/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-[#2E6B4E]" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-[15px]">오늘의 업무</h2>
                </div>
                <span className="text-[12px] text-slate-400">
                  {todaySchedule?.tasks?.length || 0}개
                </span>
              </div>

              {todaySchedule && todaySchedule.tasks.length > 0 ? (
                <ul className="space-y-3">
                  {todaySchedule.tasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#2E6B4E] flex-shrink-0" />
                      <span className="text-slate-600 text-[14px] leading-relaxed">{task}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-slate-400 text-[14px]">오늘 예정된 업무가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 출근 버튼 */}
          <div className="px-5 mt-6">
            <Button
              onClick={handleStartWork}
              disabled={loading}
              className="w-full h-[56px] text-[16px] font-bold bg-[#2E6B4E] hover:bg-[#245A40] text-white rounded-2xl shadow-lg shadow-[#2E6B4E]/20 transition-all active:scale-[0.98]"
            >
              <Play className="mr-2 h-5 w-5" />
              출근하기
            </Button>
          </div>
        </div>
      )}

      {/* 근무 중 */}
      {workState === 'IN_PROGRESS' && (
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="bg-[#2E6B4E] px-6 pt-14 pb-24">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[13px] text-white/90 font-medium">근무 중</span>
              </div>
              <span className="text-[13px] text-white/70">{getFormattedDate()}</span>
            </div>
            <p className="text-[14px] text-white/70 mb-2">오늘 근무 시간</p>
            <div className="flex items-baseline">
              <span className="text-[48px] font-bold text-white tracking-tight leading-none">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          {/* 상태 카드 */}
          <div className="px-5 -mt-12">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E6B4E]/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#2E6B4E]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-[15px]">업무 진행 중</p>
                  <p className="text-[13px] text-slate-500">오늘도 열심히 일하고 계시네요!</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 퇴근 완료 */}
      {workState === 'COMPLETED' && (
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="bg-slate-800 px-6 pt-14 pb-24">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] text-white/70">{getFormattedDate()}</span>
            </div>
            <h1 className="text-[32px] font-bold text-white tracking-tight mb-2">
              근무 완료
            </h1>
          </div>

          {/* 오늘의 업무 카드 */}
          <div className="px-5 -mt-12">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#2E6B4E]/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-[#2E6B4E]" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-[15px]">오늘의 업무</h2>
                </div>
                <span className="text-[12px] text-slate-400">
                  {todaySchedule?.tasks?.length || 0}개
                </span>
              </div>

              {todaySchedule && todaySchedule.tasks.length > 0 ? (
                <ul className="space-y-3">
                  {todaySchedule.tasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#2E6B4E] flex-shrink-0" />
                      <span className="text-slate-600 text-[14px] leading-relaxed">{task}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-slate-400 text-[14px]">오늘 예정된 업무가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 근무 요약 */}
          {currentWork?.duration && (
            <div className="px-5 mt-4">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="font-semibold text-slate-900 text-[15px] mb-4">오늘의 근무 기록</h2>
                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                  <span className="text-slate-500 text-[14px]">총 근무 시간</span>
                  <span className="font-bold text-[#2E6B4E] text-[18px]">
                    {Math.floor(currentWork.duration / 60)}시간 {currentWork.duration % 60}분
                  </span>
                </div>
                <p className="text-[14px] text-slate-400 mt-4 text-center">
                  내일도 좋은 하루 되세요!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 퇴근 다이얼로그 */}
      <AlertDialog open={showEndWorkDialog} onOpenChange={setShowEndWorkDialog}>
        <AlertDialogContent className="bg-white border-slate-200 rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px] text-slate-900">퇴근하기</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-slate-600">
              오늘의 근무를 종료하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-xl h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteWork}
              disabled={loading}
              className="bg-[#2E6B4E] hover:bg-[#245A40] rounded-xl h-12 text-white"
            >
              퇴근하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 특이사항 다이얼로그 */}
      <AlertDialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <AlertDialogContent className="bg-white border-slate-200 rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px]">특이사항 선택</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px]">
              사유를 선택해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <button
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                issueType === 'machine'
                  ? 'border-[#2E6B4E] bg-[#2E6B4E]/5 text-[#2E6B4E]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setIssueType('machine')}
            >
              <span className="font-medium">기계 고장</span>
            </button>
            <button
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                issueType === 'health'
                  ? 'border-[#2E6B4E] bg-[#2E6B4E]/5 text-[#2E6B4E]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setIssueType('health')}
            >
              <span className="font-medium">건강 문제</span>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-12">취소</AlertDialogCancel>
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
              className="bg-[#2E6B4E] hover:bg-[#245A40] rounded-xl h-12"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 퇴근 버튼 (근무 중일 때만) */}
      {workState === 'IN_PROGRESS' && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-4 bg-gradient-to-t from-[#F8FAFB] via-[#F8FAFB] to-transparent pt-8 z-40">
          <Button
            onClick={handleEndWorkClick}
            disabled={loading}
            className="w-full h-[56px] text-[16px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            <Square className="mr-2 h-5 w-5" />
            퇴근하기
          </Button>
        </div>
      )}
    </div>
  );
};

export const MainHome = memo(MainHomeComponent);
