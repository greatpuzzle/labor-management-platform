import React from 'react';
import { Home, Calendar, User } from 'lucide-react';
import { Button } from './ui/button';
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
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50 safe-area-inset-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full transition-colors',
              isActive ? 'text-[#00C950]' : 'text-slate-500'
            )}
          >
            <Icon className={cn('h-6 w-6 mb-1', isActive && 'text-[#00C950]')} />
            <span className={cn('text-xs font-medium', isActive && 'text-[#00C950] font-semibold')}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

