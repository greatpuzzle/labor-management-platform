import React, { useState, useRef, useEffect } from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Volume2, Check, ArrowRight, Eraser, PenTool, FileDown } from "lucide-react";
import { toast } from "sonner";
import { companies } from '@shared/data';
import { api } from '@shared/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EmployeeContractAppProps {
  contract?: any;
  onClose: () => void;
  onWorkStart?: () => void;
  employeeName?: string;
}

export function EmployeeContractApp({ contract, onClose, onWorkStart, employeeName = "홍길동" }: EmployeeContractAppProps) {
  // Props 디버깅
  useEffect(() => {
    console.log('[EmployeeContractApp] Props:', {
      hasContract: !!contract,
      hasOnClose: !!onClose,
      hasOnWorkStart: !!onWorkStart,
      employeeName
    });
  }, [contract, onClose, onWorkStart, employeeName]);
  
  const [step, setStep] = useState<'summary' | 'full' | 'signing' | 'completed'>('summary');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const [signedContractImage, setSignedContractImage] = useState<string | null>(null);

  // Data for contract
  const today = new Date();
  // 계약서에서 회사 정보 및 계약 정보 가져오기
  const company = contract?.employee?.company || companies.find(c => c.id === 'c4') || companies[0];
  const contractEmployeeName = contract?.employee?.name || employeeName;
  const contractPeriod = contract?.contractPeriod || contract?.employee?.contractPeriod || '2026.01.02 ~ 2027.01.01';
  const contractWorkingHours = contract?.workingHours || contract?.employee?.workingHours || '13시 00분부터 16시 30분까지 (휴게시간 : 없음)';
  const contractSalary = contract?.salary || contract?.employee?.salary || '920,000';
  const contractAdditionalTerms = contract?.additionalTerms || contract?.employee?.additionalTerms || '';

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
      
      ${company.name} 이하 사업주라 함과 ${contractEmployeeName} 이하 근로자라 함은 다음과 같이 근로계약을 체결합니다.
      
      첫째, 근로계약기간은 ${contractPeriod}입니다.
      
      둘째, 근무 장소는 본사 지정장소입니다.
      
      셋째, 업무의 내용은 소프트웨어 개발 및 운영 지원입니다.
      
      넷째, 소정근로시간은 ${contractWorkingHours}입니다.
      
      다섯째, 근무일과일은 매주 5일 또는 매일단위 근무이며, 주휴일은 매주 일요일입니다.
      
      여섯째, 임금에 대해 설명드리겠습니다.
      월급은 ${contractSalary.replace(/원/g, '').replace(/,/g, '')}원입니다.
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
      
      근로자는 ${contractEmployeeName}입니다.
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

  const handleSignComplete = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
          toast.error('서명을 완료해주세요.');
          return;
      }

      // 계약 정보 확인
      if (!contract || !contract.employee || !contract.employee.id) {
          toast.error('계약서 정보를 찾을 수 없습니다.');
          return;
      }

      // 서명 데이터 저장
      const signatureDataUrlValue = canvas.toDataURL('image/png');
      const signatureBase64 = signatureDataUrlValue.split(',')[1]; // base64 데이터만 추출
      
      // 서명 이미지를 state에 먼저 저장 (숨겨진 계약서에서 사용)
      setSignatureDataUrl(signatureDataUrlValue);

      const toastId = toast.loading('계약서 서명 중...');

      try {
          // 계약서 PDF 생성 (A4 형식)
          if (!contractRef.current) {
              throw new Error('계약서 요소를 찾을 수 없습니다.');
          }

          // 숨겨진 계약서를 표시하여 서명 이미지 포함
          contractRef.current.style.display = 'block';
          contractRef.current.style.visibility = 'visible';
          
          // 서명 이미지를 숨겨진 계약서의 근로자 서명 영역에 직접 삽입
          const signatureImgElement = contractRef.current.querySelector('.signature-img') as HTMLImageElement;
          if (signatureImgElement) {
              signatureImgElement.src = signatureDataUrlValue;
              signatureImgElement.style.display = 'block';
              
              // 이미지가 완전히 로드될 때까지 기다림
              await new Promise<void>((resolve, reject) => {
                  const timeout = setTimeout(() => {
                      reject(new Error('서명 이미지 로드 타임아웃'));
                  }, 3000);
                  
                  if (signatureImgElement.complete) {
                      clearTimeout(timeout);
                      resolve();
                  } else {
                      signatureImgElement.onload = () => {
                          clearTimeout(timeout);
                          resolve();
                      };
                      signatureImgElement.onerror = () => {
                          clearTimeout(timeout);
                          reject(new Error('서명 이미지 로드 실패'));
                      };
                  }
              });
          } else {
              // 서명 이미지 요소가 없으면 생성하여 추가
              const signatureContainer = contractRef.current.querySelector('.flex.items-center.h-10.relative') as HTMLElement;
              if (signatureContainer) {
                  const img = document.createElement('img');
                  img.src = signatureDataUrlValue;
                  img.alt = '서명';
                  img.className = 'absolute right-0 top-0 w-16 h-10 z-10 object-contain mix-blend-multiply signature-img';
                  img.style.display = 'block';
                  
                  // 이미지가 완전히 로드된 후에 DOM에 추가
                  await new Promise<void>((resolve, reject) => {
                      const timeout = setTimeout(() => {
                          reject(new Error('서명 이미지 로드 타임아웃'));
                      }, 3000);
                      
                      img.onload = () => {
                          clearTimeout(timeout);
                          signatureContainer.appendChild(img);
                          resolve();
                      };
                      img.onerror = () => {
                          clearTimeout(timeout);
                          reject(new Error('서명 이미지 로드 실패'));
                      };
                  });
              }
          }
          
          // 추가 안정성을 위한 짧은 대기 (DOM 렌더링 완료 보장)
          await new Promise(resolve => setTimeout(resolve, 200));

          // 실제 요소 크기를 픽셀로 명시적으로 설정하여 정확한 A4 크기로 캡처
          // 1mm = 3.779527559px (96 DPI 기준)
          const mmToPx = 3.779527559;
          const a4WidthPx = 210 * mmToPx; // 약 794px
          const a4HeightPx = 297 * mmToPx; // 약 1123px
          
          // 요소를 픽셀 단위로 명시적으로 설정
          const originalWidth = contractRef.current.style.width;
          const originalHeight = contractRef.current.style.minHeight;
          contractRef.current.style.width = `${a4WidthPx}px`;
          contractRef.current.style.minHeight = `${a4HeightPx}px`;
          contractRef.current.style.height = `${a4HeightPx}px`;
          
          // 렌더링 완료 대기
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const contractCanvas = await html2canvas(contractRef.current, {
              scale: 3, // 고해상도 유지
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              allowTaint: false,
              onclone: (clonedDoc) => {
                  // 복제된 문서에서도 서명 이미지가 표시되도록 확인
                  const clonedSignatureImg = clonedDoc.querySelector('.signature-img') as HTMLImageElement;
                  if (clonedSignatureImg && signatureDataUrlValue) {
                      clonedSignatureImg.src = signatureDataUrlValue;
                      clonedSignatureImg.style.display = 'block';
                  }
              }
          });
          
          // 원래 크기로 복원
          contractRef.current.style.width = originalWidth;
          contractRef.current.style.minHeight = originalHeight;
          contractRef.current.style.height = '';

          // PNG로 고품질 유지
          const imgData = contractCanvas.toDataURL('image/png', 1.0);
          setSignedContractImage(imgData);

          // PDF 생성 (A4 형식) - A4 용지에 딱 맞게 저장
          const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
              compress: true
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
          const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
          
          // 캡처된 이미지 크기 확인
          const img = new Image();
          img.src = imgData;
          
          await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                  reject(new Error('이미지 로드 타임아웃'));
              }, 5000);
              
              if (img.complete) {
                  clearTimeout(timeout);
                  resolve();
              } else {
                  img.onload = () => {
                      clearTimeout(timeout);
                      resolve();
                  };
                  img.onerror = () => {
                      clearTimeout(timeout);
                      reject(new Error('이미지 로드 실패'));
                  };
              }
          });
          
          // A4 비율 계산 (210:297 = 0.7070707...)
          const a4Ratio = pdfWidth / pdfHeight; // 0.707
          const imgRatio = img.width / img.height;
          
          // 이미지를 A4 용지에 딱 맞게 배치 (비율 유지)
          let finalWidth = pdfWidth;
          let finalHeight = pdfHeight;
          
          // 이미지 비율이 A4와 거의 같지만 정확히 맞추기 위해 조정
          if (Math.abs(imgRatio - a4Ratio) > 0.001) {
              if (imgRatio > a4Ratio) {
                  // 이미지가 더 넓음 - 높이에 맞춤
                  finalHeight = pdfWidth / imgRatio;
                  finalWidth = pdfWidth;
              } else {
                  // 이미지가 더 높음 - 너비에 맞춤
                  finalWidth = pdfHeight * imgRatio;
                  finalHeight = pdfHeight;
              }
          }
          
          // A4 중앙에 배치 (비율이 정확히 맞으면 오프셋은 0)
          const xOffset = (pdfWidth - finalWidth) / 2;
          const yOffset = (pdfHeight - finalHeight) / 2;
          
          // 이미지를 A4 용지에 딱 맞게 추가 (비율 유지)
          pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
          
          // PDF 메타데이터 설정
          pdf.setProperties({
              title: '근로계약서',
              subject: '표준근로계약서(기간의 정함이 있는 경우)',
              author: company.name,
              creator: '장애인 근로관리 시스템'
          });
          
          // PDF를 Blob으로 먼저 생성 (메모리 효율)
          const pdfBlob = pdf.output('blob');
          
          // Blob을 base64로 변환
          const pdfBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  // data:application/pdf;base64, 부분 제거
                  const base64String = result.includes(',') ? result.split(',')[1] : result;
                  resolve(base64String);
              };
              reader.onerror = (error) => {
                  console.error('PDF Blob 읽기 실패:', error);
                  reject(error);
              };
              reader.readAsDataURL(pdfBlob);
          });

          // 계약서 서명 API 호출 (contractId 사용)
          if (!contract || !contract.id) {
              throw new Error('계약서 ID를 찾을 수 없습니다.');
          }
          
          const result = await api.signContract(
              contract.id,
              signatureBase64,
              pdfBase64
          );

          console.log('✅ 계약서 서명 완료:', result);
          
          // 서명 완료 상태로 전환
          setStep('completed');
          
          toast.success('계약서 서명이 완료되었습니다!', { id: toastId });
      } catch (error: any) {
          console.error('계약서 서명 실패:', error);
          toast.error(error.response?.data?.message || '계약서 서명에 실패했습니다.', { id: toastId });
      } finally {
          // 계약서 요소 다시 숨김
          if (contractRef.current) {
              contractRef.current.style.display = 'none';
              contractRef.current.style.visibility = 'hidden';
          }
      }
  };

  const handleDownloadPDF = async () => {
      const toastId = toast.loading("PDF 생성 중...");
      
      try {
          let imgData: string;
          
          // 서명 완료된 이미지가 있으면 사용, 없으면 새로 생성
          if (signedContractImage) {
              // 이미 서명 완료된 이미지 사용
              imgData = signedContractImage;
          } else if (contractRef.current && signatureDataUrl) {
              // 계약서와 서명을 포함하여 새로 생성
              contractRef.current.style.display = 'block';
              contractRef.current.style.visibility = 'visible';
              
              // 서명 이미지를 포함
              const signatureImgElement = contractRef.current.querySelector('.signature-img') as HTMLImageElement;
              if (signatureImgElement) {
                  signatureImgElement.src = signatureDataUrl;
                  signatureImgElement.style.display = 'block';
              }
              
              // 렌더링 완료 대기
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // 실제 요소 크기를 픽셀로 명시적으로 설정하여 정확한 A4 크기로 캡처
              // 1mm = 3.779527559px (96 DPI 기준)
              const mmToPx = 3.779527559;
              const a4WidthPx = 210 * mmToPx; // 약 794px
              const a4HeightPx = 297 * mmToPx; // 약 1123px
              
              // 요소를 픽셀 단위로 명시적으로 설정
              const originalWidth = contractRef.current.style.width;
              const originalHeight = contractRef.current.style.minHeight;
              contractRef.current.style.width = `${a4WidthPx}px`;
              contractRef.current.style.minHeight = `${a4HeightPx}px`;
              contractRef.current.style.height = `${a4HeightPx}px`;
              
              // 렌더링 완료 대기
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // A4 형식으로 고해상도 캡처 (A4 크기에 맞게 정확히 캡처)
              const canvas = await html2canvas(contractRef.current, {
                  scale: 3, // 고해상도 유지
                  useCORS: true,
                  logging: false,
                  backgroundColor: '#ffffff',
                  allowTaint: false,
                  onclone: (clonedDoc) => {
                      const clonedSignatureImg = clonedDoc.querySelector('.signature-img') as HTMLImageElement;
                      if (clonedSignatureImg && signatureDataUrl) {
                          clonedSignatureImg.src = signatureDataUrl;
                          clonedSignatureImg.style.display = 'block';
                      }
                  }
              });
              
              imgData = canvas.toDataURL('image/png', 1.0);
              
              // 원래 크기로 복원 후 숨김
              contractRef.current.style.width = originalWidth;
              contractRef.current.style.minHeight = originalHeight;
              contractRef.current.style.height = '';
              contractRef.current.style.display = 'none';
              contractRef.current.style.visibility = 'hidden';
          } else {
              toast.error('계약서 정보를 불러올 수 없습니다.', { id: toastId });
              return;
          }
          
          // PDF 생성 (A4 형식) - A4 용지에 딱 맞게 저장
          const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
              compress: true
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
          const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
          
          // 캡처된 이미지 크기 확인
          const img = new Image();
          img.src = imgData;
          
          await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                  reject(new Error('이미지 로드 타임아웃'));
              }, 5000);
              
              if (img.complete) {
                  clearTimeout(timeout);
                  resolve();
              } else {
                  img.onload = () => {
                      clearTimeout(timeout);
                      resolve();
                  };
                  img.onerror = () => {
                      clearTimeout(timeout);
                      reject(new Error('이미지 로드 실패'));
                  };
              }
          });
          
          // A4 비율 계산 (210:297 = 0.7070707...)
          const a4Ratio = pdfWidth / pdfHeight; // 0.707
          const imgRatio = img.width / img.height;
          
          // 이미지를 A4 용지에 딱 맞게 배치 (비율 유지)
          let finalWidth = pdfWidth;
          let finalHeight = pdfHeight;
          
          // 이미지 비율이 A4와 거의 같지만 정확히 맞추기 위해 조정
          if (Math.abs(imgRatio - a4Ratio) > 0.001) {
              if (imgRatio > a4Ratio) {
                  // 이미지가 더 넓음 - 높이에 맞춤
                  finalHeight = pdfWidth / imgRatio;
                  finalWidth = pdfWidth;
              } else {
                  // 이미지가 더 높음 - 너비에 맞춤
                  finalWidth = pdfHeight * imgRatio;
                  finalHeight = pdfHeight;
              }
          }
          
          // A4 중앙에 배치 (비율이 정확히 맞으면 오프셋은 0)
          const xOffset = (pdfWidth - finalWidth) / 2;
          const yOffset = (pdfHeight - finalHeight) / 2;
          
          // 이미지를 A4 용지에 딱 맞게 추가 (비율 유지)
          pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
          
          // PDF 메타데이터 설정
          pdf.setProperties({
              title: '근로계약서',
              subject: '표준근로계약서(기간의 정함이 있는 경우)',
              author: company.name,
              creator: '장애인 근로관리 시스템'
          });
          
          pdf.save(`${contractEmployeeName}_근로계약서.pdf`);
          toast.success("계약서가 다운로드되었습니다.", { id: toastId });
      } catch (error: any) {
          console.error("PDF generation failed", error);
          toast.error(error.message || "다운로드에 실패했습니다.", { id: toastId });
      }
  };


  return (
    <>
      {/* Hidden Contract for PDF Generation (A4 Size Fixed) */}
      <div 
        style={{ 
            position: 'fixed', 
            left: '-9999px', 
            top: 0, 
            width: '210mm', 
            minHeight: '297mm',
            zIndex: -100,
            visibility: 'hidden'
        }}
      >
        <div 
            ref={contractRef} 
            className="font-serif text-[12.5px] relative box-border"
            style={{ 
                width: '210mm',
                minHeight: '297mm',
                padding: '30mm 30mm 15mm 30mm',
                backgroundColor: '#ffffff', 
                color: '#000000',
                display: 'none' // 기본적으로 숨김
            }}
        >
             {/* Identical Content to Admin View for PDF */}
             <div 
                className="border-[2px] py-3 px-2 text-center mb-6 shrink-0"
                style={{ borderColor: '#000000' }}
             >
                <h1 className="text-[18px] font-bold tracking-widest" style={{ color: '#000000' }}>표준근로계약서(기간의 정함이 있는 경우)</h1>
             </div>
             
             <p className="mb-5 text-justify shrink-0" style={{ color: '#000000', lineHeight: '2' }}>
                <span className="font-bold border-b inline-block min-w-[80px] text-center px-1" style={{ borderColor: '#000000' }}>{company.name}</span> (이하 "사업주"라 함)과(와) <span className="font-bold border-b inline-block min-w-[60px] text-center px-1" style={{ borderColor: '#000000' }}>{contractEmployeeName}</span> (이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.
             </p>

             <div className="space-y-5" style={{ lineHeight: '1.9' }}>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">1.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">근로계약기간 :</span>
                    <span className="border-b pb-0.5 flex-1" style={{ borderColor: '#e2e8f0' }}>{contractPeriod}</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">2.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">근 무 장 소 :</span>
                    <span className="flex-1">본사 지정장소</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">3.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">업무의 내용 :</span>
                    <span className="flex-1">소프트웨어 개발 및 운영 지원</span>
                </div>
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">4.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">소정근로시간 :</span>
                    <span className="flex-1">{contractWorkingHours}</span>
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
                        <span className="font-bold border-b inline-block min-w-[100px] text-center px-2" style={{ borderColor: '#000000' }}>{contractSalary.replace(/원/g, '').replace(/,/g, '').trim()}</span> 
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
                {contractAdditionalTerms && (
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">11.</span>
                    <span className="font-bold mr-2 w-24 shrink-0">추가사항 :</span>
                    <span className="flex-1 whitespace-pre-line">{contractAdditionalTerms}</span>
                </div>
                )}
                <div className="flex items-baseline">
                    <span className="font-bold mr-1 w-5 shrink-0">{contractAdditionalTerms ? '12.' : '11.'}</span>
                    <span className="font-bold mr-2 w-24 shrink-0">기  타 :</span>
                    <span className="flex-1">이 계약에 정함이 없는 사항은 근로기준법령에 의함</span>
                </div>
             </div>

             <div className="mt-4 pt-2 shrink-0" style={{ marginTop: '1rem' }}>
                <div className="text-center mb-4" style={{ marginBottom: '1rem' }}>
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
                                    <span className="flex-1 border-b px-1 text-center font-medium text-[12.5px]" style={{ borderColor: '#000000' }}>{contractEmployeeName}</span>
                                    <span className="ml-1 text-[11px] whitespace-nowrap" style={{ color: '#94a3b8' }}>(서명)</span>
                                    {/* 서명 이미지 요소를 항상 렌더링하여 html2canvas에서 캡처할 수 있도록 함 */}
                                    <img 
                                        src={signatureDataUrl || ''} 
                                        alt="서명" 
                                        className="absolute right-0 top-0 w-16 h-10 z-10 object-contain mix-blend-multiply signature-img"
                                        style={{ display: signatureDataUrl ? 'block' : 'none' }}
                                    />
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
            <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full py-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-black mb-2">계약 요약</h1>
                    <p className="text-base text-slate-500">중요한 내용을 먼저 확인하세요</p>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <p className="text-sm text-slate-500 mb-2">근로 기간 (Period)</p>
                        <p className="text-xl font-semibold text-black">{contractPeriod}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <p className="text-sm text-slate-500 mb-2">근로 시간 (Hours)</p>
                        <p className="text-xl font-semibold text-black">{contractWorkingHours}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <p className="text-sm text-slate-500 mb-2">급여 (Salary)</p>
                        <p className="text-xl font-semibold text-black">{contractSalary} 원</p>
                    </div>
                </div>

                <div className="mt-auto">
                    <Button 
                        className="w-full h-14 text-lg font-semibold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-lg shadow-sm transition-all"
                        onClick={() => setStep('full')}
                    >
                        서명하러 가기
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
      )}

      {step === 'full' && (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="w-full flex flex-col h-screen relative">
                {/* Sticky Header */}
                <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm shrink-0">
                    <h2 className="text-base font-bold text-black">근로계약서 검토</h2>
                    <Button
                        onClick={handleTTS}
                        variant="ghost"
                        size="sm"
                        className={`h-9 px-3 flex items-center gap-2 ${isSpeaking ? 'bg-green-50' : ''}`}
                    >
                        <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-green-600 animate-pulse' : ''}`} />
                        <span className="text-sm font-medium">{isSpeaking ? '중지' : '읽어주기'}</span>
                    </Button>
                </header>

                 {/* Scrollable Content - Clean A4 Style */}
                 <ScrollArea className="flex-1">
                     <div className="flex justify-center p-4 pb-32">
                         <div className="bg-white shadow-lg border border-slate-200 px-[20mm] py-[15mm] text-slate-900 font-serif" style={{ width: '210mm', minHeight: '297mm' }}>

                            {/* Contract Header */}
                            <div className="border-[2px] border-black py-3 px-2 text-center mb-6 shrink-0">
                                <h1 className="text-[18px] font-bold tracking-widest text-black">표준근로계약서(기간의 정함이 있는 경우)</h1>
                            </div>
                            
                            {/* Main Content Area */}
                            <div className="flex flex-col justify-start gap-1">
                                <p className="leading-7 mb-5 text-[12.5px] text-justify shrink-0">
                                    <span className="font-bold border-b border-black inline-block min-w-[80px] text-center px-1">{company.name}</span> (이하 "사업주"라 함)과(와) <span className="font-bold border-b border-black inline-block min-w-[60px] text-center px-1">{contractEmployeeName}</span> (이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.
                                </p>

                            <div className="space-y-5 text-[12.5px] leading-7">
                                {/* 1. 계약기간 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">1.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">근로계약기간 :</span>
                                    <span className="border-b border-slate-200 pb-0.5 flex-1">{contractPeriod}</span>
                                </div>

                                {/* 2. 근무장소 */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">2.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">근 무 장 소 :</span>
                                    <span className="flex-1">본사 지정장소</span>
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
                                    <span className="flex-1">{contractWorkingHours}</span>
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
                                    <div className="pl-8 space-y-1">
                                        <p className="flex items-center">
                                            <span className="w-28 text-slate-700">- 월(일, 시간)급 :</span>
                                            <span className="font-bold border-b border-black inline-block min-w-[100px] text-center px-2">{contractSalary.replace(/원/g, '').replace(/,/g, '').trim()}</span>
                                            <span className="ml-1">원</span>
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <span className="w-28 text-slate-700">- 상여금 :</span>
                                            <span className="text-[12.5px]">있음 ( ) <span className="border-b border-black inline-block w-12"></span> 원,</span>
                                            <span className="text-[12.5px]">없음 ( V )</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-28 text-slate-700">- 기타급여(제수당) :</span>
                                            <span className="text-[12.5px]">있음 ( ),</span>
                                            <span className="text-[12.5px]">없음 ( V )</span>
                                        </div>
                                        <p className="flex items-center">
                                            <span className="w-28 text-slate-700">- 임금지급일 :</span>
                                            <span className="text-[12.5px]">매월(매주 또는 매일)</span>
                                            <span className="font-bold border-b border-black inline-block w-6 text-center mx-1">25</span>
                                            <span className="text-[12.5px]">일(휴일의 경우는 전일 지급)</span>
                                        </p>
                                        <p className="flex items-center">
                                            <span className="w-28 text-slate-700">- 지급방법 :</span>
                                            <span className="text-[12.5px]">근로자에게 직접지급( ),</span>
                                            <span className="text-[12.5px]">예금통장에 입금( V )</span>
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
                                    <div className="pl-8 flex gap-4 text-[12.5px]">
                                        <span className="flex items-center gap-1.5">
                                            <div className="border border-black w-3.5 h-3.5 flex items-center justify-center">
                                                <Check className="h-3 w-3" />
                                            </div> 고용보험
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="border border-black w-3.5 h-3.5 flex items-center justify-center">
                                                <Check className="h-3 w-3" />
                                            </div> 산재보험
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="border border-black w-3.5 h-3.5 flex items-center justify-center">
                                                <Check className="h-3 w-3" />
                                            </div> 국민연금
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="border border-black w-3.5 h-3.5 flex items-center justify-center">
                                                <Check className="h-3 w-3" />
                                            </div> 건강보험
                                        </span>
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

                                {/* 추가사항 (10번과 11번 사이) */}
                                {contractAdditionalTerms && (
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">11.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">추가사항 :</span>
                                    <span className="flex-1 whitespace-pre-line">{contractAdditionalTerms}</span>
                                </div>
                                )}

                                {/* 기타 (추가사항이 있으면 12번, 없으면 11번) */}
                                <div className="flex items-baseline">
                                    <span className="font-bold mr-1 w-5 shrink-0">{contractAdditionalTerms ? '12.' : '11.'}</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">기  타 :</span>
                                    <span className="flex-1">이 계약에 정함이 없는 사항은 근로기준법령에 의함</span>
                                </div>
                                </div>
                            </div>

                            {/* Signatures Footer */}
                            <div className="mt-8 pt-2 shrink-0">
                                {/* Date */}
                                <div className="text-center mb-8">
                                    <p className="text-[15px] font-bold tracking-[0.2em]">
                                        {today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일
                                    </p>
                                </div>

                                {/* Signatures - Horizontal Layout */}
                                <div className="flex gap-x-8 text-[12px] justify-between">
                                    {/* Business Owner */}
                                    <div className="flex-1">
                                        <div className="flex gap-3">
                                            <span className="font-bold shrink-0 pt-1 w-[50px] text-right text-[12.5px]">(사업주)</span>
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="flex items-center">
                                                    <span className="w-14 text-right mr-2 text-slate-600">사업체명:</span>
                                                    <span className="flex-1 border-b border-black px-1 text-center text-[12.5px]">{company.name}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-14 text-right mr-2 text-slate-600">전화:</span>
                                                    <span className="flex-1 border-b border-black px-1 text-center text-[12.5px]">{company.phone}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-14 text-right mr-2 text-slate-600">주소:</span>
                                                    <span className="flex-1 border-b border-black px-1 truncate text-[11px] text-center">{company.address}</span>
                                                </div>
                                                <div className="flex items-center relative h-10">
                                                    <span className="w-14 text-right mr-2 text-slate-600">대표자:</span>
                                                    <span className="flex-1 border-b border-black px-1 text-center font-medium text-[12.5px]">{company.ceo}</span>
                                                    <span className="ml-1 text-slate-400 text-[11px] whitespace-nowrap">(서명)</span>
                                                    {/* Pre-signed stamp */}
                                                    <div className="absolute right-2 top-[-10px] w-14 h-14 border-[3px] border-red-600 rounded-full flex items-center justify-center text-red-600 font-bold text-[10px] rotate-[-10deg] opacity-90 z-10 bg-white/20">
                                                        <div className="text-center leading-[1.1]">
                                                            {company.name.split('(')[0]}<br/>대표이사<br/>의인
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Worker */}
                                    <div className="flex-1">
                                        <div className="flex gap-3">
                                            <span className="font-bold shrink-0 pt-1 w-[50px] text-right text-[12.5px]">(근로자)</span>
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="flex items-center">
                                                    <span className="w-12 text-right mr-2 text-slate-600">주소:</span>
                                                    <span className="flex-1 border-b border-black px-1 truncate text-[11px] text-center">서울시 마포구 양화로 456</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-12 text-right mr-2 text-slate-600">연락처:</span>
                                                    <span className="flex-1 border-b border-black px-1 text-center text-[12.5px]">010-0000-0000</span>
                                                </div>
                                                <div className="flex items-center h-10">
                                                    <span className="w-12 text-right mr-2 text-slate-600">성명:</span>
                                                    <span className="flex-1 border-b border-black px-1 text-center font-medium text-[12.5px]">{contractEmployeeName}</span>
                                                    <span className="ml-1 text-slate-400 text-[11px] whitespace-nowrap">(서명)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </ScrollArea>

                {/* Fixed Bottom Bar */}
                <div className="sticky bottom-0 left-0 right-0 w-full p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 shrink-0">
                    <div className="flex gap-3 max-w-md mx-auto">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 text-base font-semibold border-slate-300 rounded-xl"
                            onClick={() => setStep('summary')}
                        >
                            이전
                        </Button>
                        <Button
                            className="flex-[2] h-12 text-base font-semibold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-xl shadow-md"
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
                    type="button"
                    className="w-full h-16 text-xl font-bold bg-[#00C950] hover:bg-[#009e3f] text-white rounded-2xl shadow-lg"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('[EmployeeContractApp] 근무 시작하기 버튼 클릭됨');
                        console.log('[EmployeeContractApp] onWorkStart:', onWorkStart);
                        console.log('[EmployeeContractApp] onClose:', onClose);
                        
                        if (onWorkStart) {
                            console.log('[EmployeeContractApp] onWorkStart 호출 시작');
                            try {
                                onWorkStart();
                                console.log('[EmployeeContractApp] onWorkStart 호출 완료');
                            } catch (error) {
                                console.error('[EmployeeContractApp] onWorkStart 호출 중 오류:', error);
                            }
                        } else {
                            console.warn('[EmployeeContractApp] onWorkStart가 정의되지 않음, onClose 호출');
                            onClose();
                        }
                    }}
                >
                    근무 시작하기
                </Button>

                <Button
                    className="w-full h-14 text-base font-bold bg-white/20 hover:bg-white/30 text-[rgb(0,0,0)] rounded-2xl shadow-lg backdrop-blur-sm border border-white/30"
                    onClick={handleDownloadPDF}
                >
                    <FileDown className="mr-1 h-5 w-5" />
                    PDF 다운로드
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
