import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Clock, Play, Square, AlertCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { api, WorkRecord, WorkSchedule } from '@shared/api';

interface MainHomeProps {
  employeeId: string;
  employeeName: string;
  companyName: string;
}

type WorkState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export function MainHome({ employeeId, employeeName, companyName }: MainHomeProps) {
  const [currentWork, setCurrentWork] = useState<WorkRecord | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<WorkSchedule | null>(null);
  const [workState, setWorkState] = useState<WorkState>('NOT_STARTED');
  const [elapsedTime, setElapsedTime] = useState(0); // 초 단위
  const [loading, setLoading] = useState(false);
  const [showEndWorkDialog, setShowEndWorkDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueType, setIssueType] = useState<'none' | 'machine' | 'health'>('none');

  // 오늘 근무 기록 및 업무 스케줄 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 오늘 근무 기록 조회
        const workRecord = await api.getCurrentWorkRecord(employeeId);
        setCurrentWork(workRecord || null);

        if (workRecord) {
          setWorkState(workRecord.status as WorkState);
          
          // 근무 중이면 타이머 시작
          if (workRecord.status === 'IN_PROGRESS' && workRecord.startTime) {
            const start = new Date(workRecord.startTime);
            const now = new Date();
            const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
            setElapsedTime(diff);
          }
        } else {
          setWorkState('NOT_STARTED');
        }

        // 오늘 업무 스케줄 조회
        const schedule = await api.getTodaySchedule(employeeId);
        setTodaySchedule(schedule);
      } catch (error: any) {
        console.error('[MainHome] Failed to load data:', error);
        toast.error('정보를 불러오는데 실패했습니다.');
      }
    };

    loadData();
  }, [employeeId]);

  // 타이머 업데이트
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

  // 시간 포맷 (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 출근하기
  const handleStartWork = async () => {
    if (!employeeId) {
      toast.error('근로자 정보가 없어 근무를 시작할 수 없습니다.');
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
      toast.success('근무를 시작했습니다.');
    } catch (error: any) {
      console.error('[MainHome] Failed to start work:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || '근무 시작에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 퇴근하기 클릭
  const handleEndWorkClick = () => {
    setShowEndWorkDialog(true);
  };

  // 특이사항 없음 (업무 완료)
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
      toast.success('퇴근 처리되었습니다.');
    } catch (error: any) {
      console.error('[MainHome] Failed to end work:', error);
      toast.error('퇴근 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 특이사항 있음
  const handleIssueClick = () => {
    setShowEndWorkDialog(false);
    setShowIssueDialog(true);
  };

  // 긴급 상황/불편 신고
  const handleEmergencyCall = () => {
    // 관리자 전화 연결 (tel: 링크)
    const companyPhone = '032-4567-8901'; // 회사 전화번호 (나중에 동적으로 가져오기)
    window.location.href = `tel:${companyPhone}`;
  };

  // 현재 수행 중인 업무 (오늘 스케줄의 첫 번째 업무)
  const currentTask = todaySchedule?.tasks?.[0] || '업무 준비 중';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      {/* 출근 전 상태 */}
      {workState === 'NOT_STARTED' && (
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <Card className="w-full max-w-md p-6 mb-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                안녕하세요, {employeeName}님
              </h2>
              {todaySchedule && todaySchedule.tasks.length > 0 && (
                <p className="text-slate-600">
                  오늘 예정된 업무가 <span className="font-bold text-[#00C950]">{todaySchedule.tasks.length}건</span> 있습니다.
                </p>
              )}
              {todaySchedule && todaySchedule.tasks.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-semibold text-slate-700 mb-2">오늘의 업무:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                    {todaySchedule.tasks.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Button
            onClick={handleStartWork}
            disabled={loading}
            className="w-full max-w-md h-14 text-lg font-bold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-xl shadow-lg"
          >
            <Play className="mr-2 h-5 w-5" />
            출근하기
          </Button>
        </div>
      )}

      {/* 근무 중 상태 */}
      {workState === 'IN_PROGRESS' && (
        <div className="flex flex-col flex-1 p-6">
          <Card className="w-full p-6 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-[#00C950] mr-2" />
                <span className="text-3xl font-bold text-slate-900">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-2">근무 중</p>
              <p className="text-sm text-slate-600">
                현재 <span className="font-bold">{currentTask}</span> 업무 수행 중입니다.
              </p>
            </div>
          </Card>

          <Button
            onClick={handleEmergencyCall}
            variant="outline"
            className="w-full h-12 text-sm font-medium border-slate-300 text-slate-700"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            긴급 상황/불편 신고
          </Button>
        </div>
      )}

      {/* 퇴근 완료 상태 */}
      {workState === 'COMPLETED' && (
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <Card className="w-full max-w-md p-6 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-2">수고하셨습니다!</h2>
              {currentWork?.duration && (
                <p className="text-slate-600 mb-4">
                  오늘 근무 시간: {Math.floor(currentWork.duration / 60)}시간 {currentWork.duration % 60}분
                </p>
              )}
              <p className="text-sm text-slate-500">
                내일도 좋은 하루 되세요!
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* 퇴근하기 다이얼로그 */}
      <AlertDialog open={showEndWorkDialog} onOpenChange={setShowEndWorkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>퇴근하기</AlertDialogTitle>
            <AlertDialogDescription>
              오늘의 근무를 종료하시겠습니까? 특이사항이 있으신가요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleIssueClick}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              특이사항 있음
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleCompleteWork}
              disabled={loading}
              className="bg-[#00C950] hover:bg-[#009e3f]"
            >
              없음 (업무 완료)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 특이사항 다이얼로그 */}
      <AlertDialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>특이사항 확인</AlertDialogTitle>
            <AlertDialogDescription>
              특이사항 사유를 선택해주세요. 관리자에게 알림이 전송됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Button
              variant={issueType === 'machine' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setIssueType('machine')}
            >
              기계 고장
            </Button>
            <Button
              variant={issueType === 'health' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setIssueType('health')}
            >
              아픔/건강 문제
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (issueType === 'none') {
                  toast.error('사유를 선택해주세요.');
                  return;
                }

                // 특이사항 처리 (나중에 관리자에게 알림 전송)
                const issueText = issueType === 'machine' ? '기계 고장' : '아픔/건강 문제';
                
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
                  toast.success('특이사항이 관리자에게 전송되었습니다.');
                } catch (error: any) {
                  console.error('[MainHome] Failed to end work with issue:', error);
                  toast.error('처리에 실패했습니다.');
                } finally {
                  setLoading(false);
                  setIssueType('none');
                }
              }}
              disabled={loading || issueType === 'none'}
              className="bg-[#00C950] hover:bg-[#009e3f]"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 퇴근하기 버튼 (근무 중일 때만 표시, 탭바 위에 고정) */}
      {workState === 'IN_PROGRESS' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-slate-200 z-40">
          <Button
            onClick={handleEndWorkClick}
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg"
          >
            <Square className="mr-2 h-5 w-5" />
            퇴근하기
          </Button>
        </div>
      )}
    </div>
  );
}

