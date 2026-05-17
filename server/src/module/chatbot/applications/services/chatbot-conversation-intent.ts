export type SimpleChatbotIntent = 'greeting' | 'identity' | 'thanks' | 'out_of_scope';

export interface SimpleChatbotReply {
  content: string;
  lastIntent: SimpleChatbotIntent;
  lastSummary: string;
}

const NORMALIZED_PRODUCT_INTENT_KEYWORDS = [
  'ao',
  'quan',
  'dam',
  'hoodie',
  'blazer',
  'jacket',
  'giay',
  'tui',
  'balo',
  'outfit',
  'phoi do',
  'set do',
  'mac',
  'di lam',
  'di choi',
  'du tiec',
  'the thao',
  'ngan sach',
  'budget',
  'size',
  'mau',
  'gia',
  'duoi',
  'goi y',
  'tim',
  'mua',
  'mau khac',
  'them mau',
  'san pham',
];

const ACCENTED_PRODUCT_INTENT_KEYWORDS = [
  'áo',
  'quần',
  'váy',
  'đầm',
  'giày',
  'túi',
  'mũ',
  'nón',
  'màu',
  'giá',
  'dưới',
  'gợi ý',
  'tìm',
  'mua',
  'sản phẩm',
];

const OUT_OF_SCOPE_KEYWORDS = [
  'sex toy',
  'sextoy',
  'do choi tinh duc',
  'do choi nguoi lon',
  'bao cao su',
  'gel boi tron',
  'ma tuy',
  'vu khi',
];

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTextKeepingAccents(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasFashionShoppingIntent(message: string): boolean {
  const accentedMessage = normalizeTextKeepingAccents(message);
  const paddedAccentedMessage = ` ${accentedMessage} `;
  const hasAccentedProductIntent = ACCENTED_PRODUCT_INTENT_KEYWORDS.some((keyword) =>
    paddedAccentedMessage.includes(` ${keyword} `),
  );
  if (hasAccentedProductIntent) return true;

  const normalizedMessage = normalizeText(message);
  const paddedMessage = ` ${normalizedMessage} `;
  return NORMALIZED_PRODUCT_INTENT_KEYWORDS.some((keyword) =>
    paddedMessage.includes(` ${keyword} `),
  );
}

function isShortConversationMessage(normalizedMessage: string): boolean {
  const tokenCount = normalizedMessage.split(' ').filter(Boolean).length;
  return normalizedMessage.length <= 36 && tokenCount <= 5;
}

function isGreeting(normalizedMessage: string): boolean {
  if (!isShortConversationMessage(normalizedMessage)) return false;

  return (
    /^(xin chao|chao|hi|hello|helo|hey|alo|a lo)( ban| shop| ad| aura)?$/.test(
      normalizedMessage,
    ) || /^(shop oi|ad oi|aura oi)$/.test(normalizedMessage)
  );
}

function isThanks(normalizedMessage: string): boolean {
  if (!isShortConversationMessage(normalizedMessage)) return false;

  return /^(cam on|thank|thanks|thank you|ok cam on|oke cam on|tot qua cam on)( ban| shop| aura)?$/.test(
    normalizedMessage,
  );
}

function isIdentityQuestion(normalizedMessage: string): boolean {
  if (!isShortConversationMessage(normalizedMessage)) return false;

  return /^(ban la ai|ban la gi|ai day|day la ai|bot gi|tro ly gi|ban giup duoc gi|ban lam duoc gi)$/.test(
    normalizedMessage,
  );
}

export function detectSimpleChatbotIntent(message: string): SimpleChatbotIntent | null {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) return null;

  if (OUT_OF_SCOPE_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword))) {
    return 'out_of_scope';
  }

  if (hasFashionShoppingIntent(message)) {
    return null;
  }

  if (isGreeting(normalizedMessage)) {
    return 'greeting';
  }

  if (isThanks(normalizedMessage)) {
    return 'thanks';
  }

  if (isIdentityQuestion(normalizedMessage)) {
    return 'identity';
  }

  return null;
}

export function buildSimpleChatbotReply(intent: SimpleChatbotIntent): SimpleChatbotReply {
  if (intent === 'greeting') {
    return {
      content:
        'Chào bạn, mình là trợ lý chọn đồ của AURA. Bạn muốn tìm đồ đi làm, đi chơi, theo màu/size hay theo ngân sách hôm nay?',
      lastIntent: intent,
      lastSummary: 'simple_greeting',
    };
  }

  if (intent === 'thanks') {
    return {
      content:
        'Rất vui được hỗ trợ bạn. Khi cần tìm thêm mẫu theo dịp mặc, màu, size hoặc ngân sách, bạn cứ nhắn mình nhé.',
      lastIntent: intent,
      lastSummary: 'simple_thanks',
    };
  }

  if (intent === 'identity') {
    return {
      content:
        'Mình là AURA Sales AI, trợ lý chọn đồ của shop. Mình có thể gợi ý sản phẩm theo dịp mặc, ngân sách, màu, size hoặc kiểu dáng bạn thích.',
      lastIntent: intent,
      lastSummary: 'simple_identity',
    };
  }

  return {
    content:
      'AURA hiện hỗ trợ tư vấn thời trang và sản phẩm trong shop. Bạn muốn mình gợi ý áo, quần, váy hoặc phụ kiện theo dịp mặc, màu, size hay ngân sách nào?',
    lastIntent: intent,
    lastSummary: 'simple_out_of_scope',
  };
}
