import * as React from "react"
import {
  Settings,
  Phone,
  Mail,
  Stamp,
  LogOut,
  Bell,
  Wallet,
  Monitor,
  User as UserIcon,
  ChevronRight
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "./ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { User as UserType } from "@shared/data" 
import { StampManager } from "./StampManager"
import svgPaths from "./svg-zgax4pilyk"

// SVG Components from Figma
function LogoIcon() {
  return (
    <div className="size-[24px] relative">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g>
          <path d={svgPaths.pbb94e50} stroke="#2E6B4E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p8b62180} stroke="#2E6B4E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p146ca7c0} stroke="#2E6B4E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p21f5800} stroke="#2E6B4E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p273a3400} stroke="#2E6B4E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2e53d380} stroke="#2E6B4E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg className="size-[18px]" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
      <g>
        <path d={svgPaths.pb56cd00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p3295c000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function RegisterIcon() {
   return (
    <svg className="size-[18px]" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
      <path d={svgPaths.p3e261870} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d={svgPaths.p93ea200} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
   )
}

function CustomerIcon() {
    return (
        <svg className="size-[18px]" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
             <path d={svgPaths.p1aa9a240} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
             <path d={svgPaths.p20571900} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
             <path d={svgPaths.p27cbeb00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
             <path d={svgPaths.p16c95800} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
    )
}

function NoticeIcon() {
    return (
        <svg className="size-[18px]" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <path d="M7.5 6H10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M9 15.75V9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M9 6V2.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M12.75 12H15.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M14.25 9V2.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M14.25 15.75V12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M2.25 10.5H5.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M3.75 7.5V2.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M3.75 15.75V10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
    )
}

function MonitorIcon() {
    return (
        <svg className="size-[18px]" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <path d="M3.75 15.75V11.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M9 15.75V2.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M14.25 15.75V6.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
    )
}

function PointIcon() {
    return (
        <svg className="size-[18px]" fill="none" preserveAspectRatio="none" viewBox="0 0 11.5 16.5">
            <path d={svgPaths.p2519e700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d={svgPaths.p22099d80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d="M2 0.75H0.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d="M5.75 0.75H0.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <path d="M5.75 0.75H0.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
    )
}

// Menu items - 계약관리와 근무현황만 표시
const items = [
  {
    title: "계약관리",
    url: "#",
    icon: RegisterIcon,
    value: "contracts",
    hasArrow: true
  },
  {
    title: "근무현황",
    url: "#",
    icon: MonitorIcon,
    value: "work-records",
    hasArrow: true
  },
]

interface AppSidebarProps {
  user: UserType;
  onLogout: () => void;
  stampImage: string | null;
  setStampImage: (image: string | null) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AppSidebar({ user, onLogout, stampImage, setStampImage, activeTab, onTabChange }: AppSidebarProps) {
  // Admin Info State
  const [adminName, setAdminName] = React.useState(user.name)
  const [adminPhone, setAdminPhone] = React.useState(user.phone)
  const [adminEmail, setAdminEmail] = React.useState(user.email)
  const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false)
  const [isStampManagerOpen, setIsStampManagerOpen] = React.useState(false)

  React.useEffect(() => {
    setAdminName(user.name)
    setAdminPhone(user.phone)
    setAdminEmail(user.email)
  }, [user])

  const handleMenuClick = (item: any) => {
      if (onTabChange && item.value) {
          onTabChange(item.value);
      }
  }

  return (
    <Sidebar className="bg-[#2E6B4E] border-none text-white fixed left-0 top-0 h-screen z-50" collapsible="none">
       <SidebarHeader className="p-5 pb-8">
        <div className="flex items-center gap-3">
           <div className="size-[40px] bg-white rounded-[10px] flex items-center justify-center shrink-0">
               <LogoIcon />
           </div>
           <div className="flex flex-col">
               <span className="text-[13px] font-normal text-white leading-tight">경기도청 관리자 대시보드</span>
               <span className="text-[10px] text-white/90 font-light mt-0.5 leading-tight">
                   AI 기반 역순환 자판기<br/>모니터링 시스템
               </span>
           </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11.4px] text-white/80 font-medium px-4 mb-2 tracking-[0.3px]">주요 메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const isActive = activeTab === item.value;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                       asChild
                       isActive={isActive}
                       onClick={(e) => {
                         e.preventDefault();
                         handleMenuClick(item);
                       }}
                       className={`
                          h-[40px] rounded-[16.4px] px-4 transition-all duration-200
                          ${isActive
                              ? "bg-[#3D7D5E] text-white hover:bg-[#3D7D5E] hover:text-white font-medium"
                              : "text-white hover:bg-[#3D7D5E]/50 hover:text-white"
                          }
                       `}
                    >
                      <a href={item.url} className="flex items-center w-full">
                        <div className="mr-3">
                          <item.icon />
                        </div>
                        <span className="text-[15.1px] leading-none">{item.title}</span>
                        {item.hasArrow && (
                            <ChevronRight className="ml-auto size-4 text-white/70" />
                        )}
                      </a>

                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mb-[16px] mt-[300px] mr-[0px] ml-[0px]">
          {/* User Profile Section matching Figma */}
          <div 
            className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsAdminModalOpen(true)}
          >
             <div className="relative">
                 <div className="size-[32px] bg-[#BCE1F8] rounded-full border border-white/20 shadow-sm overflow-hidden">
                     {/* Placeholder for user avatar if needed, using simple color for now as per design */}
                 </div>
                 <div className="absolute bottom-0 right-0 size-[10px] bg-[#00C950] border-2 border-white rounded-full"></div>
             </div>
             <div className="flex flex-col">
                 <span className="text-[13.2px] font-medium text-white">{adminName}</span>
                 <span className="text-[11.3px] text-white/80 font-light">{user.role === 'super_admin' ? '시스템 관리자' : '기업 관리자'}</span>
             </div>
          </div>
      </SidebarFooter>

      {/* Admin Profile Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
           <DialogHeader>
              <DialogTitle className="text-center text-xl pb-4">관리자 설정</DialogTitle>
              <DialogDescription className="sr-only">
                 관리자 정보를 수정하고 직인을 관리할 수 있는 모달입니다.
              </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-6 py-2">
               <div className="flex items-center gap-4">
                  <Label className="w-24 text-right shrink-0">관리자 성명</Label>
                  <Input 
                    value={adminName} 
                    onChange={(e) => setAdminName(e.target.value)}
                    className="flex-1"
                  />
               </div>
               <div className="flex items-center gap-4">
                  <Label className="w-24 text-right shrink-0">연락처</Label>
                  <div className="flex-1 relative">
                     <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                     <Input 
                        value={adminPhone} 
                        onChange={(e) => setAdminPhone(e.target.value)}
                        className="pl-9"
                    />
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <Label className="w-24 text-right shrink-0">이메일</Label>
                  <div className="flex-1 relative">
                     <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                     <Input 
                        value={adminEmail} 
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="pl-9"
                    />
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <Label className="w-24 text-right shrink-0">기관명</Label>
                  <div className="flex-1 text-slate-900 font-medium pl-3">
                     {user.role === 'super_admin' ? '경기도청 (HQ)' : '(주)글로벌트레이드'}
                  </div>
               </div>

               {/* 직인 관리 버튼 (Company Admin Only) */}
               {user.role === 'company_admin' && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-full border shadow-sm">
                             <Stamp className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex flex-col">
                              <span className="font-semibold text-sm">회사 직인 관리</span>
                              <span className="text-xs text-slate-500">계약서에 사용할 직인을 등록하세요</span>
                          </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setIsStampManagerOpen(true)}>
                          관리
                      </Button>
                  </div>
               )}
           </div>

           <DialogFooter className="sm:justify-between pt-4 gap-2 border-t mt-2">
               <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
               </Button>
               <div className="flex gap-2">
                 <Button variant="outline" onClick={() => setIsAdminModalOpen(false)}>
                    취소
                 </Button>
                 <Button className="bg-[#2E6B4E] hover:bg-[#24543D] text-white font-bold" onClick={() => setIsAdminModalOpen(false)}>
                    저장하기
                 </Button>
               </div>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Stamp Manager Modal */}
      <StampManager 
         isOpen={isStampManagerOpen} 
         onClose={() => setIsStampManagerOpen(false)}
         stampImage={stampImage}
         setStampImage={setStampImage}
      />
    </Sidebar>
  )
}
