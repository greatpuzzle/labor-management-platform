import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Check, Building2, FileText, Upload } from "lucide-react";

interface EmployeeRegistrationProps {
  companyName: string;
  onSubmit: (data: {
    name: string;
    phone: string;
    dob: string;
    disabilityLevel: '중증' | '경증';
    disabilityType: string;
    disabilityRecognitionDate: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    welfareCardUrl?: string;
    severeCertificateUrl?: string;
    sensitiveInfoConsent: boolean;
    // 근로조건 기본값
    contractPeriod: string;
    workingHours: string;
    workPlace: string;
    salary: string;
  }) => void;
  onHome: () => void;
}

type Step = 'form' | 'complete';

const disabilityTypes = [
  "지체장애",
  "뇌병변장애",
  "시각장애",
  "청각장애",
  "언어장애",
  "지적장애",
  "자폐성장애",
  "정신장애",
  "신장장애",
  "심장장애",
  "호흡기장애",
  "간장애",
  "안면장애",
  "장루·요루장애",
  "뇌전증장애",
];

export function EmployeeRegistration({ companyName, onSubmit, onHome }: EmployeeRegistrationProps) {
  const [step, setStep] = useState<Step>('form');

  // 기본 정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  // 장애 관련 정보
  const [disabilityLevel, setDisabilityLevel] = useState<'중증' | '경증'>('경증');
  const [disabilityType, setDisabilityType] = useState("");
  const [disabilityRecognitionDate, setDisabilityRecognitionDate] = useState("");

  // 비상연락망
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // 증빙서류 (2종류)
  const [welfareCardFile, setWelfareCardFile] = useState<File | null>(null);
  const [severeCertificateFile, setSevereCertificateFile] = useState<File | null>(null);

  // 동의
  const [personalInfoAgreed, setPersonalInfoAgreed] = useState(false);
  const [sensitiveInfoAgreed, setSensitiveInfoAgreed] = useState(false);

  // 계약 시작일 계산 (오늘 날짜 기준)
  const getContractPeriod = () => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    const formatDate = (d: Date) =>
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

    return `${formatDate(today)} ~ ${formatDate(nextYear)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalInfoAgreed || !sensitiveInfoAgreed) return;

    // 파일 업로드는 백엔드 구현 시 처리 예정
    onSubmit({
      name,
      phone,
      dob,
      disabilityLevel,
      disabilityType,
      disabilityRecognitionDate,
      emergencyContactName,
      emergencyContactPhone,
      welfareCardUrl: welfareCardFile?.name,
      severeCertificateUrl: severeCertificateFile?.name,
      sensitiveInfoConsent: sensitiveInfoAgreed,
      // 근로조건 기본값
      contractPeriod: getContractPeriod(),
      workingHours: "13:00 ~ 16:30",
      workPlace: "본사 지정장소",
      salary: "941,648",
    });
    setStep('complete');
  };

  // 폼 유효성 검사 - 필수 항목 모두 입력 확인
  const isFormValid =
    name.trim() !== '' &&
    phone.trim() !== '' &&
    dob.trim() !== '' &&
    disabilityType !== '' &&
    disabilityRecognitionDate.trim() !== '' &&
    emergencyContactName.trim() !== '' &&
    emergencyContactPhone.trim() !== '' &&
    personalInfoAgreed &&
    sensitiveInfoAgreed;

  // Step 2: Completion Screen (대기 화면 - 관리자 발송 후 카카오톡 알림)
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
         <div className="h-14 flex items-center px-6 border-b">
            <span className="font-bold text-lg">{companyName}</span>
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

            <div className="w-full max-w-sm p-5 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-amber-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">근로계약서 발송 대기중</p>
                    </div>
                </div>
                <p className="text-sm text-amber-700 leading-relaxed">
                  관리자가 근로계약서를 발송하면<br/>
                  <span className="font-bold">카카오톡 알림</span>으로 안내해 드립니다.
                </p>
            </div>

            <div className="w-full max-w-sm p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 leading-relaxed">
                  알림을 받으신 후 링크를 통해<br/>근로계약서를 확인하고 서명해 주세요.
                </p>
            </div>
         </div>
      </div>
    );
  }

  // Step 1: Registration Form (Web View)
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full min-h-screen relative flex flex-col">
        {/* Web Header */}
        <header className="h-14 bg-white border-b flex items-center px-6 sticky top-0 z-10">
           <h1 className="font-bold text-lg">근로자 정보 등록</h1>
        </header>

        <main className="flex-1 overflow-auto px-6 py-8">
           <div className="mb-10 px-2">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-slate-600" />
                 </div>
                 <span className="font-semibold text-lg text-slate-900">{companyName}</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                원활한 근로 계약 체결을 위해<br/>정확한 본인 정보를 입력해주세요.
              </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-10 px-2">
              {/* 기본 정보 섹션 */}
              <div className="space-y-5">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-4">기본 정보</h3>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 text-sm">성명<span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="실명 입력"
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 text-sm">휴대폰 번호<span className="text-red-500">*</span></Label>
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
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-slate-700 text-sm">생년월일<span className="text-red-500">*</span></Label>
                  <Input
                    id="dob"
                    placeholder="YYYY-MM-DD (예: 1990-01-01)"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9-]*"
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              {/* 장애 정보 섹션 */}
              <div className="space-y-6">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-4">장애 정보</h3>

                <div className="space-y-3">
                  <Label className="text-slate-700 text-sm">장애 정도<span className="text-red-500">*</span></Label>
                  <RadioGroup value={disabilityLevel} onValueChange={(value) => setDisabilityLevel(value as '중증' | '경증')}>
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="경증" id="level-mild" />
                        <Label htmlFor="level-mild" className="cursor-pointer">경증</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="중증" id="level-severe" />
                        <Label htmlFor="level-severe" className="cursor-pointer">중증</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disabilityType" className="text-slate-700 text-sm">장애 유형<span className="text-red-500">*</span></Label>
                  <Select value={disabilityType} onValueChange={setDisabilityType} required>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                      <SelectValue placeholder="장애 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      {disabilityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disabilityRecognitionDate" className="text-slate-700 text-sm">장애 인정일<span className="text-red-500">*</span></Label>
                  <Input
                    id="disabilityRecognitionDate"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9-]*"
                    placeholder="YYYY-MM-DD (예: 2020-01-01)"
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                    value={disabilityRecognitionDate}
                    onChange={(e) => setDisabilityRecognitionDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 비상연락망 섹션 */}
              <div className="space-y-6">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-4">비상연락망 (보호자)</h3>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName" className="text-slate-700 text-sm">보호자 성명<span className="text-red-500">*</span></Label>
                  <Input
                    id="emergencyContactName"
                    placeholder="보호자 이름 입력"
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone" className="text-slate-700 text-sm">보호자 전화번호<span className="text-red-500">*</span></Label>
                  <Input
                    id="emergencyContactPhone"
                    placeholder="010-0000-0000"
                    type="tel"
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* 증빙서류 업로드 섹션 */}
              <div className="space-y-6">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-4">증빙서류</h3>

                {/* 복지카드 */}
                <div className="space-y-2">
                  <Label htmlFor="welfareCard" className="text-slate-700 text-sm">복지카드 사본</Label>
                  <div className="relative">
                    <Input
                      id="welfareCard"
                      type="file"
                      accept="image/*,.pdf"
                      className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                      onChange={(e) => setWelfareCardFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {welfareCardFile && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {welfareCardFile.name}
                    </p>
                  )}
                </div>

                {/* 중증장애인확인서 */}
                <div className="space-y-2">
                  <Label htmlFor="severeCertificate" className="text-slate-700 text-sm">중증장애인확인서</Label>
                  <div className="relative">
                    <Input
                      id="severeCertificate"
                      type="file"
                      accept="image/*,.pdf"
                      className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                      onChange={(e) => setSevereCertificateFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {severeCertificateFile && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {severeCertificateFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* 동의 섹션 */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="personalInfo"
                      checked={personalInfoAgreed}
                      onCheckedChange={(checked) => setPersonalInfoAgreed(checked === true)}
                      className="mt-1"
                    />
                    <div className="space-y-1.5">
                      <Label htmlFor="personalInfo" className="text-sm font-semibold cursor-pointer block">
                        개인정보 수집 및 이용 동의 (필수)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        근로계약 체결 및 인사관리를 위해 성명, 연락처, 생년월일을 수집하며 퇴직 후 3년간 보관합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="sensitiveInfo"
                      checked={sensitiveInfoAgreed}
                      onCheckedChange={(checked) => setSensitiveInfoAgreed(checked === true)}
                      className="mt-1"
                    />
                    <div className="space-y-1.5">
                      <Label htmlFor="sensitiveInfo" className="text-sm font-semibold cursor-pointer block">
                        민감정보 수집 및 이용 동의 (필수)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        장애인 고용 관련 법령 준수 및 고용부담금 신고를 위해 장애 정도, 장애 유형, 장애 인정일 등 민감정보를 수집하며, 관련 법령에 따라 보관합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 pb-12">
                <Button
                  type="submit"
                  className={`w-full h-14 text-lg font-bold rounded-xl transition-all ${
                    isFormValid
                      ? 'bg-[#00C950] hover:bg-[#009e3f] text-white shadow-lg shadow-green-900/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  disabled={!isFormValid}
                >
                  입력 완료
                </Button>
                {!isFormValid && (
                  <p className="text-xs text-slate-400 text-center mt-3">
                    필수 항목을 모두 입력하고 동의해주세요
                  </p>
                )}
              </div>
           </form>
        </main>
      </div>
    </div>
  );
}
