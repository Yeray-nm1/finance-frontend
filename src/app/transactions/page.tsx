"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Transaction, Account, Category } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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
import { Plus, Upload, FileDown } from "lucide-react";
import Papa from "papaparse";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDrawerOpen, setCsvDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    type: "expense",
    accountId: "",
    categoryId: "",
  });
  const { isAuthenticated } = useAuth();

  async function loadData() {
    try {
      const [txs, accs, cats] = await Promise.all([
        api.transactions.list(),
        api.accounts.list(),
        api.categories.list(),
      ]);
      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.transactions.create({
        date: new Date(form.date).toISOString(),
        amount: parseFloat(form.amount),
        description: form.description,
        type: form.type as "income" | "expense" | "transfer",
        accountId: form.accountId || undefined,
        categoryId: form.categoryId || undefined,
      });
      setForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        description: "",
        type: "expense",
        accountId: "",
        categoryId: "",
      });
      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  // CSV Import
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState({
    date: "",
    amount: "",
    description: "",
    type: "",
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields || [];
        setCsvColumns(columns);
        setCsvRows(results.data as Record<string, string>[]);

        // Auto-detect mapping
        const newMapping = { date: "", amount: "", description: "", type: "" };
        columns.forEach((col) => {
          const lower = col.toLowerCase();
          if (/date|fecha/.test(lower)) newMapping.date = col;
          if (/amount|importe|monto/.test(lower)) newMapping.amount = col;
          if (/desc|concepto/.test(lower)) newMapping.description = col;
          if (/type|tipo/.test(lower)) newMapping.type = col;
        });
        setMapping(newMapping);
      },
    });
  }

  function getMappedRows() {
    return csvRows.map((row) => {
      const type =
        mapping.type && row[mapping.type]
          ? row[mapping.type].toLowerCase()
          : parseFloat(row[mapping.amount]) >= 0
            ? "income"
            : "expense";
      return {
        date: row[mapping.date] || new Date().toISOString(),
        amount: parseFloat(row[mapping.amount]) || 0,
        description: row[mapping.description] || "",
        type: type as "income" | "expense" | "transfer",
      };
    });
  }

  async function handleImport() {
    const rows = getMappedRows();
    try {
      const result = await api.transactions.importCsv(
        rows as unknown as Record<string, string>[]
      );
      alert(`Importadas ${result.imported} de ${result.total} filas`);
      setCsvDrawerOpen(false);
      setCsvRows([]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <main className="p-8 max-w-6xl mx-auto">
        <p className="font-serif text-xl text-gray-400">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-gray-800">
            Transacciones
          </h1>
          <p className="text-gray-500 mt-1">Gestiona tus movimientos</p>
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
                  Sube un archivo CSV y mapea las columnas
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 mt-4">
                <Input type="file" accept=".csv" onChange={handleFileUpload} />
                {csvRows.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(mapping).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <Label>{key}</Label>
                          <Select
                            value={value}
                            onValueChange={(v) =>
                              setMapping({ ...mapping, [key]: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {csvColumns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getMappedRows().filter((r) => r.type === "income").length}{" "}
                      ingresos,{" "}
                      {getMappedRows().filter((r) => r.type === "expense").length}{" "}
                      gastos, {getMappedRows().length} total
                    </p>
                    <Button onClick={handleImport} className="w-full">
                      Importar {csvRows.length} filas
                    </Button>
                  </>
                )}
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
                <DialogTitle>Nueva Transacción</DialogTitle>
                <DialogDescription>
                  Añade un movimiento manual
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
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
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Ej: Mercadona"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cuenta</Label>
                    <Select
                      value={form.accountId}
                      onValueChange={(v) =>
                        setForm({ ...form, accountId: v })
                      }
                    >
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
                    <Label>Categoría</Label>
                    <Select
                      value={form.categoryId}
                      onValueChange={(v) =>
                        setForm({ ...form, categoryId: v })
                      }
                    >
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
                <Button type="submit" className="w-full">
                  Crear
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
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
                  <TableCell>{tx.category?.name || "-"}</TableCell>
                  <TableCell>{tx.account?.name || "-"}</TableCell>
                  <TableCell
                    className={`text-right font-serif ${
                      tx.type === "income"
                        ? "text-balance-income"
                        : tx.type === "expense"
                          ? "text-balance-expense"
                          : "text-balance-savings"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "↔"}{" "}
                    {formatCurrency(Math.abs(tx.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
