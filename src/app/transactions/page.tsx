"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Upload } from "lucide-react";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import type { Subscription } from "@/types/subscriptions";
import { LoadingSkeleton } from "@/app/transactions/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { TransactionDialog } from "@/app/transactions/components/TransactionDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { toast } from "@/hooks/use-toast";
import { TransactionsFilters } from "@/app/transactions/components/TransactionsFilters";
import { TransactionsTable } from "@/app/transactions/components/TransactionsTable";
import { TransactionsPagination } from "@/app/transactions/components/TransactionsPagination";
import { NO_ACCOUNT_SENTINEL, NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";
import { api } from "@/lib/api";
import type { Transaction, TransactionType, TransferKind, TransferDirection, UpdateTransactionDTO } from "@/types/transactions";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [filterType, setFilterType] = useState<"" | TransactionType>("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubscriptionIds, setFilterSubscriptionIds] = useState<string[]>([]);
  const [filterDates, setFilterDates] = useState<{ from?: Date; to?: Date }>({});

  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTxId, setEditTxId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newType, setNewType] = useState<TransactionType>("expense");
  const [newTransferKind, setNewTransferKind] = useState<TransferKind>("internal");
  const [newTransferDirection, setNewTransferDirection] = useState<TransferDirection>("out");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(NO_CATEGORY_SENTINEL);
  const [newIsSubscription, setNewIsSubscription] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txResult, accs, cats, subs] = await Promise.all([
        api.transactions.list({
          page,
          limit,
          type: filterType || undefined,
          categoryId: filterCategoryId || undefined,
          uncategorized: filterCategoryId === NO_CATEGORY_SENTINEL || undefined,
          accountId: filterAccountId || undefined,
          search: searchQuery || undefined,
          subscriptionIds: filterSubscriptionIds.length > 0 ? filterSubscriptionIds.join(',') : undefined,
          dateFrom: filterDates.from ? format(filterDates.from, "yyyy-MM-dd") : undefined,
          dateTo: filterDates.to ? format(filterDates.to, "yyyy-MM-dd") : undefined,
          sortBy,
          sortOrder,
        }),
        api.accounts.list(),
        api.categories.list(),
        api.subscriptions.list(),
      ]);
      setTransactions(txResult.data);
      setTotal(txResult.total);
      setAccounts(accs);
      setCategories(cats);
      setSubscriptions(subs);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las transacciones");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, filterCategoryId, filterAccountId, searchQuery, filterSubscriptionIds, filterDates, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!editTxId && accounts.length > 0 && !newAccountId) {
      setNewAccountId(accounts[0].id);
    }
  }, [accounts, editTxId, newAccountId]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(filterSearch);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [filterSearch]);

  function handleSort(field: "date" | "amount" | "description") {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function clearFilters() {
    setFilterType("");
    setFilterCategoryId("");
    setFilterAccountId("");
    setFilterSearch("");
    setFilterSubscriptionIds([]);
    setFilterDates({});
    setPage(1);
  }

  function resetSort() {
    setSortBy("date");
    setSortOrder("desc");
    setPage(1);
  }

  function hasActiveFilters() {
    return filterType || filterCategoryId || filterAccountId || filterSearch || filterSubscriptionIds.length > 0 || filterDates.from || filterDates.to;
  }

  function totalPages() {
    return Math.ceil(total / limit);
  }

  async function handleInlineEdit(tx: Transaction, field: string, value: string) {
    setSavingField(true);
    try {
      const payload: Partial<UpdateTransactionDTO> = {};
      if (field === "categoryId") payload.categoryId = value === NO_CATEGORY_SENTINEL ? null : value;
      else if (field === "description") payload.description = value;
      else if (field === "isSubscription") payload.isSubscription = value === "true";

      const updated = await api.transactions.update(tx.id, payload);
      setTransactions((prev) => prev.map((t) => (t.id === tx.id ? updated : t)));
        toast({ title: "Actualizado" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error al actualizar", variant: "destructive" });
    } finally {
      setSavingField(false);
      setEditingId(null);
      setEditingField(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.transactions.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => prev - 1);
      setDeleteConfirmId(null);
      toast({ title: "Transacci\u00f3n eliminada" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error al eliminar", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTxId) {
        const resolvedCategory = newCategoryId === NO_CATEGORY_SENTINEL ? null : newCategoryId;
        const resolvedAccount =
          newAccountId === NO_ACCOUNT_SENTINEL || !newAccountId ? null : newAccountId;
        const signedTransferAmount = newTransferDirection === "out"
          ? -Math.abs(Number(newAmount))
          : Math.abs(Number(newAmount));
        await api.transactions.update(editTxId, {
          description: newDescription.trim(),
          categoryId: resolvedCategory,
          accountId: resolvedAccount,
          isSubscription: newIsSubscription,
          ...(newType === "transfer"
            ? { transferKind: newTransferKind, amount: signedTransferAmount }
            : {}),
        });
        const selectedAccount = accounts.find((acc) => acc.id === resolvedAccount);
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editTxId
              ? {
                  ...t,
                  description: newDescription.trim(),
                  categoryId: resolvedCategory,
                  accountId: resolvedAccount,
                  account: selectedAccount
                    ? { id: selectedAccount.id, name: selectedAccount.name, type: selectedAccount.type }
                    : undefined,
                  isSubscription: newIsSubscription,
                  transferKind: newType === "transfer" ? newTransferKind : null,
                  amount: newType === "transfer" ? signedTransferAmount : t.amount,
                }
              : t
          )
        );
        setEditTxId(null);
        setDialogOpen(false);
      toast({ title: "Actualizado" });
      } else {
        if (!newDescription.trim() || !newAmount) {
          toast({ title: "La descripci\u00f3n y el importe son obligatorios", variant: "destructive" });
          return;
        }
        const parsedAmount = Number(newAmount);
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
          toast({ title: "El importe debe ser un n\u00famero v\u00e1lido mayor que 0", variant: "destructive" });
          return;
        }
        await api.transactions.create({
          date: newDate,
          amount:
            newType === "transfer"
              ? newTransferDirection === "out"
                ? -parsedAmount
                : parsedAmount
              : parsedAmount,
          description: newDescription.trim(),
          type: newType,
          ...(newType === "transfer" ? { transferKind: newTransferKind } : {}),
          accountId: newAccountId === NO_ACCOUNT_SENTINEL ? undefined : newAccountId || undefined,
          categoryId: newCategoryId === NO_CATEGORY_SENTINEL ? undefined : newCategoryId || undefined,
          isSubscription: newIsSubscription,
        });
        setNewDescription("");
        setNewAmount("");
        setNewDate(new Date().toISOString().split("T")[0]);
        setNewAccountId("");
        setNewType("expense");
        setNewTransferKind("internal");
        setNewTransferDirection("out");
        setNewCategoryId(NO_CATEGORY_SENTINEL);
        setNewIsSubscription(false);
        setDialogOpen(false);
        loadData();
      }
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Error al guardar transacci\u00f3n", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(txId: string, field: string, currentValue: string) {
    setEditingId(txId);
    setEditingField(field);
    setEditValue(currentValue);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  }

  function handleOpenEdit(tx: Transaction) {
    cancelEdit();
    setNewDate(tx.date);
    setNewType(tx.type);
    setNewTransferKind(tx.transferKind ?? "internal");
    setNewTransferDirection(tx.amount < 0 ? "out" : "in");
    setNewAmount(String(tx.amount));
    setNewDescription(tx.description);
    setNewAccountId(tx.accountId ?? NO_ACCOUNT_SENTINEL);
    setNewCategoryId(tx.categoryId ?? NO_CATEGORY_SENTINEL);
    setNewIsSubscription(tx.isSubscription);
    setEditTxId(tx.id);
    setDialogOpen(true);
  }

  function handleAccountCreated(account: Account) {
    setAccounts((prev) => [...prev, account]);
    setNewAccountId(account.id);
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (loading && transactions.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && transactions.length === 0) {
    return <ErrorState message={error} onRetry={loadData} fullPage />;
  }

  return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Transacciones</h1>
              <p className="text-sm text-text-muted mt-1">Gestiona tus movimientos</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCsvDialogOpen(true)}>
                <Upload className="size-4" /> Importar CSV
              </Button>

              <CsvUploadDialog
                open={csvDialogOpen}
                onClose={() => setCsvDialogOpen(false)}
                onImported={() => loadData()}
              />

              <TransactionDialog
                open={dialogOpen}
                editTxId={editTxId}
                newDate={newDate}
                newType={newType}
                newTransferKind={newTransferKind}
                newTransferDirection={newTransferDirection}
                newAmount={newAmount}
                newDescription={newDescription}
                newAccountId={newAccountId}
                newCategoryId={newCategoryId}
                newIsSubscription={newIsSubscription}
                accounts={accounts}
                categories={categories}
                saving={saving}
                onOpenChange={(o) => {
                  setDialogOpen(o);
                  if (!o) {
                    setEditTxId(null);
                    setNewDate(new Date().toISOString().split("T")[0]);
                    setNewType("expense");
                    setNewTransferKind("internal");
                    setNewTransferDirection("out");
                    setNewAmount("");
                    setNewDescription("");
                    setNewAccountId("");
                    setNewCategoryId(NO_CATEGORY_SENTINEL);
                    setNewIsSubscription(false);
                  }
                }}
                onDateChange={setNewDate}
                onTypeChange={setNewType}
                onTransferKindChange={setNewTransferKind}
                onTransferDirectionChange={setNewTransferDirection}
                onAmountChange={setNewAmount}
                onDescriptionChange={setNewDescription}
                onAccountIdChange={setNewAccountId}
                onAccountCreated={handleAccountCreated}
                onCategoryIdChange={setNewCategoryId}
                onIsSubscriptionChange={setNewIsSubscription}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          <TransactionsFilters
            filterType={filterType}
            filterCategoryId={filterCategoryId}
            filterAccountId={filterAccountId}
            filterSearch={filterSearch}
            filterSubscriptionIds={filterSubscriptionIds}
            filterDates={filterDates}
            accounts={accounts}
            categories={categories}
            subscriptions={subscriptions}
            hasActiveFilters={!!hasActiveFilters()}
            isDefaultSort={sortBy === "date" && sortOrder === "desc"}
            onFilterTypeChange={(v) => { setFilterType(v); setPage(1); }}
            onFilterCategoryIdChange={(v) => { setFilterCategoryId(v); setPage(1); }}
            onFilterAccountIdChange={(v) => { setFilterAccountId(v); setPage(1); }}
            onFilterSearchChange={setFilterSearch}
            onFilterSubscriptionIdsChange={(v) => { setFilterSubscriptionIds(v); setPage(1); }}
            onFilterDatesChange={(dates) => { setFilterDates(dates); }}
            onResetSort={resetSort}
            onClearFilters={clearFilters}
          />

          <TransactionsTable
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            editingId={editingId}
            editingField={editingField}
            editValue={editValue}
            savingField={savingField}
            hasActiveFilters={!!hasActiveFilters()}
            onSort={handleSort}
            onStartEdit={startEdit}
            onEditValueChange={setEditValue}
            onCancelEdit={cancelEdit}
            onInlineEdit={handleInlineEdit}
            onOpenEdit={handleOpenEdit}
            onDeleteClick={(id) => setDeleteConfirmId(id)}
          />

          <TransactionsPagination
            page={page}
            total={total}
            limit={limit}
            totalPages={totalPages()}
            from={from}
            to={to}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>

        <ConfirmDeleteDialog
          open={deleteConfirmId !== null}
          title="Eliminar transaccion"
          description="¿Estas seguro de que quieres eliminar esta transaccion? Esta accion no se puede deshacer."
          loading={deleting}
          onConfirm={() => deleteConfirmId ? handleDelete(deleteConfirmId) : undefined}
          onCancel={() => setDeleteConfirmId(null)}
        />
      </main>
  );
}
