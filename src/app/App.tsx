import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import { ContractDashboard } from "./components/ContractDashboard"
import { Login } from "./components/Login"
import { EmployeeRegistration } from "./components/EmployeeRegistration"
import { EmployeeContractApp } from "./components/EmployeeContractApp"
import { Separator } from "./components/ui/separator"
import { Toaster } from "./components/ui/sonner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb"
import { LogOut } from 'lucide-react';
import { Button } from './components/ui/button';
import { User, Employee, companies, initialEmployees } from './data';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [inviteCompanyId, setInviteCompanyId] = useState<string | null>(null);
  
  // State for Employee Contract App Flow
  const [showEmployeeContract, setShowEmployeeContract] = useState(false);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCompanyId(invite);
    }
  }, []);

  const handleLogin = (id: string, pw: string) => {
    // Mock Login Logic
    if (id === 'greatpuzzle' && pw === '128') {
      setUser({
        id: 'greatpuzzle',
        name: '김퍼즐',
        role: 'super_admin',
        email: 'admin@greatpuzzle.com',
        phone: '010-1234-5678'
      });
    } else if (id === 'globaltrade' && pw === '999') {
      setUser({
        id: 'globaltrade',
        name: '최세계',
        role: 'company_admin',
        companyId: 'c4', // Matches the mock data for (주)글로벌트레이드
        email: 'ceo@globaltrade.com',
        phone: '032-555-7777'
      });
    } else {
      alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStampImage(null); // Optional: clear stamp on logout
  };

  const handleSimulateInvite = () => {
    // Simulate clicking an invite link for Global Trade (c4)
    setInviteCompanyId('c4');
  };

  const handleRegisterEmployee = (data: { name: string, phone: string, dob: string }) => {
    if (!inviteCompanyId) return;
    const newEmployee: Employee = {
      id: Date.now().toString(),
      companyId: inviteCompanyId,
      name: data.name,
      phone: data.phone,
      dob: data.dob,
      status: 'draft', // 발송 전
      workingHours: '13:00 ~ 16:30',
      salary: '920,000',
      contractPeriod: '2026.01.02 ~ 2027.01.01'
    };
    setEmployees(prev => [...prev, newEmployee]);
    setCurrentEmployeeName(data.name);
  };

  // 1. Employee Contract App Flow (Priority 1)
  if (showEmployeeContract) {
      return (
        <EmployeeContractApp 
            employeeName={currentEmployeeName}
            onClose={() => {
                setShowEmployeeContract(false);
                setInviteCompanyId(null);
                setCurrentEmployeeName("");
            }} 
        />
      );
  }

  // 2. Invite/Registration View (Priority 2)
  if (inviteCompanyId) {
     const company = companies.find(c => c.id === inviteCompanyId);
     if (!company) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="text-center">
             <h1 className="text-2xl font-bold text-slate-900 mb-2">유효하지 않은 링크</h1>
             <p className="text-slate-500">올바른 초대 링크인지 확인해주세요.</p>
             <Button className="mt-4" onClick={() => setInviteCompanyId(null)}>홈으로 이동</Button>
           </div>
         </div>
       );
     }
     return (
        <EmployeeRegistration 
          companyName={company.name} 
          onSubmit={handleRegisterEmployee}
          onHome={() => setShowEmployeeContract(true)} 
        />
     );
  }

  // 3. Login View (Priority 3)
  if (!user) {
    return <Login onLogin={handleLogin} onSimulateInvite={handleSimulateInvite} />;
  }

  // 4. Admin Dashboard (Priority 4)
  return (
    <SidebarProvider>
      <AppSidebar 
        user={user}
        onLogout={handleLogout}
        stampImage={stampImage}
        setStampImage={setStampImage}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-white">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Contract Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 bg-slate-50/50">
          <ContractDashboard 
            stampImage={stampImage} 
            setStampImage={setStampImage}
            user={user} 
            employees={employees}
            setEmployees={setEmployees}
          />
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
