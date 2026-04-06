import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService, type Group } from '../../lib/data';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, Trash2, ArrowLeft, Edit2, Save, X, ImagePlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';



export default function OrganizerGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', sport: '' });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', description: '', sport: '' });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');

  useEffect(() => {
    if (!user) return;
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const g = await dataService.listGroupsByOrganizer(user.id);
      setGroups(g);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const handleCreate = async () => {
    if (!newGroup.name.trim()) { toast.error('Please enter a group name'); return; }
    setIsCreating(true);
    try {
      const group = await dataService.createGroup({
        organizer_id: user.id,
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
        sport: newGroup.sport,
      });
      if (group && newImageFile) {
        const imageUrl = await dataService.uploadGroupImage(newImageFile, group.id);
        if (imageUrl) {
          await dataService.updateGroup(group.id, { image_url: imageUrl } as any);
        }
      }
      setNewGroup({ name: '', description: '', sport: 'Badminton' });
      setNewImageFile(null);
      setNewImagePreview('');
      setShowCreate(false);
      toast.success('Group created!');
      await loadGroups();
    } catch (err: any) {
      toast.error('Failed to create group: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    try {
      await dataService.deleteGroup(groupId);
      toast.success('Group deleted');
      await loadGroups();
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingId(group.id);
    setEditData({ name: group.name, description: group.description || '', sport: group.sport });
  };

  const handleSaveEdit = async (groupId: string) => {
    if (!editData.name.trim()) { toast.error('Name cannot be empty'); return; }
    try {
      const updates: any = {
        name: editData.name.trim(),
        description: editData.description.trim(),
        sport: editData.sport,
      };
      if (editImageFile) {
        const imageUrl = await dataService.uploadGroupImage(editImageFile, groupId);
        if (imageUrl) updates.image_url = imageUrl;
      }
      await dataService.updateGroup(groupId, updates);
      setEditingId(null);
      setEditImageFile(null);
      setEditImagePreview('');
      toast.success('Group updated!');
      await loadGroups();
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#C47A00' }} />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 max-w-5xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/organizer/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>My Groups & Teams</h1>
          <p className="text-muted-foreground mt-1">Manage your sports communities.</p>
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
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="mb-8 overflow-hidden">
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
                    <Input placeholder="e.g. Weekend Warriors" value={newGroup.name} onChange={e => setNewGroup(s => ({ ...s, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sport</Label>
                    <Input placeholder="e.g. Badminton, Futsal, Tennis" value={newGroup.sport} onChange={e => setNewGroup(s => ({ ...s, sport: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Input placeholder="Short description about this group..." value={newGroup.description} onChange={e => setNewGroup(s => ({ ...s, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ImagePlus className="h-3 w-3" /> Banner Image (Optional)
                  </Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-[#C47A00]/20 hover:border-[#C47A00]/40 cursor-pointer transition-colors">
                      <ImagePlus className="h-4 w-4" style={{ color: '#C47A00' }} />
                      <span className="text-sm text-muted-foreground">{newImageFile ? newImageFile.name : 'Upload image'}</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {newImagePreview && <img src={newImagePreview} alt="Preview" className="h-16 w-24 object-cover rounded-lg border" />}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="rounded-full font-bold px-8" style={{ background: '#C47A00', color: '#fff' }} onClick={handleCreate} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <Button className="rounded-full font-bold px-8" style={{ background: '#C47A00', color: '#fff' }} onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create First Group
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const isEditing = editingId === group.id;
            return (
              <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="overflow-hidden border-2 hover:shadow-lg transition-all" style={{ borderColor: 'rgba(196,122,0,0.12)' }}>
                  {/* Banner */}
                  {group.image_url && !isEditing && (
                    <div className="h-32 overflow-hidden">
                      <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-4" style={{ background: '#FFFBF0' }}>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <Input value={editData.name} onChange={e => setEditData(s => ({ ...s, name: e.target.value }))} placeholder="Group name" className="font-bold text-lg" />
                          <Input value={editData.sport} onChange={e => setEditData(s => ({ ...s, sport: e.target.value }))} placeholder="e.g. Badminton, Futsal, Tennis" />
                        </div>
                        <Input value={editData.description} onChange={e => setEditData(s => ({ ...s, description: e.target.value }))} placeholder="Description" />
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <ImagePlus className="h-3 w-3" /> Banner Image
                          </Label>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-[#C47A00]/20 hover:border-[#C47A00]/40 cursor-pointer transition-colors">
                              <ImagePlus className="h-4 w-4" style={{ color: '#C47A00' }} />
                              <span className="text-sm text-muted-foreground">{editImageFile ? editImageFile.name : 'Upload new image'}</span>
                              <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) { setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file)); }
                              }} className="hidden" />
                            </label>
                            {(editImagePreview || group.image_url) && (
                              <img src={editImagePreview || group.image_url!} alt="Preview" className="h-16 w-24 object-cover rounded-lg border" />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="rounded-full" style={{ background: '#1A7A4A', color: '#fff' }} onClick={() => handleSaveEdit(group.id)}>
                            <Save className="mr-1.5 h-3.5 w-3.5" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setEditingId(null); setEditImageFile(null); setEditImagePreview(''); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl" style={{ color: '#111' }}>{group.name}</CardTitle>
                            <Badge className="text-[10px] font-bold" style={{ background: 'rgba(196,122,0,0.12)', color: '#C47A00', border: 'none' }}>{group.sport}</Badge>
                          </div>
                          {group.description && <CardDescription className="text-sm">{group.description}</CardDescription>}
                          <p className="text-[10px] text-muted-foreground mt-1">Created {new Date(group.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEdit(group)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => handleDelete(group.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      <Users className="h-3.5 w-3.5" /> Members ({group.member_count || 0})
                    </div>
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
