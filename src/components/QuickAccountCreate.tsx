"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Account } from "@/types/accounts";

interface QuickAccountCreateProps {
  readonly onCreated: (account: Account) => void;
  readonly type?: Account["type"];
  readonly label?: string;
  readonly nameLabel?: string;
  readonly placeholder?: string;
}

export function QuickAccountCreate({
  onCreated,
  type = "checking",
  label = "+ Nueva cuenta",
  nameLabel = "Nombre de la nueva cuenta",
  placeholder = "Ej: Cuenta principal",
}: QuickAccountCreateProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setName("");
    setError(null);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Pon un nombre a la cuenta");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const account = await api.accounts.create({ name: trimmed, type });
      onCreated(account);
      toast({ title: "Cuenta creada" });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary hover:underline"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          aria-label={nameLabel}
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreate();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              reset();
            }
          }}
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          disabled={saving || !name.trim()}
        >
          {saving ? "Creando..." : "Crear"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Cancelar nueva cuenta"
          onClick={reset}
          disabled={saving}
        >
          ×
        </Button>
      </div>
      {error && (
        <p className="text-xs text-expense" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
