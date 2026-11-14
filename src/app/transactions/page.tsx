"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
import { TransactionsMobileList } from "@/app/transactions/components/TransactionsMobileList";
import { TransactionsPagination } from "@/app/transactions/components/TransactionsPagination";
import { BulkActionsBar } from "@/app/transactions/components/BulkActionsBar";
import { NO_ACCOUNT_SENTINEL, NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";
import { api } from "@/lib/api";
import type { Transaction, TransactionType, TransferKind, TransferDirection, UpdateTransactionDTO } from "@/types/transactions";
import type { TransactionFlow } from "@/types/filter";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import {
  formatMonthValue,
  getMonthDateRange,
  isValidMonthValue,
  writeStoredMonth,
} from "@/lib/selected-month";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function getFullMonthValue(dates: { from?: Date; to?: Date }): string | null {
  if (!dates.from || !dates.to) return null;
  const { from, to } = dates;
  if (from.getDate() !== 1) return null;
  if (from.getFullYear() !== to.getFullYear() || from.getMonth() !== to.getMonth()) return null;
  const lastDay = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
  if (to.getDate() !== lastDay) return null;
  return formatMonthValue(from.getFullYear(), from.getMonth() + 1);
}

function parseFlowParam(value: string | null): "" | TransactionFlow {
  return value === "expense" || value === "income" || value === "savings" ? value : "";
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TransactionsPageContent />
    </Suspense>
  );
}

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchString = searchParams.toString();
  const urlType = searchParams.get("type");
  const urlCategoryId = searchParams.get("categoryId");
  const urlUncategorized = searchParams.get("uncategorized") === "true";
  const urlMonth = searchParams.get("month");
  const urlFlow = searchParams.get("flow");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [filterType, setFilterType] = useState<"" | TransactionType>(
    urlType === "income" || urlType === "expense" || urlType === "transfer"
      ? urlType
      : ""
  );
  const [filterFlow, setFilterFlow] = useState<"" | TransactionFlow>(parseFlowParam(urlFlow));
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>(
    urlUncategorized
      ? [NO_CATEGORY_SENTINEL]
      : urlCategoryId
        ? [urlCategoryId]
        : []
  );
  const [filterAccountIds, setFilterAccountIds] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubscriptionIds, setFilterSubscriptionIds] = useState<string[]>([]);
  const [pendingCategoryNames, setPendingCategoryNames] = useState<{
    names: string[];
    uncategorized: boolean;
  } | null>(null);
  const [pendingAccountNames, setPendingAccountNames] = useState<string[] | null>(null);
  const [pendingSubscriptionNames, setPendingSubscriptionNames] = useState<string[] | null>(null);
  const [listsReady, setListsReady] = useState(false);
  const [filterDates, setFilterDates] = useState<{ from?: Date; to?: Date }>(
    getMonthDateRange(urlMonth) ?? {}
  );
  const [monthReady, setMonthReady] = useState(false);

  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTxId, setEditTxId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkAccountId, setBulkAccountId] = useState("");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newType, setNewType] = useState<TransactionType>("expense");
  const [newTransferKind, setNewTransferKind] = useState<TransferKind>("internal");
  const [newTransferDirection, setNewTransferDirection] = useState<TransferDirection>("out");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newTransferAccountId, setNewTransferAccountId] = useState(NO_ACCOUNT_SENTINEL);
  const [newCategoryId, setNewCategoryId] = useState(NO_CATEGORY_SENTINEL);
  const [newIsSubscription, setNewIsSubscription] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastAppliedSearchRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resolvedCategoryIds = filterCategoryIds.filter(
        (id) => id !== NO_CATEGORY_SENTINEL
      );
      const [txResult, accs, cats, subs] = await Promise.all([
        api.transactions.list({
          page,
          limit,
          type: filterFlow ? undefined : filterType || undefined,
          flow: filterFlow || undefined,
          categoryIds:
            resolvedCategoryIds.length > 0 ? resolvedCategoryIds.join(",") : undefined,
          uncategorized: filterCategoryIds.includes(NO_CATEGORY_SENTINEL) || undefined,
          accountIds: filterAccountIds.length > 0 ? filterAccountIds.join(",") : undefined,
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
      setListsReady(true);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las transacciones");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, filterFlow, filterCategoryIds, filterAccountIds, searchQuery, filterSubscriptionIds, filterDates, sortBy, sortOrder]);

  useEffect(() => {
    if (lastAppliedSearchRef.current === searchString) return;
    lastAppliedSearchRef.current = searchString;

    const params = new URLSearchParams(searchString);
    const type = params.get("type");
    const flow = parseFlowParam(params.get("flow"));
    const categoryNames = params.getAll("category");
    const categoryIdsParam = params.get("categoryId");
    const uncategorized = params.get("uncategorized") === "true";
    const accountNames = params.getAll("account");
    const accountIdsParam = params.get("accountId");
    const subscriptionNames = params.getAll("subscriptions");
    const month = params.get("month");
    const from = parseDateParam(params.get("dateFrom"));
    const to = parseDateParam(params.get("dateTo"));
    const search = params.get("search") ?? "";

    setFilterType(
      flow
        ? ""
        : type === "income" || type === "expense" || type === "transfer"
          ? type
          : ""
    );
    setFilterFlow(flow);
    if (categoryNames.length > 0) {
      setPendingCategoryNames({ names: categoryNames, uncategorized });
      setFilterCategoryIds(uncategorized ? [NO_CATEGORY_SENTINEL] : []);
    } else if (categoryIdsParam) {
      setPendingCategoryNames(null);
      setFilterCategoryIds([
        ...categoryIdsParam.split(",").filter(Boolean),
        ...(uncategorized ? [NO_CATEGORY_SENTINEL] : []),
      ]);
    } else {
      setPendingCategoryNames(null);
      setFilterCategoryIds(uncategorized ? [NO_CATEGORY_SENTINEL] : []);
    }
    if (accountNames.length > 0) {
      setPendingAccountNames(accountNames);
      setFilterAccountIds([]);
    } else if (accountIdsParam) {
      setPendingAccountNames(null);
      setFilterAccountIds(accountIdsParam.split(",").filter(Boolean));
    } else {
      setPendingAccountNames(null);
      setFilterAccountIds([]);
    }
    if (subscriptionNames.length > 0) {
      setPendingSubscriptionNames(subscriptionNames);
      setFilterSubscriptionIds([]);
    } else {
      setPendingSubscriptionNames(null);
      setFilterSubscriptionIds(
        (params.get("subscriptionIds") ?? "").split(",").filter(Boolean)
      );
    }
    setFilterSearch(search);
    setSearchQuery(search);

    if (from || to) {
      setFilterDates({ from, to });
    } else if (isValidMonthValue(month)) {
      writeStoredMonth(month);
      setFilterDates(getMonthDateRange(month) ?? {});
    } else {
      setFilterDates({});
    }

    const parsedPage = Number(params.get("page") ?? "1");
    const parsedLimit = Number(params.get("limit") ?? "20");
    const parsedSortBy = params.get("sortBy");
    const parsedSortOrder = params.get("sortOrder");

    setPage(Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1);
    setLimit(parsedLimit === 50 || parsedLimit === 100 ? parsedLimit : 20);
    setSortBy(
      parsedSortBy === "amount" || parsedSortBy === "description" ? parsedSortBy : "date"
    );
    setSortOrder(parsedSortOrder === "asc" ? "asc" : "desc");
    setMonthReady(true);
  }, [searchString]);

  useEffect(() => {
    if (!listsReady) return;

    if (pendingCategoryNames !== null) {
      const ids = pendingCategoryNames.names
        .map((name) => categories.find((category) => category.name === name)?.id)
        .filter((id): id is string => Boolean(id));
      setFilterCategoryIds([
        ...(pendingCategoryNames.uncategorized ? [NO_CATEGORY_SENTINEL] : []),
        ...ids,
      ]);
      setPendingCategoryNames(null);
    }

    if (pendingAccountNames !== null) {
      const ids = pendingAccountNames
        .map((name) => accounts.find((account) => account.name === name)?.id)
        .filter((id): id is string => Boolean(id));
      setFilterAccountIds(ids);
      setPendingAccountNames(null);
    }

    if (pendingSubscriptionNames !== null) {
      const ids = pendingSubscriptionNames
        .map((name) => subscriptions.find((subscription) => subscription.name === name)?.id)
        .filter((id): id is string => Boolean(id));
      setFilterSubscriptionIds(ids);
      setPendingSubscriptionNames(null);
    }
  }, [
    listsReady,
    pendingCategoryNames,
    pendingAccountNames,
    pendingSubscriptionNames,
    categories,
    accounts,
    subscriptions,
  ]);

  useEffect(() => {
    if (!listsReady) return;

    if (filterCategoryIds.length > 0) {
      const resolved = filterCategoryIds.filter(
        (id) =>
          id === NO_CATEGORY_SENTINEL ||
          categories.some((category) => category.id === id)
      );
      if (resolved.length !== filterCategoryIds.length) {
        setFilterCategoryIds(resolved);
      }
    }

    if (filterAccountIds.length > 0) {
      const resolved = filterAccountIds.filter((id) =>
        accounts.some((account) => account.id === id)
      );
      if (resolved.length !== filterAccountIds.length) {
        setFilterAccountIds(resolved);
      }
    }

    if (filterSubscriptionIds.length > 0) {
      const resolved = filterSubscriptionIds.filter((id) =>
        subscriptions.some((subscription) => subscription.id === id)
      );
      if (resolved.length !== filterSubscriptionIds.length) {
        setFilterSubscriptionIds(resolved);
      }
    }
  }, [
    listsReady,
    filterCategoryIds,
    filterAccountIds,
    filterSubscriptionIds,
    categories,
    accounts,
    subscriptions,
  ]);

  useEffect(() => {
    if (!monthReady || !listsReady) return;
    if (
      pendingCategoryNames !== null ||
      pendingAccountNames !== null ||
      pendingSubscriptionNames !== null
    ) {
      return;
    }

    const params = new URLSearchParams();
    if (filterFlow) params.set("flow", filterFlow);
    else if (filterType) params.set("type", filterType);
    if (filterCategoryIds.includes(NO_CATEGORY_SENTINEL)) {
      params.set("uncategorized", "true");
    }
    for (const id of filterCategoryIds) {
      if (id === NO_CATEGORY_SENTINEL) continue;
      const category = categories.find((item) => item.id === id);
      if (category) params.append("category", category.name);
    }
    for (const id of filterAccountIds) {
      const account = accounts.find((item) => item.id === id);
      if (account) params.append("account", account.name);
    }
    if (filterSearch.trim()) params.set("search", filterSearch.trim());
    if (filterSubscriptionIds.length > 0) {
      for (const id of filterSubscriptionIds) {
        const subscription = subscriptions.find((item) => item.id === id);
        if (subscription) params.append("subscriptions", subscription.name);
      }
    }

    const monthValue = getFullMonthValue(filterDates);
    if (monthValue) {
      params.set("month", monthValue);
    } else {
      if (filterDates.from) params.set("dateFrom", format(filterDates.from, "yyyy-MM-dd"));
      if (filterDates.to) params.set("dateTo", format(filterDates.to, "yyyy-MM-dd"));
    }

    if (page > 1) params.set("page", String(page));
    if (limit !== 20) params.set("limit", String(limit));
    if (sortBy !== "date" || sortOrder !== "desc") {
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    }

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl === currentUrl) return;

    lastAppliedSearchRef.current = query;
    window.history.replaceState(null, "", nextUrl);
  }, [
    monthReady,
    listsReady,
    pendingCategoryNames,
    pendingAccountNames,
    pendingSubscriptionNames,
    filterType,
    filterFlow,
    filterCategoryIds,
    filterAccountIds,
    filterSearch,
    filterSubscriptionIds,
    filterDates,
    categories,
    accounts,
    subscriptions,
    page,
    limit,
    sortBy,
    sortOrder,
    pathname,
  ]);

  useEffect(() => {
    if (!monthReady) return;
    loadData();
  }, [loadData, monthReady]);

  useEffect(() => {
    setSelectedIds(new Set());
    setBulkCategoryId("");
    setBulkAccountId("");
  }, [
    page,
    limit,
    filterType,
    filterFlow,
    filterCategoryIds,
    filterAccountIds,
    searchQuery,
    filterSubscriptionIds,
    filterDates,
    sortBy,
    sortOrder,
  ]);

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
    setFilterFlow("");
    setFilterCategoryIds([]);
    setFilterAccountIds([]);
    setFilterSearch("");
    setFilterSubscriptionIds([]);
    setFilterDates({});
    setPendingCategoryNames(null);
    setPendingAccountNames(null);
    setPendingSubscriptionNames(null);
    setPage(1);
  }

  function resetSort() {
    setSortBy("date");
    setSortOrder("desc");
    setPage(1);
  }

  function hasActiveFilters() {
    return (
      filterType ||
      filterFlow ||
      filterCategoryIds.length > 0 ||
      filterAccountIds.length > 0 ||
      filterSearch ||
      filterSubscriptionIds.length > 0 ||
      filterDates.from ||
      filterDates.to ||
      pendingCategoryNames ||
      pendingAccountNames ||
      (pendingSubscriptionNames?.length ?? 0) > 0
    );
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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (transactions.length === 0) return;
    const allSelected = transactions.every((tx) => selectedIds.has(tx.id));
    setSelectedIds(allSelected ? new Set() : new Set(transactions.map((tx) => tx.id)));
  }

  async function handleBulkApply() {
    if (selectedIds.size === 0) return;

    const categoryChanged = bulkCategoryId !== "";
    const accountChanged = bulkAccountId !== "";
    if (!categoryChanged && !accountChanged) return;

    const ids = [...selectedIds];
    const previous = new Map<string, { categoryId: string | null; accountId: string | null }>();
    for (const tx of transactions) {
      if (selectedIds.has(tx.id)) {
        previous.set(tx.id, { categoryId: tx.categoryId, accountId: tx.accountId });
      }
    }

    const payload: { categoryId?: string | null; accountId?: string | null } = {};
    if (categoryChanged) {
      payload.categoryId = bulkCategoryId === NO_CATEGORY_SENTINEL ? null : bulkCategoryId;
    }
    if (accountChanged) {
      payload.accountId = bulkAccountId === NO_ACCOUNT_SENTINEL ? null : bulkAccountId;
    }

    const nextCategoryId = payload.categoryId;
    const nextAccountId = payload.accountId;
    const category = nextCategoryId
      ? categories.find((item) => item.id === nextCategoryId) ?? null
      : null;
    const account = nextAccountId
      ? accounts.find((item) => item.id === nextAccountId) ?? null
      : null;

    setBulkApplying(true);
    try {
      await api.transactions.updateMany(ids, payload);
      setTransactions((prev) =>
        prev.map((tx) => {
          if (!selectedIds.has(tx.id)) return tx;
          return {
            ...tx,
            ...(nextCategoryId !== undefined
              ? {
                  categoryId: nextCategoryId,
                  category: category
                    ? { id: category.id, name: category.name, type: category.type }
                    : undefined,
                }
              : {}),
            ...(nextAccountId !== undefined
              ? {
                  accountId: nextAccountId,
                  account: account
                    ? { id: account.id, name: account.name, type: account.type }
                    : undefined,
                }
              : {}),
          };
        })
      );
      setSelectedIds(new Set());
      setBulkCategoryId("");
      setBulkAccountId("");
      toast({
        title: `${ids.length} ${ids.length === 1 ? "transaccion actualizada" : "transacciones actualizadas"}`,
        actionLabel: "Deshacer",
        onAction: async () => {
          try {
            const restored = await Promise.all(
              ids.map((id) => {
                const before = previous.get(id);
                return api.transactions.update(id, {
                  ...(nextCategoryId !== undefined
                    ? { categoryId: before?.categoryId ?? null }
                    : {}),
                  ...(nextAccountId !== undefined
                    ? { accountId: before?.accountId ?? null }
                    : {}),
                });
              })
            );
            const restoredById = new Map(restored.map((tx) => [tx.id, tx]));
            setTransactions((prev) => prev.map((tx) => restoredById.get(tx.id) ?? tx));
            toast({ title: "Cambios deshechos" });
          } catch (err) {
            console.error(err);
            toast({ title: "No se pudo deshacer", variant: "destructive" });
          }
        },
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error al actualizar", variant: "destructive" });
    } finally {
      setBulkApplying(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const ids = [...selectedIds];
    setBulkDeleting(true);
    try {
      const result = await api.transactions.deleteMany(ids);
      setTransactions((prev) => prev.filter((tx) => !selectedIds.has(tx.id)));
      setTotal((prev) => Math.max(0, prev - (result.deleted ?? ids.length)));
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      toast({ title: `${result.deleted} ${result.deleted === 1 ? "transaccion eliminada" : "transacciones eliminadas"}` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error al eliminar", variant: "destructive" });
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const resolvedTransferAccount =
        newTransferAccountId === NO_ACCOUNT_SENTINEL || !newTransferAccountId
          ? null
          : newTransferAccountId;

      if (editTxId) {
        const resolvedCategory = newCategoryId === NO_CATEGORY_SENTINEL ? null : newCategoryId;
        const resolvedAccount =
          newAccountId === NO_ACCOUNT_SENTINEL || !newAccountId ? null : newAccountId;
        const signedTransferAmount = newTransferDirection === "out"
          ? -Math.abs(Number(newAmount))
          : Math.abs(Number(newAmount));
        const resolvedTransferAccountId = newType === "transfer" ? resolvedTransferAccount : null;
        await api.transactions.update(editTxId, {
          description: newDescription.trim(),
          categoryId: resolvedCategory,
          accountId: resolvedAccount,
          isSubscription: newIsSubscription,
          ...(newType === "transfer"
            ? { transferKind: newTransferKind, amount: signedTransferAmount }
            : {}),
          transferAccountId: resolvedTransferAccountId,
        });
        const selectedAccount = accounts.find((acc) => acc.id === resolvedAccount);
        const selectedTransferAccount = accounts.find(
          (acc) => acc.id === resolvedTransferAccountId
        );
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
                  transferAccountId: resolvedTransferAccountId,
                  transferAccount: selectedTransferAccount
                    ? {
                        id: selectedTransferAccount.id,
                        name: selectedTransferAccount.name,
                        type: selectedTransferAccount.type,
                      }
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
          ...(newType === "transfer" && newTransferKind === "internal" && resolvedTransferAccount
            ? { transferAccountId: resolvedTransferAccount }
            : {}),
          accountId: newAccountId === NO_ACCOUNT_SENTINEL ? undefined : newAccountId || undefined,
          categoryId: newCategoryId === NO_CATEGORY_SENTINEL ? undefined : newCategoryId || undefined,
          isSubscription: newIsSubscription,
        });
        setNewDescription("");
        setNewAmount("");
        setNewDate(new Date().toISOString().split("T")[0]);
        setNewAccountId("");
        setNewTransferAccountId(NO_ACCOUNT_SENTINEL);
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
    setNewTransferAccountId(tx.transferAccountId ?? NO_ACCOUNT_SENTINEL);
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
  const selectedTransactions = transactions.filter((tx) => selectedIds.has(tx.id));

  if (loading && transactions.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && transactions.length === 0) {
    return <ErrorState message={error} onRetry={loadData} fullPage />;
  }

  return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Transacciones</h1>
              <p className="text-sm text-text-muted mt-1">Gestiona tus movimientos</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
                newTransferAccountId={newTransferAccountId}
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
                    setNewTransferAccountId(NO_ACCOUNT_SENTINEL);
                    setNewCategoryId(NO_CATEGORY_SENTINEL);
                    setNewIsSubscription(false);
                  }
                }}
                onDateChange={setNewDate}
                onTypeChange={(type) => {
                  setNewType(type);
                  if (type !== "transfer") setNewTransferAccountId(NO_ACCOUNT_SENTINEL);
                }}
                onTransferKindChange={(kind) => {
                  setNewTransferKind(kind);
                  if (kind === "external") setNewTransferAccountId(NO_ACCOUNT_SENTINEL);
                }}
                onTransferDirectionChange={setNewTransferDirection}
                onAmountChange={setNewAmount}
                onDescriptionChange={setNewDescription}
                onAccountIdChange={(accountId) => {
                  setNewAccountId(accountId);
                  if (accountId === newTransferAccountId) {
                    setNewTransferAccountId(NO_ACCOUNT_SENTINEL);
                  }
                }}
                onTransferAccountIdChange={setNewTransferAccountId}
                onAccountCreated={handleAccountCreated}
                onCategoryIdChange={setNewCategoryId}
                onIsSubscriptionChange={setNewIsSubscription}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          <TransactionsFilters
            filterType={filterType}
            filterFlow={filterFlow}
            filterCategoryIds={filterCategoryIds}
            filterAccountIds={filterAccountIds}
            filterSearch={filterSearch}
            filterSubscriptionIds={filterSubscriptionIds}
            filterDates={filterDates}
            accounts={accounts}
            categories={categories}
            subscriptions={subscriptions}
            hasActiveFilters={!!hasActiveFilters()}
            isDefaultSort={sortBy === "date" && sortOrder === "desc"}
            onFilterTypeChange={(v) => {
              setFilterFlow("");
              setFilterType(v);
              setPage(1);
            }}
            onFilterCategoryIdsChange={(v) => { setFilterCategoryIds(v); setPage(1); }}
            onFilterAccountIdsChange={(v) => { setFilterAccountIds(v); setPage(1); }}
            onFilterSearchChange={setFilterSearch}
            onFilterSubscriptionIdsChange={(v) => { setFilterSubscriptionIds(v); setPage(1); }}
            onFilterDatesChange={(dates) => { setFilterDates(dates); setPage(1); }}
            onResetSort={resetSort}
            onClearFilters={clearFilters}
          />

          <BulkActionsBar
            selectedCount={selectedIds.size}
            categories={categories}
            accounts={accounts}
            categoryId={bulkCategoryId}
            accountId={bulkAccountId}
            applying={bulkApplying}
            onCategoryChange={setBulkCategoryId}
            onAccountChange={setBulkAccountId}
            onApply={handleBulkApply}
            onDelete={() => setBulkDeleteOpen(true)}
            onClear={() => {
              setSelectedIds(new Set());
              setBulkCategoryId("");
              setBulkAccountId("");
            }}
          />

          <div className="md:hidden">
            <TransactionsMobileList
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              loading={loading}
              hasActiveFilters={!!hasActiveFilters()}
              selectedIds={selectedIds}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onOpenEdit={handleOpenEdit}
              onDeleteClick={(id) => setDeleteConfirmId(id)}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />
          </div>

          <div className="hidden md:block">
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
              selectedIds={selectedIds}
              onSort={handleSort}
              onStartEdit={startEdit}
              onEditValueChange={setEditValue}
              onCancelEdit={cancelEdit}
              onInlineEdit={handleInlineEdit}
              onOpenEdit={handleOpenEdit}
              onDeleteClick={(id) => setDeleteConfirmId(id)}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />
          </div>

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

        <ConfirmDeleteDialog
          open={bulkDeleteOpen}
          title="Eliminar transacciones"
          description={
            <span>
              Se eliminarán <strong>{selectedIds.size}</strong>{" "}
              {selectedIds.size === 1 ? "transaccion seleccionada" : "transacciones seleccionadas"}.
              Esta accion no se puede deshacer.
              {selectedTransactions.length > 0 && (
                <span className="mt-2 block text-xs text-text-muted">
                  {selectedTransactions
                    .slice(0, 3)
                    .map((tx) => tx.description)
                    .join(", ")}
                  {selectedTransactions.length > 3
                    ? ` y ${selectedTransactions.length - 3} mas`
                    : ""}
                </span>
              )}
            </span>
          }
          loading={bulkDeleting}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteOpen(false)}
        />
      </main>
  );
}
