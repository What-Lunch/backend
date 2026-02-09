export type PreferenceStatus = 'CONFIDENT' | 'WEAK' | 'HINT' | 'EMPTY';

export interface PreferenceResult {
  status: PreferenceStatus;
  topCategories: string[];
  distribution?: Record<string, number>;
  summary: string;
}

// 받침 유무 확인
function hasFinalConsonant(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  // 한글 음절 범위: AC00–D7A3
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

// 목적어 조사 (을/를)
function withObjectParticle(word: string): string {
  return hasFinalConsonant(word) ? `${word}을` : `${word}를`;
}

// 접속 조사 (과/와)
function withAndParticle(word: string): string {
  return hasFinalConsonant(word) ? `${word}과` : `${word}와`;
}

// 여러 단어를 접속 조사로 연결
function joinWithAnd(words: string[]): string {
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];

  return words.map((w, i) => (i === words.length - 1 ? w : withAndParticle(w))).join(' ');
}

function joinWithAndAndObjectParticle(words: string[]): string {
  if (words.length === 0) return '';
  if (words.length === 1) return withObjectParticle(words[0]);

  const joined = joinWithAnd(words);
  const last = words[words.length - 1];
  const particle = hasFinalConsonant(last) ? '을' : '를';

  return `${joined}${particle}`;
}

export function analyzeCategoryPreference(categories: string[] = []): PreferenceResult {
  const validCategories = categories.map((c) => c?.trim()).filter((c): c is string => Boolean(c));
  const validTotal = validCategories.length;

  if (validTotal === 0) {
    return {
      status: 'EMPTY',
      topCategories: [],
      summary: '찜한 메뉴가 쌓이면 요즘 취향을 알려드려요.',
    };
  }

  const counts = new Map<string, number>();
  for (const c of validCategories) {
    counts.set(c, (counts.get(c) || 0) + 1);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const topCount = sorted[0][1];
  const topCategories = sorted.filter(([, v]) => v === topCount).map(([k]) => k);

  const status: PreferenceStatus =
    validTotal === 1 ? 'HINT' : validTotal === 2 ? 'WEAK' : 'CONFIDENT';

  let distribution: Record<string, number> | undefined;

  if (validTotal >= 2) {
    const raw = sorted.map(([k, v]) => [k, (v / validTotal) * 100] as const);

    const rounded: Record<string, number> = {};
    let sum = 0;

    for (const [k, v] of raw) {
      const r = Math.round(v);
      rounded[k] = r;
      sum += r;
    }

    // 반올림 보정
    const diff = 100 - sum;
    if (diff !== 0) {
      const firstKey = raw[0][0];
      rounded[firstKey] += diff;
    }

    distribution = Object.fromEntries(sorted.map(([k]) => [k, rounded[k]]));
  }

  let summary = '';

  if (status === 'HINT') {
    summary = `현재는 ${withObjectParticle(topCategories[0])} 한 번 찜하셨어요.`;
  } else if (topCategories.length > 1) {
    const phrase = joinWithAndAndObjectParticle(topCategories);
    summary = `현재는 ${phrase} 비슷한 편으로 찜하고 있어요.`;
  } else {
    const primary = topCategories[0];
    const secondCount = sorted[1]?.[1] ?? 0;
    const diff = topCount - secondCount;

    if (diff === 0) {
      summary = `현재는 ${withObjectParticle(primary)} 다른 메뉴들과 비슷하게 찜하고 있어요.`;
    } else if (diff === 1) {
      summary = `현재는 ${withObjectParticle(primary)} 조금 더 찜하는 편이에요.`;
    } else {
      summary = `현재는 ${withObjectParticle(primary)} 상대적으로 더 자주 찜하고 있어요.`;
    }
  }

  return {
    status,
    topCategories,
    distribution,
    summary,
  };
}

export default analyzeCategoryPreference;
