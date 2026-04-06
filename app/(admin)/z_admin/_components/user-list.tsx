"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Key, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  adminListUsers,
  adminUpdateUser,
  adminRemoveUser,
  adminSetUserPassword,
} from "@/server/user-admin";
import { toast } from "sonner";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};

type UserListProps = {
  refreshKey?: number;
};

export function UserList({ refreshKey }: UserListProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin">("user");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { users: list } = await adminListUsers();
      setUsers((list as UserItem[]) ?? []);
    } catch {
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers, refreshKey]);

  const openEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole((user.role as "user" | "admin") || "user");
    setEditModalOpen(true);
  };

  const openPassword = (user: UserItem) => {
    setSelectedUser(user);
    setNewPassword("");
    setPasswordModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    const result = await adminUpdateUser(selectedUser.id, {
      name: editName,
      email: editEmail,
      role: editRole,
    });
    if (result.success) {
      toast.success("Usuário atualizado");
      setEditModalOpen(false);
      void fetchUsers();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setIsSubmitting(true);
    const result = await adminSetUserPassword(selectedUser.id, newPassword);
    if (result.success) {
      toast.success("Senha alterada");
      setPasswordModalOpen(false);
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (user: UserItem) => {
    if (!confirm(`Excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`))
      return;
    const result = await adminRemoveUser(user.id);
    if (result.success) {
      toast.success("Usuário excluído");
      void fetchUsers();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Users className="size-5" />
          Usuários ({users.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum usuário cadastrado.
          </p>
        ) : (
          <ul className="space-y-3">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Usuário"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(user)}
                    className="gap-1"
                  >
                    <Edit2 className="size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPassword(user)}
                    className="gap-1"
                  >
                    <Key className="size-4" />
                    Senha
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="gap-1"
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as "user" | "admin")}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Alterar senha
              {selectedUser && (
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  {selectedUser.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Alterar senha
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
