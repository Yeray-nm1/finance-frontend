"use client";

import { useState } from "react";
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
import { MOCK_TRANSACTIONS, MOCK_ACCOUNTS, MOCK_CATEGORIES } from "@/lib/mock-data";
import type { Transaction, Account, Category } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDrawerOpen, setCsvDrawerOpen] = useState(false);

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
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select defaultValue="expense">
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
                    <Input type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripcion</Label>
                    <Input placeholder="Ej: Mercadona" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cuenta</Label>
                      <Select>
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
                      <Select>
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
                    {categories.find((c) => c.id === tx.categoryId)?.name || "-"}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {accounts.find((a) => a.id === tx.accountId)?.name || "-"}
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
