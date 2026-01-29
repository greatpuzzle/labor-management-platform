import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
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
        // 401/403 에러는 인증 문제이므로 조용히 처리 (빈 배열로 설정)
        if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
          setWorkRecords([]);
        } else {
          // 네트워크 에러 등도 빈 배열로 설정
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
  const totalMinutes = workRecords
    .filter(r => r.status === 'COMPLETED' && r.duration)
    .reduce((sum, r) => sum + (r.duration || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

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
    <div className="min-h-screen bg-[#F8FAFB] pb-24">
      {/* 헤더 */}
      <div className="bg-[#2E6B4E] px-6 pt-14 pb-24">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-white/70" />
          <span className="text-[13px] text-white/70">근무 기록</span>
        </div>
        <h1 className="text-[26px] font-bold text-white tracking-tight">
          {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
        </h1>
      </div>

      {/* 통계 카드 */}
      <div className="px-5 -mt-12">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[13px] text-slate-500 mb-1">근무 일수</p>
              <div className="flex items-baseline">
                <span className="text-[32px] font-bold text-[#2E6B4E]">{workedDays}</span>
                <span className="text-[14px] font-medium text-slate-400 ml-1">일</span>
              </div>
            </div>
            <div>
              <p className="text-[13px] text-slate-500 mb-1">총 근무 시간</p>
              <div className="flex items-baseline">
                <span className="text-[32px] font-bold text-slate-900">{totalHours}</span>
                <span className="text-[14px] font-medium text-slate-400 ml-1">시간</span>
                {remainingMinutes > 0 && (
                  <>
                    <span className="text-[20px] font-bold text-slate-900 ml-1">{remainingMinutes}</span>
                    <span className="text-[14px] font-medium text-slate-400 ml-1">분</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h3 className="text-[16px] font-bold text-slate-900">
              {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
            </h3>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {dayNames.map((day, index) => (
              <div
                key={index}
                className={cn(
                  'text-center text-[12px] font-semibold py-2',
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
                    isToday && !isWorked && !isInProgress && 'ring-2 ring-[#2E6B4E] ring-offset-1',
                    isWorked && 'bg-yellow-100',
                    isInProgress && 'bg-[#2E6B4E]',
                    !isWorked && !isInProgress && 'bg-slate-50'
                  )}
                >
                  <span
                    className={cn(
                      'text-[13px] font-semibold z-10',
                      isWorked && 'text-slate-700',
                      isInProgress && 'text-white',
                      !isWorked && !isInProgress && 'text-slate-600',
                      isToday && !isWorked && !isInProgress && 'text-[#2E6B4E] font-bold'
                    )}
                  >
                    {day}
                  </span>
                  {isWorked && (
                    <img 
                      src="/stamp.png" 
                      alt="도장" 
                      className="absolute inset-0 w-full h-full object-contain opacity-80" 
                    />
                  )}
                  {isInProgress && (
                    <Clock className="h-3 w-3 text-white mt-0.5 z-10" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-yellow-100 relative overflow-hidden">
                <img src="/stamp.png" alt="도장" className="absolute inset-0 w-full h-full object-contain opacity-60" />
              </div>
              <span className="text-[12px] text-slate-500 font-medium">완료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-[#2E6B4E]" />
              <span className="text-[12px] text-slate-500 font-medium">진행 중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md ring-2 ring-[#2E6B4E]" />
              <span className="text-[12px] text-slate-500 font-medium">오늘</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
