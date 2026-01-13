import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { api, WorkRecord } from '@shared/api';
import { cn } from './ui/utils';

interface PayrollProps {
  employeeId: string;
  employeeName: string;
}

export function Payroll({ employeeId, employeeName }: PayrollProps) {
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWorkRecords = async () => {
      if (!employeeId) return;

      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const records = await api.getWorkRecordsByEmployee(employeeId, { year, month });
        setWorkRecords(records);
      } catch (error: any) {
        console.error('[Payroll] Failed to load work records:', error);
        // 404 에러인 경우 (테스트 employeeId 등): 조용히 처리하고 빈 배열 설정
        if (error.response?.status === 404) {
          console.log('[Payroll] Employee not found in DB (test ID?), using empty records');
          setWorkRecords([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadWorkRecords();
  }, [employeeId, currentMonth]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getWorkRecordForDate = (day: number): WorkRecord | undefined => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workRecords.find(r => r.date === dateStr);
  };

  const workedDays = workRecords.filter(r => r.status === 'COMPLETED').length;
  const totalHours = workRecords
    .filter(r => r.status === 'COMPLETED' && r.duration)
    .reduce((sum, r) => sum + (r.duration || 0), 0);

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-2 text-emerald-100 mb-1">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">근무 기록</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
        </h1>
      </div>

      {/* 통계 카드 */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">근무 일수</p>
              <p className="text-3xl font-bold text-emerald-500">{workedDays}<span className="text-lg font-medium text-slate-400 ml-1">일</span></p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">총 근무 시간</p>
              <p className="text-3xl font-bold text-slate-900">{Math.floor(totalHours / 60)}<span className="text-lg font-medium text-slate-400 ml-1">시간</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900">
              {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
            </h3>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={index}
                className={cn(
                  'text-center text-xs font-medium py-2',
                  index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-slate-400'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="aspect-square" />;
              }

              const workRecord = getWorkRecordForDate(day);
              const isToday =
                day === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();
              const isWorked = workRecord?.status === 'COMPLETED';
              const isInProgress = workRecord?.status === 'IN_PROGRESS';

              return (
                <div
                  key={index}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative overflow-hidden',
                    isToday && !isWorked && !isInProgress && 'ring-2 ring-emerald-500 ring-offset-1',
                    isWorked && 'bg-emerald-500',
                    isInProgress && 'bg-amber-100',
                    !isWorked && !isInProgress && 'bg-slate-50'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium z-10',
                      isWorked && 'text-white',
                      isInProgress && 'text-amber-700',
                      !isWorked && !isInProgress && 'text-slate-600',
                      isToday && !isWorked && !isInProgress && 'text-emerald-600 font-bold'
                    )}
                  >
                    {day}
                  </span>
                  {isWorked && (
                    <CheckCircle2 className="h-3 w-3 text-white/80 mt-0.5" />
                  )}
                  {isInProgress && (
                    <Clock className="h-3 w-3 text-amber-600 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-emerald-500" />
              <span className="text-xs text-slate-500">완료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-amber-100 border border-amber-200" />
              <span className="text-xs text-slate-500">진행 중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md ring-2 ring-emerald-500" />
              <span className="text-xs text-slate-500">오늘</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
