import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '@shared/api';
import { toast } from 'sonner';
import { Phone, Loader2, ArrowLeft, Shield, Smartphone } from 'lucide-react';

interface PhoneLoginProps {
  onLoginSuccess: (employeeId: string, employeeName: string, companyName: string) => void;
}

// 임시 테스트용: 실제 본인인증 API 연동 전까지 사용
const TEST_PHONE = '01012341234';
const TEST_VERIFICATION_CODE = '1234';
const TEST_NAME = '김퍼즐';

export function PhoneLogin({ onLoginSuccess }: PhoneLoginProps) {
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) return phone;
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast.error('올바른 핸드폰 번호를 입력해주세요.');
      return;
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    if (normalizedPhone === TEST_PHONE) {
      setShowVerification(true);
      return;
    }

    setLoading(true);
    try {
      const result = await api.loginByPhone(phone);

      if (result.employee) {
        const employee = result.employee;
        const companyName = employee.company?.name || '';

        localStorage.setItem('employeeId', employee.id);
        localStorage.setItem('employeeName', employee.name);
        localStorage.setItem('companyName', companyName);

        toast.success('로그인 성공');
        onLoginSuccess(employee.id, employee.name, companyName);
      }
    } catch (error: any) {
      console.error('[PhoneLogin] Login failed:', error);
      const errorMessage = error.response?.data?.message || '등록된 정보가 없습니다.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode !== TEST_VERIFICATION_CODE) {
      toast.error('인증번호가 올바르지 않습니다.');
      return;
    }

    const testEmployeeId = `test-${Date.now()}`;
    const testCompanyName = '테스트 회사';

    localStorage.setItem('employeeId', testEmployeeId);
    localStorage.setItem('employeeName', TEST_NAME);
    localStorage.setItem('companyName', testCompanyName);

    toast.success('로그인 성공');
    onLoginSuccess(testEmployeeId, TEST_NAME, testCompanyName);
  };

  // 인증번호 입력 화면
  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
        {/* 헤더 */}
        <div className="px-4 pt-12 pb-8">
          <button
            onClick={() => {
              setShowVerification(false);
              setVerificationCode('');
            }}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span className="text-sm font-medium">뒤로</span>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 px-6">
          <div className="mb-8">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">인증번호 입력</h1>
            <p className="text-slate-500">
              <span className="text-slate-900 font-medium">{phone}</span>으로<br />
              전송된 인증번호를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div>
              <Input
                type="text"
                placeholder="0000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="h-14 text-2xl text-center tracking-[0.5em] font-semibold bg-white border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                autoFocus
                maxLength={4}
              />
              <p className="text-xs text-amber-600 mt-2 text-center">
                테스트: 1234
              </p>
            </div>

            <Button
              type="submit"
              disabled={!verificationCode || verificationCode.length !== 4}
              className="w-full h-14 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none"
            >
              확인
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // 핸드폰 번호 입력 화면
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* 상단 여백 */}
      <div className="pt-20" />

      {/* 콘텐츠 */}
      <div className="flex-1 px-6">
        <div className="mb-10">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
            <Smartphone className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">로그인</h1>
          <p className="text-slate-500">
            등록된 핸드폰 번호로 로그인하세요.
          </p>
        </div>

        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              핸드폰 번호
            </label>
            <Input
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={handlePhoneChange}
              disabled={loading}
              className="h-14 text-lg bg-white border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              회사 초대 링크를 통해 먼저 등록해주세요.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              테스트: 010-1234-1234
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !phone || phone.replace(/\D/g, '').length < 10}
            className="w-full h-14 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                확인 중...
              </>
            ) : (
              '로그인'
            )}
          </Button>
        </form>

        {/* 하단 안내 */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <p className="text-sm text-center text-slate-400">
            카카오톡으로 받은 계약서 링크로도<br />
            자동 로그인이 가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
