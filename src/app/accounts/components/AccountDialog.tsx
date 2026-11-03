"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Account } from "@/types/accounts";

interface AccountDialogProps {
  readonly open: boolean;
  readonly account: Account | null;
  readonly saving: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (name: string, type: Account["type"]) => void;
}

export function AccountDialog({
  open,
  account,
  saving,
  onOpenChange,
  onSubmit,
}: Readonly<AccountDialogProps>) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("checking");

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setType(account?.type ?? "checking");
  }, [open, account]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, type);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle>
          <DialogDescription>
            {account
              ? "Cambia el nombre o el tipo de la cuenta"
              : "Ponle un nombre para identificar tus movimientos"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nombre</Label>
            <Input
              id="account-name"
              placeholder="Ej: Cuenta principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-type">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
              <SelectTrigger id="account-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Cuenta corriente</SelectItem>
                <SelectItem value="savings">Ahorro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={saving || !name.trim()}>
            {saving ? "Guardando..." : account ? "Guardar cambios" : "Crear cuenta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
