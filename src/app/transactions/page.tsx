"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Plus, Upload } from "lucide-react";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import type { Subscription } from "@/types/subscriptions";
import { LoadingSkeleton } from "@/app/transactions/components/LoadingSkeleton";
import { ErrorState } from "@/app/transactions/components/ErrorState";
import { ToastMessage } from "@/app/transactions/components/ToastMessage";
import { TransactionForm } from "@/app/transactions/components/TransactionForm";
import { DeleteConfirmDialog } from "@/app/transactions/components/DeleteConfirmDialog";
import { TransactionsFilters } from "@/app/transactions/components/TransactionsFilters";
import { TransactionsTable } from "@/app/transactions/components/TransactionsTable";
import { TransactionsPagination } from "@/app/transactions/components/TransactionsPagination";
import { NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";
import { api } from "@/lib/api";
import type { Transaction, UpdateTransactionDTO } from "@/types/transactions";
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

  const [filterType, setFilterType] = useState<"" | "income" | "expense" | "transfer">("");
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
  const [newType, setNewType] = useState<"income" | "expense" | "transfer">("expense");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(NO_CATEGORY_SENTINEL);
  const [newIsSubscription, setNewIsSubscription] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, filterCategoryId, filterAccountId, searchQuery, filterSubscriptionIds, filterDates, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      showToast("Actualizado", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al actualizar", "error");
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
      showToast("Transacci\u00f3n eliminada", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al eliminar", "error");
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
        await api.transactions.update(editTxId, {
          description: newDescription.trim(),
          categoryId: resolvedCategory,
          isSubscription: newIsSubscription,
        });
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editTxId
              ? { ...t, description: newDescription.trim(), categoryId: resolvedCategory, isSubscription: newIsSubscription }
              : t
          )
        );
        setEditTxId(null);
        setDialogOpen(false);
        showToast("Actualizado", "success");
      } else {
        if (!newDescription.trim() || !newAmount) {
          showToast("La descripci\u00f3n y el importe son obligatorios", "error");
          return;
        }
        const parsedAmount = Number(newAmount);
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
          showToast("El importe debe ser un n\u00famero v\u00e1lido mayor que 0", "error");
          return;
        }
        await api.transactions.create({
          date: newDate,
          amount: parsedAmount,
          description: newDescription.trim(),
          type: newType,
          accountId: newAccountId || undefined,
          categoryId: newCategoryId === NO_CATEGORY_SENTINEL ? undefined : newCategoryId || undefined,
          isSubscription: newIsSubscription,
        });
        setNewDescription("");
        setNewAmount("");
        setNewDate(new Date().toISOString().split("T")[0]);
        setNewAccountId("");
        setNewType("expense");
        setNewCategoryId(NO_CATEGORY_SENTINEL);
        setNewIsSubscription(false);
        setDialogOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar transacci\u00f3n", "error");
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
    setNewAmount(String(tx.amount));
    setNewDescription(tx.description);
    setNewAccountId(tx.accountId ?? "");
    setNewCategoryId(tx.categoryId ?? NO_CATEGORY_SENTINEL);
    setNewIsSubscription(tx.isSubscription);
    setEditTxId(tx.id);
    setDialogOpen(true);
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (loading && transactions.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && transactions.length === 0) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  return (
    <>
      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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

              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setEditTxId(null);
                    setNewDate(new Date().toISOString().split("T")[0]);
                    setNewType("expense");
                    setNewAmount("");
                    setNewDescription("");
                    setNewAccountId("");
                    setNewCategoryId(NO_CATEGORY_SENTINEL);
                    setNewIsSubscription(false);
                    setDialogOpen(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setDialogOpen(true)}>
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
                    onDateChange={setNewDate}
                    onTypeChange={setNewType}
                    onAmountChange={setNewAmount}
                    onDescriptionChange={setNewDescription}
                    onAccountIdChange={setNewAccountId}
                    onCategoryIdChange={setNewCategoryId}
                    onIsSubscriptionChange={setNewIsSubscription}
                    onSubmit={handleSubmit}
                  />
                </DialogContent>
              </Dialog>
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
            onFilterTypeChange={(v) => { setFilterType(v); setPage(1); }}
            onFilterCategoryIdChange={(v) => { setFilterCategoryId(v); setPage(1); }}
            onFilterAccountIdChange={(v) => { setFilterAccountId(v); setPage(1); }}
            onFilterSearchChange={setFilterSearch}
            onFilterSubscriptionIdsChange={(v) => { setFilterSubscriptionIds(v); setPage(1); }}
            onFilterDatesChange={(dates) => { setFilterDates(dates); }}
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

        <DeleteConfirmDialog
          open={deleteConfirmId !== null}
          deleting={deleting}
          onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      </main>
    </>
  );
}
