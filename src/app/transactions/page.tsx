"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Upload, Search, Trash2, ArrowUpDown, ChevronUp, ChevronDown, X, CalendarIcon, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import type { Transaction, UpdateTransactionDTO } from "@/types/transactions";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import { formatCurrency } from "@/lib/format";

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== field) return <ArrowUpDown className="size-3 inline ml-1 opacity-40" />;
  return sortOrder === "asc"
    ? <ChevronUp className="size-3 inline ml-1" />
    : <ChevronDown className="size-3 inline ml-1" />;
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
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
  const [filterDates, setFilterDates] = useState<{ from?: string; to?: string }>({});

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
  const [csvDrawerOpen, setCsvDrawerOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newType, setNewType] = useState<"income" | "expense" | "transfer">("expense");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.transactions.list(
        {
          page,
          limit,
          type: filterType || undefined,
          categoryId: filterCategoryId || undefined,
          accountId: filterAccountId || undefined,
          search: searchQuery || undefined,
          dateFrom: filterDates.from,
          dateTo: filterDates.to,
          sortBy,
          sortOrder,
        },
      ),
      api.accounts.list(),
      api.categories.list(),
    ])
      .then(([txResult, accs, cats]) => {
        setTransactions(txResult.data);
        setTotal(txResult.total);
        setAccounts(accs);
        setCategories(cats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
      if (field === "categoryId") payload.categoryId = value === " " ? null : value;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTxId) {
        const resolvedCategory = newCategoryId === " " ? null : newCategoryId;
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
          categoryId: newCategoryId === " " ? undefined : newCategoryId || undefined,
        });
        setNewDescription("");
        setNewAmount("");
        setNewDate(new Date().toISOString().split("T")[0]);
        setNewAccountId("");
        setNewCategoryId("");
        setDialogOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar transacción", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(tx: Transaction, field: string, currentValue: string) {
    setEditingId(tx.id);
    setEditingField(field);
    setEditValue(currentValue);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  }

  const typeLabel: Record<string, string> = {
    income: "Ingreso",
    expense: "Gasto",
    transfer: "Transferencia",
  };

  function handleOpenEdit(tx: Transaction) {
    cancelEdit();
    setNewDate(tx.date);
    setNewType(tx.type);
    setNewAmount(String(tx.amount));
    setNewDescription(tx.description);
    setNewAccountId(tx.accountId ?? "");
    setNewCategoryId(tx.categoryId ?? " ");
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
            <Table>
              <TableHeader>
                <TableRow>
                  {["Fecha", "Descripcion", "Categoria", "Cuenta", "Importe", ""].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </TableBody>
            </Table>
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
            <Drawer open={csvDrawerOpen} onOpenChange={setCsvDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline">
                  <Upload className="size-4" /> Importar CSV
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-6">
                <DrawerHeader>
                  <DrawerTitle>Importar CSV</DrawerTitle>
                  <DrawerDescription>Sube un archivo CSV con tus movimientos</DrawerDescription>
                </DrawerHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-text-muted">Funcionalidad disponible con conexion al backend</p>
                  <Button variant="secondary" className="w-full" onClick={() => setCsvDrawerOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>

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
                  setNewCategoryId("");
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
                      <p className="text-sm text-text-primary py-1.5">{typeLabel[newType] ?? newType}</p>
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
                      <p className={`text-sm py-1.5 ${newType === "income" ? "text-income" : newType === "expense" ? "text-expense" : "text-savings"}`}>
                        {newType === "income" ? "+" : newType === "expense" ? "-" : "↔"}{" "}
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
                          <SelectItem value=" ">Sin categoria</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving
                      ? (editTxId ? "Guardando..." : "Creando...")
                      : (editTxId ? "Guardar cambios" : "Crear")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg mb-4 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
              <Input
                placeholder="Buscar por descripcion..."
                className="pl-9"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
              {filterSearch && (
                <button
                  onClick={() => setFilterSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense"
                  aria-label="Limpiar filtro de busqueda"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="relative w-[140px]">
              <Select value={filterType} onValueChange={(v) => { setFilterType(v as "" | "income" | "expense" | "transfer"); setPage(1); }}>
                <SelectTrigger className={filterType ? "pr-8" : ""}><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
              {filterType && (
                <button
                  onClick={() => { setFilterType(""); setPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
                  aria-label="Limpiar filtro de tipo"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="relative w-[160px]">
              <Select value={filterCategoryId} onValueChange={(v) => { setFilterCategoryId(v); setPage(1); }}>
                <SelectTrigger className={filterCategoryId ? "pr-8" : ""}><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterCategoryId && (
                <button
                  onClick={() => { setFilterCategoryId(""); setPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
                  aria-label="Limpiar filtro de categoria"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="relative w-[160px]">
              <Select value={filterAccountId} onValueChange={(v) => { setFilterAccountId(v); setPage(1); }}>
                <SelectTrigger className={filterAccountId ? "pr-8" : ""}><SelectValue placeholder="Cuenta" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterAccountId && (
                <button
                  onClick={() => { setFilterAccountId(""); setPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
                  aria-label="Limpiar filtro de cuenta"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="w-px h-8 bg-border self-center" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-[260px] h-9 justify-start text-left font-normal ${!filterDates.from && !filterDates.to ? "text-text-muted" : "text-text-primary"}`}
                >
                  {filterDates.from && filterDates.to
                    ? `${format(new Date(filterDates.from + "T00:00:00"), "dd/MM/yyyy")} - ${format(new Date(filterDates.to + "T00:00:00"), "dd/MM/yyyy")}`
                    : filterDates.from
                      ? `${format(new Date(filterDates.from + "T00:00:00"), "dd/MM/yyyy")} - ...`
                      : "Seleccionar fechas"}
                  <CalendarIcon className="ml-2 size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={filterDates.from ? { from: new Date(filterDates.from + "T00:00:00"), to: filterDates.to ? new Date(filterDates.to + "T00:00:00") : undefined } : undefined}
                  onSelect={(range) => {
                    const fromStr = range?.from ? format(range.from, "yyyy-MM-dd") : undefined;
                    const toStr = range?.to ? format(range.to, "yyyy-MM-dd") : undefined;
                    setFilterDates({ from: fromStr, to: toStr });
                    if (fromStr && toStr) setPage(1);
                  }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            {(filterDates.from || filterDates.to) && (
              <button
                onClick={() => { setFilterDates({}); setPage(1); }}
                className="text-text-muted hover:text-expense transition-colors p-1"
                aria-label="Limpiar filtro de fechas"
              >
                <X className="size-4" />
              </button>
            )}
            {hasActiveFilters() && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-4 mr-1" /> Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("date")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("date"); } }}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === "date" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  Fecha <SortIcon field="date" sortBy={sortBy} sortOrder={sortOrder} />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("description")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("description"); } }}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === "description" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  Descripcion <SortIcon field="description" sortBy={sortBy} sortOrder={sortOrder} />
                </TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => handleSort("amount")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("amount"); } }}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === "amount" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                >
                  Importe <SortIcon field="amount" sortBy={sortBy} sortOrder={sortOrder} />
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              )}
              {!loading && transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-text-muted">
                    {hasActiveFilters()
                      ? "Sin resultados. Prueba con otros filtros."
                      : "No hay transacciones. Anade tu primera transaccion."}
                  </TableCell>
                </TableRow>
              )}
              {!loading && transactions.map((tx) => (
                <TableRow key={tx.id} className={`${savingField && editingId === tx.id ? "opacity-60" : ""} border-gray-100`}>
                  <TableCell className="py-1.5 px-4 text-sm whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString("es-ES")}
                  </TableCell>

                  <TableCell className="py-1.5 px-4 font-medium max-w-[200px]">
                    {editingId === tx.id && editingField === "description" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEdit();
                        }}
                        onBlur={() => handleInlineEdit(tx, "description", editValue)}
                        autoFocus
                        className="h-8 text-sm"
                        disabled={savingField}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary border-b border-dashed border-transparent hover:border-primary"
                        onClick={() => startEdit(tx, "description", tx.description)}
                        title="Clic para editar"
                      >
                        {tx.description}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-1.5 px-4 text-text-muted">
                    {editingId === tx.id && editingField === "categoryId" ? (
                      <Select
                        value={editValue}
                        onValueChange={(v) => {
                          handleInlineEdit(tx, "categoryId", v);
                        }}
                        onOpenChange={(open) => {
                          if (!open && editingId === tx.id && editingField === "categoryId") cancelEdit();
                        }}
                        disabled={savingField}
                      >
                        <SelectTrigger className="h-8 text-sm" autoFocus>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=" ">Sin categoria</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary border-b border-dashed border-transparent hover:border-primary"
                        onClick={() => startEdit(tx, "categoryId", tx.categoryId ?? " ")}
                        title="Clic para editar"
                      >
                        {tx.category?.name ?? categories.find((c) => c.id === tx.categoryId)?.name ?? "-"}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-1.5 px-4 text-text-muted">
                    {tx.account?.name ?? accounts.find((a) => a.id === tx.accountId)?.name ?? "-"}
                  </TableCell>

                  <TableCell
                    className={`py-1.5 px-4 text-right font-medium whitespace-nowrap ${
                      tx.type === "income"
                        ? "text-income"
                        : tx.type === "expense"
                          ? "text-expense"
                          : "text-savings"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "↔"}{" "}
                    {formatCurrency(Math.abs(tx.amount))}
                  </TableCell>

                  <TableCell className="py-1.5 px-4 flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(tx)}
                      className="text-text-muted hover:text-primary transition-colors p-1"
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(tx.id)}
                      className="text-text-muted hover:text-expense transition-colors p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
            <span>
              Mostrando {from}-{to} de {total} transacciones
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs">Por pagina:</span>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="px-2 text-xs">
                  {page} / {totalPages()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages()}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
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
