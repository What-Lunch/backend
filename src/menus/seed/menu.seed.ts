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
    contexts: [MenuContext.LUNCH, MenuContext.CELEBRATION],
  },
  {
    name: '냉면',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.LUNCH, MenuContext.DATE, MenuContext.LIGHT],
  },
  {
    name: '잡채',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LATE_NIGHT],
  },
  {
    name: '떡국',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO],
  },
  {
    name: '순두부찌개',
    category: MenuCategory.KOREAN,
    contexts: [MenuContext.SOLO, MenuContext.STRESS, MenuContext.LATE_NIGHT],
  },

  // 중식
  {
    name: '짜장면',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO, MenuContext.LIGHT],
  },
  {
    name: '짬뽕',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.STRESS],
    isBest: true,
  },
  {
    name: '탕수육',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.CELEBRATION, MenuContext.STRESS],
    isBest: true,
  },
  {
    name: '마파두부',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.SOLO, MenuContext.STRESS],
  },
  {
    name: '양장피',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.DATE, MenuContext.CELEBRATION],
  },
  {
    name: '유산슬',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.STRESS],
    isBest: true,
  },
  {
    name: '깐풍기',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.DATE, MenuContext.CELEBRATION],
  },
  {
    name: '동파육',
    category: MenuCategory.CHINESE,
    contexts: [MenuContext.DATE, MenuContext.CELEBRATION],
  },

  // 일식
  {
    name: '초밥',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LIGHT, MenuContext.CELEBRATION],
    isBest: true,
  },
  {
    name: '라멘',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.STRESS, MenuContext.LATE_NIGHT],
  },
  {
    name: '우동',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.SOLO, MenuContext.LIGHT],
  },
  {
    name: '야키토리',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '타코야키',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LATE_NIGHT],
    isBest: true,
  },
  {
    name: '튀김',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.LUNCH, MenuContext.STRESS],
  },
  {
    name: '규동',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.LUNCH, MenuContext.SOLO],
  },
  {
    name: '오코노미야키',
    category: MenuCategory.JAPANESE,
    contexts: [MenuContext.SOLO, MenuContext.STRESS],
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
    name: '라자냐',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.STRESS, MenuContext.LATE_NIGHT],
    isBest: true,
  },
  {
    name: '샐러드',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.CELEBRATION],
    isBest: true,
  },
  {
    name: '햄버거',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.SOLO, MenuContext.LIGHT],
  },
  {
    name: '피자',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.LUNCH],
  },
  {
    name: '스테이크',
    category: MenuCategory.WESTERN,
    contexts: [
      MenuContext.STRESS,
      MenuContext.DATE,
      MenuContext.CELEBRATION,
      MenuContext.LATE_NIGHT,
    ],
  },
  {
    name: '피시앤칩스',
    category: MenuCategory.WESTERN,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LIGHT],
  },

  // 스낵
  {
    name: '떡볶이',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.STRESS, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '김밥',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.SOLO, MenuContext.LIGHT],
  },
  {
    name: '라면',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.SOLO, MenuContext.LATE_NIGHT, MenuContext.STRESS],
    isBest: true,
  },
  {
    name: '토스트',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LATE_NIGHT],
    isBest: true,
  },
  {
    name: '핫도그',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.STRESS],
  },
  {
    name: '만두',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.SOLO, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '닭강정',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.DATE, MenuContext.LUNCH, MenuContext.LIGHT],
  },
  {
    name: '순대',
    category: MenuCategory.SNACK,
    contexts: [MenuContext.LUNCH, MenuContext.STRESS],
    isBest: true,
  },
];
