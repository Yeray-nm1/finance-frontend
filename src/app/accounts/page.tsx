"use client";

import { useState } from "react";
import type { Account } from "@/types";
import { MOCK_ACCOUNTS } from "@/lib/mock-data";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Landmark, PiggyBank } from "lucide-react";

export default function AccountsPage() {
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Cuentas
            </h1>
            <p className="text-sm text-text-muted mt-1">Gestiona tus cuentas bancarias</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Anadir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Cuenta</DialogTitle>
                <DialogDescription>
                  Crea una nueva cuenta bancaria
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: CaixaBank" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select defaultValue="checking">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Corriente</SelectItem>
                      <SelectItem value="savings">Ahorro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Crear
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                      {account.type === "checking" ? (
                        <Landmark className="size-5 text-primary" />
                      ) : (
                        <PiggyBank className="size-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">
                        {account.name}
                      </h3>
                      <p className="text-sm text-text-muted mt-0.5">
                        {account.type === "checking" ? "Corriente" : "Ahorro"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="size-4 text-expense" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
