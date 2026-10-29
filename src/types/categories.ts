import { CATEGORY_TYPES } from '@/lib/constants';
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
}


