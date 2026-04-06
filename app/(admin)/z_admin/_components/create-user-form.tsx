"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

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
import { adminCreateUser } from "@/server/user-admin";
import { toast } from "sonner";

type CreateUserFormProps = {
  onUserCreated?: () => void;
};

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await adminCreateUser({
      name,
      email,
      password,
      role,
    });
    if (result.success) {
      toast.success("Usuário criado com sucesso");
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      onUserCreated?.();
    } else {
      toast.error(result.error ?? "Erro ao criar usuário");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <UserPlus className="size-5" />
        Criar usuário
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            placeholder="Ex: João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="joao@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Tipo de usuário</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "user" | "admin")}
            disabled={isSubmitting}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuário normal</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar usuário"}
        </Button>
      </form>
    </div>
  );
}
