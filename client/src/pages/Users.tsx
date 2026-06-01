import { useState, useMemo, FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Edit2, Plus, Trash2, X, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { UsersSkeleton } from "@/components/PageSkeletons";

type Role = "admin" | "user";

interface UserForm {
  id?: number;
  email: string;
  name: string;
  role: Role;
}

const emptyForm: UserForm = {
  email: "",
  name: "",
  role: "user",
};

export function Users() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  // Fetch users list — live data, 30 s stale
  const users_list = trpc.system.listUsers.useQuery(undefined, {
    enabled: isAdmin, staleTime: 30_000, gcTime: 300_000,
  });

  const filteredUsers = useMemo(() => {
    if (!users_list.data) return [];
    if (!searchQuery.trim()) return users_list.data;
    const query = searchQuery.toLowerCase();
    return users_list.data.filter(
      (u: any) =>
        u.email?.toLowerCase().includes(query) ||
        u.name?.toLowerCase().includes(query)
    );
  }, [users_list.data, searchQuery]);

  const createUser = trpc.system.createUser.useMutation({
    onSuccess: async () => {
      toast.success("User created successfully");
      setForm(emptyForm);
      setEditModalOpen(false);
      await utils.system.listUsers.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateUser = trpc.system.updateUser.useMutation({
    onSuccess: async () => {
      toast.success("User updated successfully");
      setForm(emptyForm);
      setEditModalOpen(false);
      await utils.system.listUsers.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteUser = trpc.system.deleteUser.useMutation({
    onSuccess: async () => {
      toast.success("User deleted successfully");
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      await utils.system.listUsers.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleAddUser = () => {
    setForm(emptyForm);
    setEditModalOpen(true);
  };

  const handleEditUser = (u: any) => {
    setForm({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    });
    setEditModalOpen(true);
  };

  const handleDeleteUser = (id: number) => {
    setDeleteTarget(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteUser.mutate({ id: deleteTarget });
    }
  };

  const submitUser = (event: FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.name) {
      toast.error("Email and name are required");
      return;
    }
    if (form.id) {
      updateUser.mutate({
        id: form.id,
        email: form.email,
        name: form.name,
        role: form.role,
      });
    } else {
      createUser.mutate({
        email: form.email,
        name: form.name,
        role: form.role,
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="blueprint-bg min-h-screen p-4 sm:p-8">
        <Card className="technical-panel mx-auto mt-16 max-w-2xl text-white dimension-frame">
          <CardHeader>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <p>Admin access required to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (users_list.isLoading) {
    return <UsersSkeleton />;
  }

  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-6 py-6 sm:py-8">
        {/* Header */}
        <section className="technical-panel dimension-frame overflow-hidden rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                Users Management
              </h1>
              <p className="mt-2 text-base font-medium text-white/75">
                Manage admin and staff user accounts
              </p>
            </div>
            <Button
              className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white"
              onClick={handleAddUser}
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </section>

        {/* Search */}
        <Card className="technical-panel text-white">
          <CardContent className="p-5">
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-cyan-200" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-cyan-200/30 bg-white/5 text-white placeholder:text-white/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="technical-panel text-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase">Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {users_list.isLoading ? (
              <div className="space-y-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 border-b border-white/[0.06] px-6 py-4"
                    style={{ opacity: 1 - i * 0.15 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="flex-1 h-3 bg-white/10 animate-pulse rounded" />
                    ))}
                  </div>
                ))}
              </div>
            ) : users_list.isError ? (
              <div className="p-8 text-center text-red-200">Failed to load users</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-white/75">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-200/20 bg-white/5">
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u: any, idx: number) => (
                      <tr
                        key={u.id}
                        className={`border-b border-cyan-200/10 ${
                          idx % 2 === 0 ? "bg-white/2" : "bg-transparent"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-white">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-white/75">{u.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            className={
                              u.role === "admin"
                                ? "bg-red-200/20 text-red-200"
                                : "bg-blue-200/20 text-blue-200"
                            }
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className="bg-emerald-200/20 text-emerald-200">Active</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditUser(u)}
                              className="text-cyan-200 hover:bg-cyan-200/10"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-200 hover:bg-red-200/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitUser} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full rounded border border-cyan-200/30 bg-white/5 px-3 py-2 text-white"
              >
                <option value="user">User (Staff)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-cyan-200 text-[#031844] hover:bg-white">
                {form.id ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-200">
              <AlertTriangle className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/75">Are you sure you want to delete this user?</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-red-200 text-[#031844] hover:bg-red-300"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
