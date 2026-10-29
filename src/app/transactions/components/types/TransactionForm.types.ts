import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { TransactionType } from "@/types/transactions";

export interface TransactionFormProps {
  newDate: string;
  newType: TransactionType;
  newAmount: string;
  newDescription: string;
  newAccountId: string;
  newCategoryId: string;
  newIsSubscription: boolean;
  editTxId: string | null;
  accounts: Account[];
  categories: Category[];
  saving: boolean;
  onDateChange: (date: string) => void;
  onTypeChange: (type: TransactionType) => void;
  onAmountChange: (amount: string) => void;
  onDescriptionChange: (description: string) => void;
  onAccountIdChange: (accountId: string) => void;
  onCategoryIdChange: (categoryId: string) => void;
  onIsSubscriptionChange: (isSubscription: boolean) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}
