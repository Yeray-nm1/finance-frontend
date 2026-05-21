"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Plus, Upload, X } from "lucide-react";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import { TransactionsFilters } from "@/components/transactions/TransactionsFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionsPagination } from "@/components/transactions/TransactionsPagination";
import { NO_CATEGORY_SENTINEL, getSubmitLabel, getAmountColor, getAmountSign, typeLabel } from "@/lib/transactions-utils";
import { formatCurrency } from "@/lib/format";
import { api } from "@/lib/api";
import type { Transaction, UpdateTransactionDTO } from "@/types/transactions";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";

function Toast({ message, type, onClose }: Readonly<{ message: string; type: "success" | "error"; onClose: () => void }>) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="hover:opacity-80">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<"" | "income" | "expense" | "transfer">("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDates, setFilterDates] = useState<{ from?: Date; to?: Date }>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

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
      const [txResult, accs, cats] = await Promise.all([
        api.transactions.list({
          page,
          limit,
          type: filterType || undefined,
          categoryId: filterCategoryId || undefined,
          accountId: filterAccountId || undefined,
          search: searchQuery || undefined,
          dateFrom: filterDates.from ? format(filterDates.from, "yyyy-MM-dd") : undefined,
          dateTo: filterDates.to ? format(filterDates.to, "yyyy-MM-dd") : undefined,
          sortBy,
          sortOrder,
        }),
        api.accounts.list(),
        api.categories.list(),
      ]);
      setTransactions(txResult.data);
      setTotal(txResult.total);
      setAccounts(accs);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, filterCategoryId, filterAccountId, searchQuery, filterDates, sortBy, sortOrder]);

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
    setFilterDates({});
    setPage(1);
  }

  function hasActiveFilters() {
    return filterType || filterCategoryId || filterAccountId || filterSearch || filterDates.from || filterDates.to;
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
      showToast("Transacción eliminada", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al eliminar", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTxId) {
        const resolvedCategory = newCategoryId === NO_CATEGORY_SENTINEL ? null : newCategoryId;
        await api.transactions.update(editTxId, {
          description: newDescription.trim(),
          categoryId: resolvedCategory,
        });
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editTxId
              ? { ...t, description: newDescription.trim(), categoryId: resolvedCategory }
              : t
          )
        );
        setEditTxId(null);
        setDialogOpen(false);
        showToast("Actualizado", "success");
      } else {
        if (!newDescription.trim() || !newAmount) {
          showToast("La descripción y el importe son obligatorios", "error");
          return;
        }
        const parsedAmount = Number(newAmount);
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
          showToast("El importe debe ser un número válido mayor que 0", "error");
          return;
        }
        await api.transactions.create({
          date: newDate,
          amount: parsedAmount,
          description: newDescription.trim(),
          type: newType,
          accountId: newAccountId || undefined,
          categoryId: newCategoryId === NO_CATEGORY_SENTINEL ? undefined : newCategoryId || undefined,
        });
        setNewDescription("");
        setNewAmount("");
        setNewDate(new Date().toISOString().split("T")[0]);
        setNewAccountId("");
        setNewType("expense");
        setNewCategoryId(NO_CATEGORY_SENTINEL);
        setDialogOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar transacción", "error");
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
    setEditTxId(tx.id);
    setDialogOpen(true);
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (loading && transactions.length === 0) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
            </div>
          </div>
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  {["Fecha", "Descripcion", "Categoria", "Cuenta", "Importe", ""].map((h) => (
                    <th key={h} className="h-10 px-4 text-left text-sm font-medium text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skeleton-row-${i}`}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={`skeleton-cell-${j}`} className="px-4 py-1.5">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-expense">{error}</p>
          <button onClick={loadData} className="text-primary text-sm hover:underline mt-2">
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
                  setDialogOpen(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" /> Añadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editTxId ? "Editar Transaccion" : "Nueva Transaccion"}</DialogTitle>
                  <DialogDescription>
                    {editTxId ? "Modifica los campos que quieras" : "Anade un movimiento manual"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tx-date">Fecha</Label>
                    {editTxId ? (
                      <p className="text-sm text-text-primary py-1.5">
                        {format(new Date(newDate), "dd/MM/yyyy")}
                      </p>
                    ) : (
                      <Input id="tx-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tx-type">Tipo</Label>
                    {editTxId ? (
                      <p className="text-sm text-text-primary py-1.5">{typeLabel(newType)}</p>
                    ) : (
                      <Select defaultValue="expense" value={newType} onValueChange={(v) => setNewType(v as "income" | "expense" | "transfer")}>
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
                      <Input id="tx-amount" type="number" step="0.01" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tx-description">Descripcion</Label>
                    <Input id="tx-description" placeholder="Ej: Mercadona" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tx-account">Cuenta</Label>
                      <Select value={newAccountId} onValueChange={editTxId ? undefined : setNewAccountId} disabled={!!editTxId}>
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
                      <Select value={newCategoryId} onValueChange={setNewCategoryId}>
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
                  <Button type="submit" className="w-full" disabled={saving}>
                    {getSubmitLabel(saving, editTxId !== null)}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TransactionsFilters
          filterType={filterType}
          filterCategoryId={filterCategoryId}
          filterAccountId={filterAccountId}
          filterSearch={filterSearch}
          filterDates={filterDates}
          accounts={accounts}
          categories={categories}
          hasActiveFilters={!!hasActiveFilters()}
          calendarOpen={calendarOpen}
          onFilterTypeChange={(v) => { setFilterType(v); setPage(1); }}
          onFilterCategoryIdChange={(v) => { setFilterCategoryId(v); setPage(1); }}
          onFilterAccountIdChange={(v) => { setFilterAccountId(v); setPage(1); }}
          onFilterSearchChange={setFilterSearch}
          onFilterDatesChange={(dates) => { setFilterDates(dates); }}
          onCalendarOpenChange={setCalendarOpen}
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

      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar transaccion</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que quieres eliminar esta transaccion? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
