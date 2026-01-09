/**
 * 테스트 링크를 콘솔에 출력하는 유틸리티
 * 개발자 도구 콘솔에서 사용할 수 있습니다.
 */

import { generateTestInviteLink } from './generateTestLink';

/**
 * 현재 선택된 회사의 테스트 링크를 생성하고 출력합니다.
 * 
 * 사용법:
 * 1. 브라우저 개발자 도구 콘솔을 엽니다 (F12)
 * 2. 다음 명령어를 입력합니다:
 *    showTestLink('회사ID')
 * 
 * 예시:
 *    showTestLink('clx1234567890')
 */
export function showTestLink(companyId: string, mobileAppUrl?: string) {
  if (!companyId) {
    console.error('❌ 회사 ID가 필요합니다.');
    console.log('사용법: showTestLink("회사ID")');
    return;
  }

  const link = generateTestInviteLink({ companyId, mobileAppUrl });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 테스트 초대 링크');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('회사 ID:', companyId);
  console.log('링크:', link);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 이 링크를 복사하여 모바일 브라우저에서 열어보세요.');
  console.log('💡 또는 개발자 도구에서 이 링크를 클릭하여 새 탭에서 열 수 있습니다.');
  
  // 클립보드에 복사 시도
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      console.log('✅ 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      console.log('⚠️  클립보드 복사에 실패했습니다. 링크를 수동으로 복사해주세요.');
    });
  }
  
  return link;
}

/**
 * 여러 회사의 테스트 링크를 한번에 출력합니다.
 */
export function showMultipleTestLinks(companyIds: string[], mobileAppUrl?: string) {
  if (!companyIds || companyIds.length === 0) {
    console.error('❌ 회사 ID 배열이 필요합니다.');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 테스트 초대 링크 목록');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  companyIds.forEach((companyId, index) => {
    const link = generateTestInviteLink({ companyId, mobileAppUrl });
    console.log(`${index + 1}. 회사 ID: ${companyId}`);
    console.log(`   링크: ${link}`);
    console.log('');
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 전역 함수로 등록 (개발자 도구에서 사용 가능하도록)
if (typeof window !== 'undefined') {
  (window as any).showTestLink = showTestLink;
  (window as any).showMultipleTestLinks = showMultipleTestLinks;
  
  console.log('💡 테스트 링크 유틸리티가 로드되었습니다!');
  console.log('사용법: showTestLink("회사ID")');
}

