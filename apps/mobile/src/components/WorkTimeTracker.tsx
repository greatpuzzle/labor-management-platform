import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Clock, Play, Square, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface WorkRecord {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // 분 단위
  status: 'in_progress' | 'completed';
  notes: string;
}

interface WorkTimeTrackerProps {
  employeeName: string;
}

export function WorkTimeTracker({ employeeName }: WorkTimeTrackerProps) {
  const [currentWork, setCurrentWork] = useState<WorkRecord | null>(null);
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0); // 초 단위

  // Load records from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('work-records');
    if (saved) {
      const parsed = JSON.parse(saved);
      setWorkRecords(parsed);

      // Check if there's an in-progress work
      const inProgress = parsed.find((r: WorkRecord) => r.status === 'in_progress');
      if (inProgress) {
        setCurrentWork(inProgress);
      }
    }
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    if (!currentWork) return;

    const interval = setInterval(() => {
      const start = new Date(currentWork.startTime);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      setElapsedTime(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentWork]);

  // Save records to localStorage
  const saveRecords = (records: WorkRecord[]) => {
    localStorage.setItem('work-records', JSON.stringify(records));
    setWorkRecords(records);
  };

  const handleStartWork = () => {
    if (currentWork) {
      toast.error("이미 근무 중입니다.");
      return;
    }

    const now = new Date();
    const newWork: WorkRecord = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      startTime: now.toISOString(),
      status: 'in_progress',
      notes: '달성', // 기본값
    };

    setCurrentWork(newWork);
    const updated = [...workRecords, newWork];
    saveRecords(updated);
    toast.success("근무를 시작했습니다.");
  };

  const handleEndWork = () => {
    if (!currentWork) {
      toast.error("근무 중이 아닙니다.");
      return;
    }

    const now = new Date();
    const start = new Date(currentWork.startTime);
    const durationMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));

    const completed: WorkRecord = {
      ...currentWork,
      endTime: now.toISOString(),
      duration: durationMinutes,
      status: 'completed',
    };

    const updated = workRecords.map(r => r.id === currentWork.id ? completed : r);
    saveRecords(updated);
    setCurrentWork(null);
    setElapsedTime(0);
    toast.success(`근무를 종료했습니다. (${durationMinutes}분)`);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const todayRecords = workRecords.filter(r => {
    const recordDate = new Date(r.date).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return recordDate === today;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{employeeName}님</h1>
              <p className="text-sm text-slate-500 mt-0.5">오늘도 화이팅!</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Current Status Card */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="text-center space-y-4">
            {currentWork ? (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  근무 중
                </div>
                <div className="text-5xl font-bold text-slate-900 font-mono">
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-slate-600">
                  시작 시간: {formatDateTime(currentWork.startTime)}
                </p>
                <Button
                  onClick={handleEndWork}
                  className="w-full h-16 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  <Square className="h-5 w-5 mr-2" />
                  근무 종료
                </Button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                  근무 전
                </div>
                <div className="text-3xl font-bold text-slate-400">
                  --:--:--
                </div>
                <p className="text-slate-500">
                  근무를 시작하려면 버튼을 눌러주세요
                </p>
                <Button
                  onClick={handleStartWork}
                  className="w-full h-16 text-lg font-bold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-xl"
                >
                  <Play className="h-5 w-5 mr-2" />
                  근무 시작
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Today's Records */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              오늘의 근무 기록
            </h2>
            <span className="text-sm text-slate-500">{todayRecords.length}건</span>
          </div>

          {todayRecords.length > 0 ? (
            <div className="space-y-2">
              {todayRecords.map(record => (
                <Card key={record.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {record.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                        )}
                        <span className="font-medium text-slate-900">
                          {formatDateTime(record.startTime)}
                          {record.endTime && ` - ${formatDateTime(record.endTime)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        {record.duration !== undefined && (
                          <span>근무시간: {Math.floor(record.duration / 60)}시간 {record.duration % 60}분</span>
                        )}
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {record.notes}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-slate-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>오늘의 근무 기록이 없습니다</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
