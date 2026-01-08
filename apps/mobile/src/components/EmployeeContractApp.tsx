import React, { useState, useRef, useEffect } from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Volume2, Check, ArrowRight, Eraser, PenTool, FileDown } from "lucide-react";
import { toast } from "sonner";
import { companies } from '@shared/data';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EmployeeContractAppProps {
  onClose: () => void;
  onWorkStart?: () => void;
  employeeName?: string;
}

export function EmployeeContractApp({ onClose, onWorkStart, employeeName = "홍길동" }: EmployeeContractAppProps) {
  const [step, setStep] = useState<'summary' | 'full' | 'signing' | 'completed'>('summary');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  
  // Data for contract
  const today = new Date();
  const company = companies.find(c => c.id === 'c4') || companies[0];

  // Canvas drawing logic
  useEffect(() => {
    if (step === 'signing' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
    }
  }, [step]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // TTS 기능 구현
  const getContractText = (): string => {
    const contractText = `
      표준근로계약서 기간의 정함이 있는 경우입니다.
      
      ${company.name} 이하 사업주라 함과 ${employeeName} 이하 근로자라 함은 다음과 같이 근로계약을 체결합니다.
      
      첫째, 근로계약기간은 2026년 1월 2일부터 2027년 1월 1일까지입니다.
      
      둘째, 근무 장소는 본사 사무실입니다.
      
      셋째, 업무의 내용은 소프트웨어 개발 및 운영 지원입니다.
      
      넷째, 소정근로시간은 13시 00분부터 16시 30분까지이며, 휴게시간은 없습니다.
      
      다섯째, 근무일과일은 매주 5일 또는 매일단위 근무이며, 주휴일은 매주 일요일입니다.
      
      여섯째, 임금에 대해 설명드리겠습니다.
      월급은 92만원입니다.
      상여금은 없습니다.
      기타급여 제수당은 없습니다.
      임금지급일은 매월 25일이며, 휴일의 경우는 전일 지급합니다.
      지급방법은 예금통장에 입금합니다.
      
      일곱째, 연차유급휴가는 근로기준법에서 정하는 바에 따라 부여합니다.
      
      여덟째, 사회보험 적용여부는 고용보험, 산재보험, 국민연금, 건강보험 모두 적용됩니다.
      
      아홉째, 근로계약서 교부에 대해 사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자에게 교부합니다. 이는 근로기준법 제17조 이행입니다.
      
      열째, 성실이행의무에 대해 사업주와 근로자는 각자가 근로계약, 취업규칙, 단체협약을 지키고 성실하게 이행하여야 합니다.
      
      열한째, 기타 사항으로 이 계약에 정함이 없는 사항은 근로기준법령에 의합니다.
      
      계약 체결일은 ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일입니다.
      
      사업주는 ${company.name}이며, 대표자는 ${company.ceo}입니다.
      전화번호는 ${company.phone}이며, 주소는 ${company.address}입니다.
      
      근로자는 ${employeeName}입니다.
    `;
    return contractText.trim();
  };

  const handleTTS = () => {
    console.log('TTS 버튼 클릭됨');
    
    // 이미 읽는 중이면 중지
    if (isSpeaking && speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      toast.info("읽기 중지되었습니다.");
      return;
    }

    // Web Speech API 지원 확인
    if (!('speechSynthesis' in window)) {
      console.error('Web Speech API를 지원하지 않습니다.');
      toast.error("이 브라우저는 음성 읽기 기능을 지원하지 않습니다.");
      return;
    }

    const text = getContractText();
    console.log('읽을 텍스트:', text.substring(0, 100) + '...');
    
    // 기존 음성 중지
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
    }

    // Chrome의 경우 voices가 로드될 때까지 기다려야 할 수 있음
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR'; // 한국어 설정
      utterance.rate = 0.9; // 읽기 속도 (0.1 ~ 10)
      utterance.pitch = 1; // 음성 높이 (0 ~ 2)
      utterance.volume = 1; // 음량 (0 ~ 1)

      // 음성 읽기 시작
      utterance.onstart = (event) => {
        console.log('TTS 시작:', event);
        setIsSpeaking(true);
        toast.success("계약서를 읽고 있습니다...", {
          description: "중지하려면 다시 클릭하세요."
        });
      };

      // 음성 읽기 완료
      utterance.onend = (event) => {
        console.log('TTS 완료:', event);
        setIsSpeaking(false);
        toast.success("읽기가 완료되었습니다.");
      };

      // 에러 처리
      utterance.onerror = (event) => {
        console.error('TTS Error:', event);
        setIsSpeaking(false);
        let errorMsg = "읽기 중 오류가 발생했습니다.";
        if (event.error === 'not-allowed') {
          errorMsg = "음성 읽기 권한이 필요합니다. 브라우저 설정을 확인해주세요.";
        } else if (event.error === 'network') {
          errorMsg = "네트워크 오류가 발생했습니다.";
        }
        toast.error(errorMsg);
      };

      speechSynthesisRef.current = synth;
      synth.speak(utterance);
      console.log('speak() 호출됨, speaking:', synth.speaking, 'pending:', synth.pending);
    };

    // Chrome에서 voices가 로드되지 않았을 수 있으므로 확인
    if (synth.getVoices().length === 0) {
      console.log('Voices 로딩 대기 중...');
      synth.onvoiceschanged = () => {
        console.log('Voices 로드 완료:', synth.getVoices().length);
        speak();
      };
      // 일부 브라우저에서는 onvoiceschanged가 발생하지 않을 수 있으므로 타임아웃 설정
      setTimeout(() => {
        if (synth.getVoices().length > 0) {
          speak();
        } else {
          console.warn('Voices가 로드되지 않았지만 계속 진행합니다.');
          speak();
        }
      }, 100);
    } else {
      speak();
    }
  };

  // 컴포넌트 언마운트 시 음성 중지
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  const handleSignComplete = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          setSignatureDataUrl(canvas.toDataURL('image/png'));
      }
      setStep('completed');
  };

  const handleDownloadPDF = async () => {
      if (!contractRef.current) return;
      
      const toastId = toast.loading("PDF 생성 중...");
      
      try {
          // Force layout calculation for the hidden div
          contractRef.current.style.display = 'block';
          
          const canvas = await html2canvas(contractRef.current, {
              scale: 2,
              useCORS: true,
              logging: false,
              windowWidth: 794,
              height: 1123,
              width: 794,
              backgroundColor: '#ffffff'
          });
          
          // Hide again
          // contractRef.current.style.display = 'none'; // Keeping it absolute/hidden via class is better
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${employeeName}_근로계약서.pdf`);
          
          toast.success("계약서가 다운로드되었습니다.", { id: toastId });
      } catch (error) {
          console.error("PDF generation failed", error);
          toast.error("다운로드에 실패했습니다.", { id: toastId });
      }
  };

  return (
    <>
      {/* Hidden Contract for PDF Generation (A4 Size Fixed) */}
      <div 
        style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: 0, 
            width: '210mm', 
            minHeight: '297mm',
            zIndex: -100
        }}
      >
        <div 
            ref={contractRef} 
            className="w-[210mm] h-[297mm] p-[20mm] font-serif text-[12.5px] leading-relaxed relative box-border"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
        >
             {/* Identical Content to Admin View for PDF */}
             <div 
                className="border-[2px] py-3 px-2 text-center mb-6 shrink-0"
                style={{ borderColor: '#000000' }}
             >
                <h1 className="text-[18px] font-bold tracking-widest" style={{ color: '#000000' }}>표준근로계약서(기간의 정함이 있는 경우)</h1>
             </div>
             
             <p className="leading-7 mb-5 text-justify shrink-0" style={{ color: '#000000' }}>
                <span className="font-bold border-b inline-block min-w-[80px] text-center px-1" style={{ borderColor: '#000000' }}>{company.name}</span> (이하 "사업주"라 함)과(와) <span className="font-bold border-b inline-block min-w-[60px] text-center px-1" style={{ borderColor: '#000000' }}>{employeeName}</span> (이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.
             </p>

             <div className="space-y-3">
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">1.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">근로계약기간 :</span>
                    <span className="border-b pb-0.5 flex-1" style={{ borderColor: '#e2e8f0' }}>2026.01.02 ~ 2027.01.01</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">2.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">근 무 장 소 :</span>
                    <span className="flex-1">본사 사무실</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">3.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">업무의 내용 :</span>
                    <span className="flex-1">소프트웨어 개발 및 운영 지원</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">4.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">소정근로시간 :</span>
                    <span className="flex-1">13시 00분부터 16시 30분까지 (휴게시간 : 없음)</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">5.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">근무일/휴일 :</span>
                    <span className="flex-1">매주 5일(또는 매일단위)근무, 주휴일 매주 일요일</span>
                </div>
                <div>
                    <div className="flex items-baseline mb-1">
                        <span className="font-bold mr-1 w-5 shrink-0">6.</span>
                        <span className="font-bold mr-2 w-24 shrink-0">임  금</span>
                    </div>
                    <div className="pl-8 space-y-1">
                        <p className="flex items-center">
                        <span className="w-28" style={{ color: '#334155' }}>- 월(일, 시간)급 :</span>
                        <span className="font-bold border-b inline-block min-w-[100px] text-center px-2" style={{ borderColor: '#000000' }}>920,000</span> 
                        <span className="ml-1">원</span>
                        </p>
                        <div className="flex items-center gap-1">
                        <span className="w-28" style={{ color: '#334155' }}>- 상여금 :</span>
                        <span>있음 ( ) <span className="border-b inline-block w-12" style={{ borderColor: '#000000' }}></span> 원,</span>
                        <span>없음 ( V )</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <span className="w-28" style={{ color: '#334155' }}>- 기타급여(제수당) :</span>
                        <span>있음 ( ),</span>
                        <span>없음 ( V )</span>
                        </div>
                        <p className="flex items-center">
                        <span className="w-28" style={{ color: '#334155' }}>- 임금지급일 :</span>
                        <span>매월(매주 또는 매일)</span>
                        <span className="font-bold border-b inline-block w-6 text-center mx-1" style={{ borderColor: '#000000' }}>25</span>
                        <span>일(휴일의 경우는 전일 지급)</span>
                        </p>
                        <p className="flex items-center">
                        <span className="w-28" style={{ color: '#334155' }}>- 지급방법 :</span>
                        <span>근로자에게 직접지급( ),</span>
                        <span>예금통장에 입금( V )</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">7.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">연차유급휴가 :</span>
                    <span className="flex-1">근로기준법에서 정하는 바에 따라 부여함</span>
                </div>
                <div>
                    <div className="flex items-baseline mb-1">
                        <span className="font-bold mr-1 w-5 shrink-0">8.</span>
                        <span className="font-bold mr-2 shrink-0">사회보험 적용여부(해당란에 체크)</span>
                    </div>
                    <div className="pl-8 flex gap-4 text-[12.5px]">
                        <span className="flex items-center gap-1.5"><div className="border w-3.5 h-3.5 flex items-center justify-center" style={{ borderColor: '#000000' }}><Check className="h-3 w-3" color="#000000" /></div> 고용보험</span>
                        <span className="flex items-center gap-1.5"><div className="border w-3.5 h-3.5 flex items-center justify-center" style={{ borderColor: '#000000' }}><Check className="h-3 w-3" color="#000000" /></div> 산재보험</span>
                        <span className="flex items-center gap-1.5"><div className="border w-3.5 h-3.5 flex items-center justify-center" style={{ borderColor: '#000000' }}><Check className="h-3 w-3" color="#000000" /></div> 국민연금</span>
                        <span className="flex items-center gap-1.5"><div className="border w-3.5 h-3.5 flex items-center justify-center" style={{ borderColor: '#000000' }}><Check className="h-3 w-3" color="#000000" /></div> 건강보험</span>
                    </div>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">9.</span>
                    <span className="font-bold mr-2 w-28 shrink-0">근로계약서 교부 :</span>
                    <span className="leading-tight flex-1">사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자에게 교부함(근로기준법 제17조 이행)</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">10.</span>
                    <span className="font-bold mr-2 w-28 shrink-0">성실이행의무 :</span>
                    <span className="leading-tight flex-1">사업주와 근로자는 각자가 근로계약, 취업규칙, 단체협약을 지키고 성실하게 이행하여야 함</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">11.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">기  타 :</span>
                    <span className="flex-1">이 계약에 정함이 없는 사항은 근로기준법령에 의함</span>
                </div>
             </div>

             <div className="mt-8 pt-2 shrink-0">
                <div className="text-center mb-8">
                    <p className="text-[15px] font-bold tracking-[0.2em]" style={{ color: '#000000' }}>
                    {today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일
                    </p>
                </div>
                
                <div className="flex gap-x-8 text-[12px] justify-between">
                    <div className="flex-1">
                        <div className="flex gap-3">
                            <span className="font-bold shrink-0 pt-1 w-[50px] text-right text-[12.5px]">(사업주)</span>
                            <div className="flex-1 flex flex-col gap-1.5">
                                <div className="flex items-center">
                                    <span className="w-14 text-right mr-2" style={{ color: '#475569' }}>사업체명:</span>
                                    <span className="flex-1 border-b px-1 text-center text-[12.5px]" style={{ borderColor: '#000000' }}>{company.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-14 text-right mr-2" style={{ color: '#475569' }}>전화:</span>
                                    <span className="flex-1 border-b px-1 text-center text-[12.5px]" style={{ borderColor: '#000000' }}>{company.phone}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-14 text-right mr-2" style={{ color: '#475569' }}>주소:</span>
                                    <span className="flex-1 border-b px-1 truncate text-[11px] text-center" style={{ borderColor: '#000000' }}>{company.address}</span>
                                </div>
                                <div className="flex items-center relative h-10">
                                    <span className="w-14 text-right mr-2" style={{ color: '#475569' }}>대표자:</span>
                                    <span className="flex-1 border-b px-1 text-center font-medium text-[12.5px]" style={{ borderColor: '#000000' }}>{company.ceo}</span>
                                    <span className="ml-1 text-[11px] whitespace-nowrap" style={{ color: '#94a3b8' }}>(서명)</span>
                                    <div className="absolute right-2 top-[-10px] w-14 h-14 border-[3px] rounded-full flex items-center justify-center font-bold text-[10px] rotate-[-10deg] opacity-90 z-10" style={{ borderColor: '#dc2626', color: '#dc2626', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                        <div className="text-center leading-[1.1]">
                                            {company.name.split('(')[0]}<br/>대표이사<br/>의인
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex gap-3">
                            <span className="font-bold shrink-0 pt-1 w-[50px] text-right text-[12.5px]">(근로자)</span>
                            <div className="flex-1 flex flex-col gap-1.5">
                                <div className="flex items-center">
                                    <span className="w-12 text-right mr-2" style={{ color: '#475569' }}>주소:</span>
                                    <span className="flex-1 border-b px-1 truncate text-[11px] text-center" style={{ borderColor: '#000000' }}>서울시 마포구 양화로 456</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-12 text-right mr-2" style={{ color: '#475569' }}>연락처:</span>
                                    <span className="flex-1 border-b px-1 text-center text-[12.5px]" style={{ borderColor: '#000000' }}>010-0000-0000</span>
                                </div>
                                <div className="flex items-center h-10 relative">
                                    <span className="w-12 text-right mr-2" style={{ color: '#475569' }}>성명:</span>
                                    <span className="flex-1 border-b px-1 text-center font-medium text-[12.5px]" style={{ borderColor: '#000000' }}>{employeeName}</span>
                                    <span className="ml-1 text-[11px] whitespace-nowrap" style={{ color: '#94a3b8' }}>(서명)</span>
                                    {signatureDataUrl && (
                                        <div className="absolute right-0 top-0 w-16 h-10 z-10">
                                            <img src={signatureDataUrl} alt="서명" className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
      </div>

      {step === 'summary' && (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full gap-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold text-black tracking-tight mb-2">계약 요약</h1>
                    <p className="text-xl text-slate-600 font-medium">중요한 내용을 먼저 확인하세요</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-xl font-bold text-slate-500 mb-1">근로 기간 (Period)</p>
                        <p className="text-3xl font-black text-black">2026.01.02 ~ 2027.01.01</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-xl font-bold text-slate-500 mb-1">근로 시간 (Hours)</p>
                        <p className="text-3xl font-black text-black">13:00 ~ 16:30</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-xl font-bold text-slate-500 mb-1">급여 (Salary)</p>
                        <p className="text-3xl font-black text-black">920,000 원</p>
                    </div>
                </div>

                <div className="pt-8">
                    <Button 
                        className="w-full h-20 text-2xl font-black bg-[#00C950] hover:bg-[#009e3f] text-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                        onClick={() => setStep('full')}
                    >
                        서명하러 가기
                        <ArrowRight className="ml-3 h-8 w-8" />
                    </Button>
                </div>
            </div>
        </div>
      )}

      {step === 'full' && (
        <div className="min-h-screen bg-slate-100 flex justify-center">
            <div className="w-full max-w-md flex flex-col h-screen relative bg-white">
                {/* Sticky Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10 shrink-0 shadow-sm">
                    <h2 className="text-lg font-bold text-black">근로계약서 검토</h2>
                    <Button 
                        onClick={handleTTS}
                        variant="ghost"
                        size="sm"
                        className={`h-10 text-black hover:bg-slate-100 rounded-lg px-3 flex items-center gap-2 ${isSpeaking ? 'bg-green-50 hover:bg-green-100' : ''}`}
                    >
                        <Volume2 className={`h-5 w-5 ${isSpeaking ? 'text-green-600 animate-pulse' : ''}`} />
                        <span className="text-sm font-semibold">{isSpeaking ? '읽는 중...' : '읽어주기'}</span>
                    </Button>
                </header>

                {/* Scrollable Content - Replicating ContractDashboard Layout */}
                <ScrollArea className="flex-1 bg-slate-50">
                    <div className="p-4 sm:p-6 pb-32 flex justify-center">
                        <div className="bg-white shadow-lg border border-slate-200 p-6 sm:p-8 w-full text-slate-900 font-serif leading-relaxed text-sm">
                            
                            {/* Contract Header */}
                            <div className="border-[2px] border-black py-3 px-2 text-center mb-6 shrink-0">
                            <h1 className="text-[16px] font-bold tracking-widest text-black">표준근로계약서(기간의 정함이 있는 경우)</h1>
                            </div>

                            {/* Intro */}
                            <p className="leading-7 mb-5 text-justify">
                                <span className="font-bold border-b border-black inline-block min-w-[80px] text-center px-1">{company.name}</span> (이하 "사업주"라 함)과(와) <span className="font-bold border-b border-black inline-block min-w-[60px] text-center px-1">{employeeName}</span> (이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.
                            </p>

                            <div className="space-y-4">
                                {/* 1. 계약기간 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">1.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">근로계약기간 :</span>
                                    <span className="border-b border-slate-200 pb-0.5 flex-1">2026.01.02 ~ 2027.01.01</span>
                                </div>

                                {/* 2. 근무장소 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">2.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">근 무 장 소 :</span>
                                    <span className="flex-1">본사 사무실</span>
                                </div>

                                {/* 3. 업무내용 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">3.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">업무의 내용 :</span>
                                    <span className="flex-1">소프트웨어 개발 및 운영 지원</span>
                                </div>

                                {/* 4. 소정근로시간 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">4.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">소정근로시간 :</span>
                                    <span className="flex-1">13시 00분부터 16시 30분까지 (휴게시간 : 없음)</span>
                                </div>

                                {/* 5. 근무일/휴일 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">5.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">근무일/휴일 :</span>
                                    <span className="flex-1">매주 5일(또는 매일단위)근무, 주휴일 매주 일요일</span>
                                </div>

                                {/* 6. 임금 */}
                                <div>
                                    <div className="flex items-baseline mb-1">
                                        <span className="font-bold mr-1 w-5 shrink-0">6.</span>
                                        <span className="font-bold mr-2 w-24 shrink-0">임  금</span>
                                    </div>
                                    <div className="pl-6 space-y-1">
                                        <p className="flex flex-wrap items-center gap-1">
                                        <span className="text-slate-700">- 월(일, 시간)급 :</span>
                                        <span className="font-bold border-b border-black inline-block min-w-[80px] text-center px-1">920,000</span> 
                                        <span>원</span>
                                        </p>
                                        <p className="flex flex-wrap items-center gap-1">
                                        <span className="text-slate-700">- 상여금 :</span>
                                        <span>있음 ( ) <span className="border-b border-black inline-block w-8"></span> 원,</span>
                                        <span>없음 ( V )</span>
                                        </p>
                                        <p className="flex flex-wrap items-center gap-1">
                                        <span className="text-slate-700">- 기타급여(제수당) :</span>
                                        <span>있음 ( ),</span>
                                        <span>없음 ( V )</span>
                                        </p>
                                        <p className="flex flex-wrap items-center gap-1">
                                        <span className="text-slate-700">- 임금지급일 :</span>
                                        <span>매월(매주 또는 매일)</span>
                                        <span className="font-bold border-b border-black inline-block w-6 text-center mx-1">25</span>
                                        <span>일(휴일의 경우는 전일 지급)</span>
                                        </p>
                                        <p className="flex flex-wrap items-center gap-1">
                                        <span className="text-slate-700">- 지급방법 :</span>
                                        <span>근로자에게 직접지급( ),</span>
                                        <span>예금통장에 입금( V )</span>
                                        </p>
                                    </div>
                                </div>
                                
                                {/* 7. 연차 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">7.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">연차유급휴가 :</span>
                                    <span className="flex-1">근로기준법에서 정하는 바에 따라 부여함</span>
                                </div>

                                {/* 8. 사회보험 */}
                                <div>
                                    <div className="flex items-baseline mb-1">
                                        <span className="font-bold mr-1 w-5 shrink-0">8.</span>
                                        <span className="font-bold mr-2 shrink-0">사회보험 적용여부(해당란에 체크)</span>
                                    </div>
                                    <div className="pl-6 flex flex-wrap gap-2 text-[11px]">
                                        <span className="flex items-center gap-1"><div className="border border-black w-3 h-3 flex items-center justify-center"><Check className="h-2.5 w-2.5" /></div> 고용보험</span>
                                        <span className="flex items-center gap-1"><div className="border border-black w-3 h-3 flex items-center justify-center"><Check className="h-2.5 w-2.5" /></div> 산재보험</span>
                                        <span className="flex items-center gap-1"><div className="border border-black w-3 h-3 flex items-center justify-center"><Check className="h-2.5 w-2.5" /></div> 국민연금</span>
                                        <span className="flex items-center gap-1"><div className="border border-black w-3 h-3 flex items-center justify-center"><Check className="h-2.5 w-2.5" /></div> 건강보험</span>
                                    </div>
                                </div>
                                
                                {/* 9. 교부 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">9.</span>
                                    <span className="font-bold mr-2 w-28 shrink-0">근로계약서 교부 :</span>
                                    <span className="leading-tight flex-1">사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자에게 교부함(근로기준법 제17조 이행)</span>
                                </div>
                                
                                {/* 10. 이행의무 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">10.</span>
                                    <span className="font-bold mr-2 w-28 shrink-0">성실이행의무 :</span>
                                    <span className="leading-tight flex-1">사업주와 근로자는 각자가 근로계약, 취업규칙, 단체협약을 지키고 성실하게 이행하여야 함</span>
                                </div>

                                {/* 11. 기타 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">11.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">기  타 :</span>
                                    <span className="flex-1">이 계약에 정함이 없는 사항은 근로기준법령에 의함</span>
                                </div>
                            </div>

                            {/* Signatures Footer */}
                            <div className="mt-10 pt-2 shrink-0">
                                {/* Date */}
                                <div className="text-center mb-8">
                                    <p className="text-[15px] font-bold tracking-[0.2em]">
                                    {today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일
                                    </p>
                                </div>
                                
                                {/* Signatures */}
                                <div className="flex flex-col gap-6 text-[12px]">
                                    {/* Business Owner */}
                                    <div className="flex gap-2">
                                        <span className="font-bold shrink-0 pt-1 w-[50px] text-right">(사업주)</span>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex items-center">
                                                <span className="w-14 text-right mr-2 text-slate-600">사업체명:</span>
                                                <span className="flex-1 border-b border-black px-1 text-center">{company.name}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-14 text-right mr-2 text-slate-600">전화:</span>
                                                <span className="flex-1 border-b border-black px-1 text-center">{company.phone}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-14 text-right mr-2 text-slate-600">주소:</span>
                                                <span className="flex-1 border-b border-black px-1 truncate text-center">{company.address}</span>
                                            </div>
                                            <div className="flex items-center relative h-10">
                                                <span className="w-14 text-right mr-2 text-slate-600">대표자:</span>
                                                <span className="flex-1 border-b border-black px-1 text-center font-medium">{company.ceo}</span>
                                                <span className="ml-1 text-slate-400 text-[10px] whitespace-nowrap">(서명)</span>
                                                {/* Pre-signed for company */}
                                                <div className="absolute right-0 top-[-5px] w-12 h-12 border-[2px] border-red-600 rounded-full flex items-center justify-center text-red-600 font-bold text-[8px] rotate-[-10deg] opacity-90 mix-blend-multiply bg-white/20 pointer-events-none">
                                                    <div className="text-center leading-[1.1]">
                                                        {company.name.split('(')[0]}<br/>대표이사<br/>의인
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Worker */}
                                    <div className="flex gap-2">
                                        <span className="font-bold shrink-0 pt-1 w-[50px] text-right">(근로자)</span>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex items-center">
                                                <span className="w-14 text-right mr-2 text-slate-600">주소:</span>
                                                <span className="flex-1 border-b border-black px-1 truncate text-center">서울시 마포구 양화로 456</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-14 text-right mr-2 text-slate-600">연락처:</span>
                                                <span className="flex-1 border-b border-black px-1 text-center">010-0000-0000</span>
                                            </div>
                                            <div className="flex items-center h-10">
                                                <span className="w-14 text-right mr-2 text-slate-600">성명:</span>
                                                <span className="flex-1 border-b border-black px-1 text-center font-medium">{employeeName}</span>
                                                <span className="ml-1 text-slate-400 text-[10px] whitespace-nowrap">(서명)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </ScrollArea>

                {/* Fixed Bottom Bar */}
                <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
                    <div className="flex gap-3">
                        <Button 
                            variant="outline"
                            className="flex-1 h-14 text-lg font-bold border-slate-300 rounded-xl"
                            onClick={() => setStep('summary')}
                        >
                            이전
                        </Button>
                        <Button 
                            className="flex-[2] h-14 text-lg font-bold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-xl shadow-md"
                            onClick={() => setStep('signing')}
                        >
                            서명하기
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {step === 'signing' && (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 fixed inset-0 z-50">
            <h2 className="text-3xl font-black mb-4">서명해 주세요</h2>
            <p className="text-slate-500 mb-6 font-medium">손가락으로 이름을 적어주세요</p>
            
            <div className="w-full max-w-sm aspect-square bg-slate-50 border-4 border-black rounded-2xl mb-6 relative shadow-lg overflow-hidden touch-none">
                 <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                 />
                 
                 <div className="absolute top-4 right-4 flex gap-2">
                     <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full shadow-sm bg-white hover:bg-slate-100"
                        onClick={clearCanvas}
                     >
                        <Eraser className="h-5 w-5 text-slate-600" />
                     </Button>
                 </div>

                 {!isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <PenTool className="h-24 w-24 text-slate-400" />
                    </div>
                 )}
            </div>

            <Button 
                className="w-full max-w-sm h-20 text-3xl font-black bg-black text-white hover:bg-slate-800 rounded-2xl shadow-xl active:scale-[0.98] transition-transform"
                onClick={handleSignComplete}
            >
                서명 완료
            </Button>
            <Button 
                variant="ghost" 
                className="mt-6 text-xl font-bold text-slate-500"
                onClick={() => setStep('full')}
            >
                취소
            </Button>
        </div>
      )}

      {step === 'completed' && (
        <div className="min-h-screen bg-[rgb(255,255,255)] flex flex-col items-center justify-center p-8 text-white fixed inset-0 z-50">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-[#00C950] mb-8 shadow-xl animate-in zoom-in">
                <Check className="h-16 w-16 stroke-[4]" />
            </div>
            <h1 className="text-4xl font-black mb-4 text-center text-[32px] text-[rgb(0,0,0)]">계약이 완료되었습니다!</h1>
            <div className="w-full max-w-sm space-y-3">
                <Button
                    className="w-full h-16 text-xl font-bold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-2xl shadow-lg"
                    onClick={onWorkStart || onClose}
                >
                    근무 시작하기
                </Button>

                <Button
                    className="w-full h-14 text-lg font-bold bg-white/20 hover:bg-white/30 text-[rgb(0,0,0)] rounded-2xl shadow-lg backdrop-blur-sm border border-white/30"
                    onClick={handleDownloadPDF}
                >
                    <FileDown className="mr-2 h-5 w-5" />
                    계약서 PDF 저장
                </Button>

                <Button
                    variant="ghost"
                    className="w-full h-12 text-base text-slate-600"
                    onClick={onClose}
                >
                    나중에
                </Button>
            </div>
        </div>
      )}
    </>
  );
}
