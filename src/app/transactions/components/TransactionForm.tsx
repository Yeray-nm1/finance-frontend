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
import { NO_ACCOUNT_SENTINEL, NO_CATEGORY_SENTINEL, getSubmitLabel, getAmountSign, typeLabel } from "@/lib/transactions-utils";
import { formatCurrency } from "@/lib/format";
import { getAmountColor } from "@/components/ui/variants/transactions.variants";
import { QuickAccountCreate } from "@/components/QuickAccountCreate";
import type { TransactionFormProps } from "./types/TransactionForm.types";
import type { TransactionType, TransferKind, TransferDirection } from "@/types/transactions";

export function TransactionForm({
  newDate,
  newType,
  newTransferKind,
  newTransferDirection,
  newAmount,
  newDescription,
  newAccountId,
  newTransferAccountId,
  newCategoryId,
  newIsSubscription,
  editTxId,
  accounts,
  categories,
  saving,
  onDateChange,
  onTypeChange,
  onTransferKindChange,
  onTransferDirectionChange,
  onAmountChange,
  onDescriptionChange,
  onAccountIdChange,
  onTransferAccountIdChange,
  onAccountCreated,
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
          <Select defaultValue="expense" value={newType} onValueChange={(v) => onTypeChange(v as TransactionType)}>
            <SelectTrigger id="tx-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Ingreso</SelectItem>
              <SelectItem value="expense">Gasto</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      {newType === "transfer" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tx-transfer-kind">Movimiento</Label>
            <Select
              value={newTransferKind}
              onValueChange={(v) => onTransferKindChange(v as TransferKind)}
            >
              <SelectTrigger id="tx-transfer-kind"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Entre mis cuentas</SelectItem>
                <SelectItem value="external">Con un tercero</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-transfer-direction">Dirección</Label>
            <Select
              value={newTransferDirection}
              onValueChange={(v) => onTransferDirectionChange(v as TransferDirection)}
            >
              <SelectTrigger id="tx-transfer-direction"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="out">Salida</SelectItem>
                <SelectItem value="in">Entrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {newType === "transfer" && newTransferKind === "internal" && (
        <div className="space-y-2">
          <Label htmlFor="tx-transfer-account">Cuenta destino</Label>
          <Select
            value={newTransferAccountId}
            onValueChange={onTransferAccountIdChange}
            disabled={accounts.length === 0}
          >
            <SelectTrigger id="tx-transfer-account">
              <SelectValue placeholder={accounts.length === 0 ? "Sin cuentas" : "Sin cuenta"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ACCOUNT_SENTINEL}>Sin cuenta</SelectItem>
              {accounts
                .filter((account) => account.id !== newAccountId)
                .map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
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
          <Select value={newAccountId} onValueChange={onAccountIdChange} disabled={accounts.length === 0}>
            <SelectTrigger id="tx-account">
              <SelectValue placeholder={accounts.length === 0 ? "Sin cuentas" : "Sin cuenta"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ACCOUNT_SENTINEL}>Sin cuenta</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <QuickAccountCreate onCreated={onAccountCreated} />
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
