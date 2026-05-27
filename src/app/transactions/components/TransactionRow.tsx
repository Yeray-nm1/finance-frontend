"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { getAmountColor, getAmountSign, NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";
import { EditableTextCell } from "@/app/transactions/components/EditableTextCell";
import { EditableSelectCell } from "@/app/transactions/components/EditableSelectCell";
import { ActionCell } from "@/app/transactions/components/ActionCell";
import type { TransactionRowProps } from "@/types/transactions";

export function TransactionRow({
  tx,
  categories,
  accounts,
  editingId,
  editingField,
  editValue,
  savingField,
  onStartEdit,
  onEditValueChange,
  onCancelEdit,
  onInlineEdit,
  onOpenEdit,
  onDeleteClick,
}: Readonly<TransactionRowProps>) {
  const isEditing = editingId === tx.id;
  const isSub = tx.isSubscription || !!tx.subscriptionId;

  return (
    <TableRow className={`${savingField && isEditing ? "opacity-60" : ""} border-gray-100`}>
      <TableCell className="py-1.5 px-4 text-sm whitespace-nowrap">
        {new Date(tx.date).toLocaleDateString("es-ES")}
      </TableCell>

      <EditableTextCell
        value={tx.description}
        isEditing={isEditing && editingField === "description"}
        editValue={editValue}
        savingField={savingField}
        onStartEdit={() => onStartEdit(tx.id, "description", tx.description)}
        onEditValueChange={onEditValueChange}
        onCancelEdit={onCancelEdit}
        onInlineEdit={(v) => onInlineEdit(tx, "description", v)}
        className="py-1.5 px-4 font-medium max-w-[200px]"
      />

      <EditableSelectCell
        value={tx.categoryId ?? NO_CATEGORY_SENTINEL}
        display={tx.category?.name ?? categories.find((c) => c.id === tx.categoryId)?.name ?? "-"}
        isEditing={isEditing && editingField === "categoryId"}
        editValue={editValue}
        savingField={savingField}
        onStartEdit={() => onStartEdit(tx.id, "categoryId", tx.categoryId ?? NO_CATEGORY_SENTINEL)}
        onCancelEdit={onCancelEdit}
        onInlineEdit={(v) => onInlineEdit(tx, "categoryId", v)}
        options={[
          { value: NO_CATEGORY_SENTINEL, label: "Sin categoria" },
          ...categories.map((c) => ({ value: c.id, label: c.name })),
        ]}
        className="py-1.5 px-4 text-text-muted"
      />

      <TableCell className="py-1.5 px-4 text-text-muted">
        {tx.account?.name ?? accounts.find((a) => a.id === tx.accountId)?.name ?? "-"}
      </TableCell>

      <EditableSelectCell
        value={String(isSub)}
        display={isSub ? <Badge variant="secondary">Suscripci&oacute;n</Badge> : "-"}
        isEditing={isEditing && editingField === "isSubscription"}
        editValue={editValue}
        savingField={savingField}
        onStartEdit={() => onStartEdit(tx.id, "isSubscription", String(isSub))}
        onCancelEdit={onCancelEdit}
        onInlineEdit={(v) => onInlineEdit(tx, "isSubscription", v)}
        options={[
          { value: "true", label: "S\u00ed" },
          { value: "false", label: "No" },
        ]}
        className="py-1.5 px-4 text-text-muted"
      />

      <TableCell className={`py-1.5 px-4 text-right font-medium whitespace-nowrap ${getAmountColor(tx.type)}`}>
        {getAmountSign(tx.type)} {formatCurrency(Math.abs(tx.amount))}
      </TableCell>

      <ActionCell
        onEdit={() => onOpenEdit(tx)}
        onDelete={() => onDeleteClick(tx.id)}
      />
    </TableRow>
  );
}
