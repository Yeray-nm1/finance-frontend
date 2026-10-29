"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TransactionForm } from "@/app/transactions/components/TransactionForm";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { TransactionType } from "@/types/transactions";

interface TransactionDialogProps {
  open: boolean;
  editTxId: string | null;
  newDate: string;
  newType: TransactionType;
  newAmount: string;
  newDescription: string;
  newAccountId: string;
  newCategoryId: string;
  newIsSubscription: boolean;
  accounts: Account[];
  categories: Category[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onDateChange: (v: string) => void;
  onTypeChange: (v: TransactionType) => void;
  onAmountChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onAccountIdChange: (v: string) => void;
  onCategoryIdChange: (v: string) => void;
  onIsSubscriptionChange: (v: boolean) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export function TransactionDialog({
  open,
  editTxId,
  newDate,
  newType,
  newAmount,
  newDescription,
  newAccountId,
  newCategoryId,
  newIsSubscription,
  accounts,
  categories,
  saving,
  onOpenChange,
  onDateChange,
  onTypeChange,
  onAmountChange,
  onDescriptionChange,
  onAccountIdChange,
  onCategoryIdChange,
  onIsSubscriptionChange,
  onSubmit,
}: Readonly<TransactionDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <Plus className="size-4" /> A&ntilde;adir
        </Button>
      </DialogTrigger>
      <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTxId ? "Editar Transaccion" : "Nueva Transaccion"}</DialogTitle>
            <DialogDescription>
              {editTxId ? "Modifica los campos que quieras" : "Anade un movimiento manual"}
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            newDate={newDate}
            newType={newType}
            newAmount={newAmount}
            newDescription={newDescription}
            newAccountId={newAccountId}
            newCategoryId={newCategoryId}
            newIsSubscription={newIsSubscription}
            editTxId={editTxId}
            accounts={accounts}
            categories={categories}
            saving={saving}
            onDateChange={onDateChange}
            onTypeChange={onTypeChange}
            onAmountChange={onAmountChange}
            onDescriptionChange={onDescriptionChange}
            onAccountIdChange={onAccountIdChange}
            onCategoryIdChange={onCategoryIdChange}
            onIsSubscriptionChange={onIsSubscriptionChange}
            onSubmit={onSubmit}
          />
        </DialogContent>
    </Dialog>
  );
}
