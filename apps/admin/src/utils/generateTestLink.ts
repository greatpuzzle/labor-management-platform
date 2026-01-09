/**
 * 테스트 초대 링크 생성 유틸리티
 */

export interface TestLinkOptions {
  companyId: string;
  mobileAppUrl?: string;
  useInvitePage?: boolean;
}

/**
 * 테스트 초대 링크를 생성합니다.
 * 
 * @param options - 링크 생성 옵션
 * @returns 생성된 초대 링크
 */
export function generateTestInviteLink(options: TestLinkOptions): string {
  const {
    companyId,
    mobileAppUrl = import.meta.env.VITE_MOBILE_APP_URL || 'http://localhost:5174',
    useInvitePage = true,
  } = options;

  if (useInvitePage) {
    // invite.html 페이지를 통해 localStorage에 저장 후 리다이렉트
    return `${mobileAppUrl}/invite.html?invite=${companyId}`;
  } else {
    // 직접 모바일 앱으로 이동
    return `${mobileAppUrl}?invite=${companyId}`;
  }
}

/**
 * 여러 회사의 테스트 링크를 한번에 생성합니다.
 * 
 * @param companyIds - 회사 ID 배열
 * @param mobileAppUrl - 모바일 앱 URL (선택사항)
 * @returns 회사별 링크 맵
 */
export function generateMultipleTestLinks(
  companyIds: string[],
  mobileAppUrl?: string
): Record<string, string> {
  const links: Record<string, string> = {};
  
  companyIds.forEach(companyId => {
    links[companyId] = generateTestInviteLink({ companyId, mobileAppUrl });
  });
  
  return links;
}

/**
 * 테스트 링크를 클립보드에 복사합니다.
 * 
 * @param link - 복사할 링크
 * @returns 복사 성공 여부
 */
export async function copyTestLinkToClipboard(link: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(link);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy link to clipboard:', error);
    return false;
  }
}

