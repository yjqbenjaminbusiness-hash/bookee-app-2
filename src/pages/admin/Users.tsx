import { store } from '../../lib/mockData';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { User, Mail, Shield, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { MockUser } from '../../lib/mockData';

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin':
      return <Badge className="bg-primary hover:bg-primary/90"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>;
    case 'organizer':
      return <Badge className="bg-accent hover:bg-accent/90"><Calendar className="h-3 w-3 mr-1" /> Organizer</Badge>;
    default:
      return <Badge variant="secondary"><User className="h-3 w-3 mr-1" /> Player</Badge>;
  }
}

function getStatusBadge(u: MockUser) {
  if (u.role === 'organizer') {
    if (u.verified) return <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/5"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>;
    if (u.pendingVerification) return <Badge variant="outline" className="text-amber-500 border-amber-500 bg-amber-500/5"><ShieldAlert className="h-3 w-3 mr-1" /> Pending</Badge>;
    return <Badge variant="outline" className="text-destructive border-destructive">Rejected</Badge>;
  }
  return <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>;
}

export default function AdminUsers() {
  const users = store.users;

  return (
    <div className="container py-10 px-4">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all players, organizers, and admins</p>
      </div>

      <Card className="shadow-sm border-primary/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No users found.</TableCell></TableRow>
            ) : (
              users.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted"><User className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.displayName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>{getStatusBadge(u)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
