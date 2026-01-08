import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Check, Building2, FileText } from "lucide-react";

interface EmployeeRegistrationProps {
  companyName: string;
  onSubmit: (data: { name: string; phone: string; dob: string }) => void;
  onHome: () => void;
}

type Step = 'form' | 'complete';

export function EmployeeRegistration({ companyName, onSubmit, onHome }: EmployeeRegistrationProps) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    onSubmit({ name, phone, dob });
    setStep('complete');
  };

  // Step 2: Completion Screen (Now transitions to Contract Review)
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
         <div className="h-14 flex items-center px-4 border-b">
            <span className="font-bold text-lg">Great Puzzle</span>
         </div>
         <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-in zoom-in duration-500">
              <Check className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">등록 완료!</h2>
              <p className="text-slate-500">
                <span className="font-bold text-slate-900">{companyName}</span>의<br/>근로자 명부에 등록되었습니다.
              </p>
            </div>
            
            <div className="w-full max-w-xs p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-left">
                <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-emerald-900">전자계약서 도착</p>
                    <p className="text-xs text-emerald-700">지금 바로 서명을 진행해주세요.</p>
                </div>
            </div>

            <Button 
                className="w-full max-w-xs h-14 text-lg font-bold bg-[#00C950] hover:bg-[#009e3f] text-white shadow-lg shadow-green-900/10 rounded-xl" 
                onClick={onHome}
            >
               근로계약서 검토 및 서명하기
            </Button>
         </div>
      </div>
    );
  }

  // Step 1: Registration Form (Web View)
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Web Header */}
        <header className="h-14 bg-white border-b flex items-center px-4 sticky top-0 z-10">
           <h1 className="font-bold text-lg">근로자 정보 등록</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
           <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-slate-600" />
                 </div>
                 <span className="font-semibold text-lg text-slate-900">{companyName}</span>
              </div>
              <p className="text-slate-500 text-sm">
                원활한 근로 계약 체결을 위해<br/>정확한 본인 정보를 입력해주세요.
              </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-700">성명</Label>
                  <Input 
                    id="name" 
                    placeholder="실명 입력" 
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-slate-700">휴대폰 번호</Label>
                  <Input 
                    id="phone" 
                    placeholder="010-0000-0000" 
                    type="tel" 
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob" className="text-slate-700">생년월일</Label>
                  <Input 
                    id="dob" 
                    placeholder="YYYYMMDD (예: 19900101)" 
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="terms" 
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked === true)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="terms" className="text-sm font-semibold cursor-pointer block">
                        개인정보 수집 및 이용 동의 (필수)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        근로계약 체결 및 인사관리를 위해 성명, 연락처, 생년월일을 수집하며 퇴직 후 3년간 보관합니다.
                      </p>
                    </div>
                  </div>
              </div>

              <div className="pt-4 pb-8">
                <Button 
                  className="w-full h-14 text-lg font-bold rounded-xl bg-[#2E4F4F] hover:bg-[#1a2e2e] transition-all shadow-lg shadow-emerald-900/10" 
                  disabled={!agreed}
                >
                  입력 완료
                </Button>
              </div>
           </form>
        </main>
      </div>
    </div>
  );
}
