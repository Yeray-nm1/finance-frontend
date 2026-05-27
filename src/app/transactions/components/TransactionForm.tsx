"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { NO_CATEGORY_SENTINEL, getSubmitLabel, getAmountColor, getAmountSign, typeLabel } from "@/lib/transactions-utils";
import { formatCurrency } from "@/lib/format";
import type { TransactionFormProps } from "@/types/transactions";

export function TransactionForm({
  newDate,
  newType,
  newAmount,
  newDescription,
  newAccountId,
  newCategoryId,
  newIsSubscription,
  editTxId,
  accounts,
  categories,
  saving,
  onDateChange,
  onTypeChange,
  onAmountChange,
  onDescriptionChange,
  onAccountIdChange,
  onCategoryIdChange,
  onIsSubscriptionChange,
  onSubmit,
}: Readonly<TransactionFormProps>) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tx-date">Fecha</Label>
        {editTxId ? (
          <p className="text-sm text-text-primary py-1.5">
            {format(new Date(newDate), "dd/MM/yyyy")}
          </p>
        ) : (
          <Input id="tx-date" type="date" value={newDate} onChange={(e) => onDateChange(e.target.value)} required />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tx-type">Tipo</Label>
        {editTxId ? (
          <p className="text-sm text-text-primary py-1.5">{typeLabel(newType)}</p>
        ) : (
          <Select defaultValue="expense" value={newType} onValueChange={(v) => onTypeChange(v as "income" | "expense" | "transfer")}>
            <SelectTrigger id="tx-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Ingreso</SelectItem>
              <SelectItem value="expense">Gasto</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tx-amount">Importe</Label>
        {editTxId ? (
          <p className={`text-sm py-1.5 ${getAmountColor(newType)}`}>
            {getAmountSign(newType)}{" "}
            {formatCurrency(Math.abs(Number(newAmount)))}
          </p>
        ) : (
          <Input id="tx-amount" type="number" step="0.01" placeholder="0.00" value={newAmount} onChange={(e) => onAmountChange(e.target.value)} required />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tx-description">Descripcion</Label>
        <Input id="tx-description" placeholder="Ej: Mercadona" value={newDescription} onChange={(e) => onDescriptionChange(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tx-account">Cuenta</Label>
          <Select value={newAccountId} onValueChange={editTxId ? undefined : onAccountIdChange} disabled={!!editTxId}>
            <SelectTrigger id="tx-account"><SelectValue placeholder="Opcional" /></SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tx-category">Categoria</Label>
          <Select value={newCategoryId} onValueChange={onCategoryIdChange}>
            <SelectTrigger id="tx-category"><SelectValue placeholder="Opcional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY_SENTINEL}>Sin categoria</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="tx-is-subscription"
          checked={newIsSubscription}
          onCheckedChange={(checked) => onIsSubscriptionChange(checked === true)}
        />
        <Label htmlFor="tx-is-subscription">Pertenece a alguna suscripci&oacute;n</Label>
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {getSubmitLabel(saving, editTxId !== null)}
      </Button>
    </form>
  );
}
