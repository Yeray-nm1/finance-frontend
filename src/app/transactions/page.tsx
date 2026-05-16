"use client";

import { useState, useEffect } from "react";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { Transaction, Account, Category } from "@/types";
import { formatCurrency } from "@/lib/format";


export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDrawerOpen, setCsvDrawerOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newType, setNewType] = useState("expense");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.transactions.list(),
      api.accounts.list(),
      api.categories.list(),
    ])
      .then(([txs, accs, cats]) => {
        setTransactions(txs);
        setAccounts(accs);
        setCategories(cats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newDescription.trim() || !newAmount) return;
    const parsedAmount = Number(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El importe debe ser un número válido mayor que 0');
      return;
    }
    setSaving(true);
    try {
      await api.transactions.create({
        date: newDate,
        amount: parsedAmount,
        description: newDescription.trim(),
        type: newType as "income" | "expense" | "transfer",
        accountId: newAccountId || undefined,
        categoryId: newCategoryId || undefined,
      });
      setNewDescription("");
      setNewAmount("");
      setNewDate(new Date().toISOString().split("T")[0]);
      setNewAccountId("");
      setNewCategoryId("");
      setDialogOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear transacción");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-text-muted">Cargando...</p>
        </div>
      </main>
    );
  }

  if (error) {
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Transacciones
            </h1>
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
                  <DrawerDescription>
                    Sube un archivo CSV con tus movimientos
                  </DrawerDescription>
                </DrawerHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-text-muted">
                    Funcionalidad disponible con conexion al backend
                  </p>
                  <Button variant="secondary" className="w-full" onClick={() => setCsvDrawerOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" /> Añadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Transaccion</DialogTitle>
                  <DialogDescription>
                    Anade un movimiento manual
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select defaultValue="expense" value={newType} onValueChange={setNewType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Gasto</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Importe</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripcion</Label>
                    <Input
                      placeholder="Ej: Mercadona"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cuenta</Label>
                      <Select value={newAccountId} onValueChange={setNewAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Creando..." : "Crear"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead className="text-right">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {new Date(tx.date).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {tx.description}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {tx.category?.name ?? categories.find((c) => c.id === tx.categoryId)?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {tx.account?.name ?? accounts.find((a) => a.id === tx.accountId)?.name ?? "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
