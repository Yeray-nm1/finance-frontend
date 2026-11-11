import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { TransactionType, TransferKind, TransferDirection } from "@/types/transactions";

export interface TransactionFormProps {
  newDate: string;
  newType: TransactionType;
  newTransferKind: TransferKind;
  newTransferDirection: TransferDirection;
  newAmount: string;
  newDescription: string;
  newAccountId: string;
  newTransferAccountId: string;
  newCategoryId: string;
  newIsSubscription: boolean;
  editTxId: string | null;
  accounts: Account[];
  categories: Category[];
  saving: boolean;
  onDateChange: (date: string) => void;
  onTypeChange: (type: TransactionType) => void;
  onTransferKindChange: (transferKind: TransferKind) => void;
  onTransferDirectionChange: (direction: TransferDirection) => void;
  onAmountChange: (amount: string) => void;
  onDescriptionChange: (description: string) => void;
  onAccountIdChange: (accountId: string) => void;
  onTransferAccountIdChange: (accountId: string) => void;
  onAccountCreated: (account: Account) => void;
  onCategoryIdChange: (categoryId: string) => void;
  onIsSubscriptionChange: (isSubscription: boolean) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}
