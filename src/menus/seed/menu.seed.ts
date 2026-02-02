import { MenuCategory } from '../enum/menu-category.enum';
import { MenuContext } from '../enum/menu-context.enum';

export const menuSeedData = [
  // 한식
  {
    name: '김치찌개',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO, MenuContext.LIGHT],
  },
  {
    name: '된장찌개',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.LUNCH, MenuContext.DATE],
    isBest: true,
  },
  {
    name: '비빔밥',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.SOLO, MenuContext.LIGHT],
  },
  {
    name: '삼겹살',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.STRESS, MenuContext.CELEBRATION],
  },
  {
    name: '불고기',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.LUNCH, MenuContext.STRESS],
  },
  {
    name: '제육볶음',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH],
    isBest: true,
  },
  {
    name: '갈비탕',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LATE_NIGHT],
  },
  {
    name: '콩나물국밥',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.SOLO, MenuContext.LIGHT, MenuContext.LATE_NIGHT],
  },

  // 중식
  {
    name: '짜장면',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO, MenuContext.LIGHT, MenuContext.LIGHT],
  },
  {
    name: '짬뽕',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.STRESS],
    isBest: true,
  },
  {
    name: '마라탕',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.LUNCH, MenuContext.DATE],
  },
  {
    name: '마파두부',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.SOLO, MenuContext.STRESS],
  },
  {
    name: '볶음밥',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO],
  },
  {
    name: '탕수육',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.STRESS],
    isBest: true,
  },
  {
    name: '유린기',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.DATE, MenuContext.CELEBRATION],
  },
  {
    name: '고추잡채',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO],
  },

  // 일식
  {
    name: '초밥',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LIGHT, MenuContext.CELEBRATION],
    isBest: true,
  },
  {
    name: '우동',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.SOLO, MenuContext.DATE],
  },
  {
    name: '라멘',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.STRESS, MenuContext.LUNCH],
  },
  {
    name: '사케동',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '돈카츠',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LATE_NIGHT],
    isBest: true,
  },
  {
    name: '오코노미야끼',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.SOLO, MenuContext.STRESS],
  },
  {
    name: '규동',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO],
  },
  {
    name: '텐동',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.DATE, MenuContext.SOLO],
    isBest: true,
  },

  // 양식
  {
    name: '파스타',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.CELEBRATION, MenuContext.LIGHT],
  },
  {
    name: '리조또',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH],
    isBest: true,
  },
  {
    name: '피자',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.STRESS, MenuContext.LATE_NIGHT],
    isBest: true,
  },
  {
    name: '스테이크',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.CELEBRATION],
    isBest: true,
  },
  {
    name: '샐러드',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.SOLO, MenuContext.LIGHT],
  },
  {
    name: '햄버거',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.LUNCH],
  },
  {
    name: '치킨',
    category: MenuCategory.WESTERN,
    contexts: [
      MenuContext.STRESS,
      MenuContext.DATE,
      MenuContext.CELEBRATION,
      MenuContext.LATE_NIGHT,
    ],
  },
  {
    name: '브런치 플레이트',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LIGHT],
  },

  // 분식
  {
    name: '떡볶이',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.STRESS, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '김밥',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.SOLO, MenuContext.LIGHT, MenuContext.LIGHT],
  },
  {
    name: '순대',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.LUNCH, MenuContext.STRESS],
    isBest: true,
  },
  {
    name: '라면',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LATE_NIGHT],
    isBest: true,
  },
  {
    name: '튀김',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.STRESS],
  },
  {
    name: '어묵',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '토스트',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '컵밥',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.STRESS, MenuContext.SOLO],
    isBest: true,
  },
];
