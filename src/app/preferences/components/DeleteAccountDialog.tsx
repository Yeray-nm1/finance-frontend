"use client";

import { useState } from "react";
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
import { api } from "@/lib/api";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  onDeleted,
}: Readonly<DeleteAccountDialogProps>) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (deleting) return;
    if (!nextOpen) {
      setPassword("");
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDeleting(true);
    try {
      await api.me.deleteAccount(password);
      onDeleted();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar la cuenta");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Borrar mi cuenta</DialogTitle>
          <DialogDescription>
            Se eliminarán todos tus datos y tu cuenta de forma permanente, y se
            cerrará tu sesión. No podrás volver a iniciar sesión.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-delete-bg text-expense rounded-lg px-4 py-3 text-sm font-medium">
            Esta acción no se puede deshacer.
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-account-password">Contraseña</Label>
            <Input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p className="text-[11px] text-text-muted">
              Introduce tu contraseña para confirmar el borrado.
            </p>
          </div>

          {error && (
            <div className="bg-delete-bg text-expense rounded-lg px-4 py-2.5 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={deleting}>
              {deleting ? "Borrando..." : "Borrar cuenta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
