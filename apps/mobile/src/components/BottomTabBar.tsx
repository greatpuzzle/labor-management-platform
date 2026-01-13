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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 safe-area-inset-bottom">
      <div className="h-16 flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-all',
                isActive ? 'text-emerald-600' : 'text-slate-400'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all',
                isActive && 'bg-emerald-50'
              )}>
                <Icon className={cn(
                  'h-5 w-5 transition-all',
                  isActive && 'text-emerald-600'
                )} />
              </div>
              <span className={cn(
                'text-[11px] mt-1 font-medium transition-all',
                isActive && 'text-emerald-600 font-semibold'
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
