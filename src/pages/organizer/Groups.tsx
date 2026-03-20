import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { store, type MockGroup } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, Trash2, ArrowLeft, UserMinus, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SPORTS = ['Badminton', 'Basketball', 'Volleyball', 'Futsal', 'Tennis', 'Swimming', 'Running', 'Other'];

export default function OrganizerGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', sport: 'Badminton' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', description: '', sport: '' });

  if (!user) return null;

  const groups = store.listGroupsByOrganizer(user.id);

  const handleCreate = () => {
    if (!newGroup.name.trim()) { toast.error('Please enter a group name'); return; }
    store.createGroup(user.id, newGroup.name.trim(), newGroup.description.trim(), newGroup.sport);
    setNewGroup({ name: '', description: '', sport: 'Badminton' });
    setShowCreate(false);
    setRefresh(n => n + 1);
    toast.success('Group created!');
  };

  const handleDelete = (groupId: string) => {
    store.deleteGroup(groupId);
    setRefresh(n => n + 1);
    toast.success('Group deleted');
  };

  const handleEdit = (group: MockGroup) => {
    setEditingId(group.id);
    setEditData({ name: group.name, description: group.description, sport: group.sport });
  };

  const handleSaveEdit = (groupId: string) => {
    if (!editData.name.trim()) { toast.error('Name cannot be empty'); return; }
    store.updateGroup(groupId, { name: editData.name.trim(), description: editData.description.trim(), sport: editData.sport });
    setEditingId(null);
    setRefresh(n => n + 1);
    toast.success('Group updated!');
  };

  const handleRemoveMember = (groupId: string, memberId: string) => {
    store.leaveGroup(memberId, groupId);
    setRefresh(n => n + 1);
    toast.success('Member removed');
  };

  return (
    <div className="container py-10 px-4 max-w-5xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/organizer/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>My Groups & Teams</h1>
          <p className="text-muted-foreground mt-1">Manage your sports communities and member rosters.</p>
        </div>
        <Button
          size="lg"
          className="rounded-full font-bold px-8"
          style={{ background: showCreate ? '#e5e7eb' : '#C47A00', color: showCreate ? '#111' : '#fff' }}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Create Group</>}
        </Button>
      </div>

      {/* Create Group Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-8 overflow-hidden"
          >
            <Card className="border-2" style={{ borderColor: 'rgba(196,122,0,0.25)', background: '#FFFBF0' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#C47A00' }}>
                  <Plus className="h-5 w-5" /> New Group
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Group Name *</Label>
                    <Input
                      placeholder="e.g. Weekend Warriors"
                      value={newGroup.name}
                      onChange={e => setNewGroup(s => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sport</Label>
                    <select
                      value={newGroup.sport}
                      onChange={e => setNewGroup(s => ({ ...s, sport: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Input
                    placeholder="Short description about this group..."
                    value={newGroup.description}
                    onChange={e => setNewGroup(s => ({ ...s, description: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="rounded-full font-bold px-8"
                  style={{ background: '#C47A00', color: '#fff' }}
                  onClick={handleCreate}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Group
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card className="p-20 text-center border-dashed bg-muted/5">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#111' }}>No groups yet</h3>
          <p className="text-muted-foreground mb-6">Create your first group to organise your sports community.</p>
          <Button
            className="rounded-full font-bold px-8"
            style={{ background: '#C47A00', color: '#fff' }}
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create First Group
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const isEditing = editingId === group.id;
            const members = group.memberIds.map(id => store.getUser(id)).filter(Boolean);

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-2 hover:shadow-elegant transition-all" style={{ borderColor: 'rgba(196,122,0,0.12)' }}>
                  <CardHeader className="pb-4" style={{ background: '#FFFBF0' }}>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <Input
                            value={editData.name}
                            onChange={e => setEditData(s => ({ ...s, name: e.target.value }))}
                            placeholder="Group name"
                            className="font-bold text-lg"
                          />
                          <select
                            value={editData.sport}
                            onChange={e => setEditData(s => ({ ...s, sport: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
                          >
                            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <Input
                          value={editData.description}
                          onChange={e => setEditData(s => ({ ...s, description: e.target.value }))}
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="rounded-full" style={{ background: '#1A7A4A', color: '#fff' }} onClick={() => handleSaveEdit(group.id)}>
                            <Save className="mr-1.5 h-3.5 w-3.5" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl" style={{ color: '#111' }}>{group.name}</CardTitle>
                            <Badge className="text-[10px] font-bold" style={{ background: 'rgba(196,122,0,0.12)', color: '#C47A00', border: 'none' }}>
                              {group.sport}
                            </Badge>
                          </div>
                          {group.description && (
                            <CardDescription className="text-sm">{group.description}</CardDescription>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Created {new Date(group.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleEdit(group)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full text-destructive border-destructive/30 hover:bg-destructive/5"
                            onClick={() => handleDelete(group.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      <Users className="h-3.5 w-3.5" /> Members ({members.length})
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {members.map((member) => {
                        if (!member) return null;
                        const isOrganizer = member.id === group.organizerId;
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-xl border bg-background"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                style={{ background: isOrganizer ? 'rgba(26,122,74,0.12)' : 'rgba(196,122,0,0.10)', color: isOrganizer ? '#1A7A4A' : '#C47A00' }}
                              >
                                {member.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: '#111' }}>{member.displayName}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">{isOrganizer ? 'Organizer' : 'Member'}</p>
                              </div>
                            </div>
                            {!isOrganizer && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => handleRemoveMember(group.id, member.id)}
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {members.length === 1 && (
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        Share your group link to invite players to join.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
