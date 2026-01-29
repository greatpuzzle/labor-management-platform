import React from 'react';
import { Home, Calendar, User } from 'lucide-react';
import { cn } from './ui/utils';

interface BottomTabBarProps {
  activeTab: 'home' | 'payroll' | 'mypage';
  onTabChange: (tab: 'home' | 'payroll' | 'mypage') => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const tabs = [
    { id: 'home' as const, label: '홈', icon: Home },
    { id: 'payroll' as const, label: '근무기록', icon: Calendar },
    { id: 'mypage' as const, label: '내정보', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
      <div className="h-[72px] flex items-center justify-around px-4 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-all',
                'active:scale-95'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-0.5',
                isActive ? 'bg-[#2E6B4E]' : 'bg-transparent'
              )}>
                <Icon className={cn(
                  'h-[22px] w-[22px] transition-all',
                  isActive ? 'text-white' : 'text-slate-400'
                )} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[11px] font-medium transition-all',
                isActive ? 'text-[#2E6B4E]' : 'text-slate-400'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
