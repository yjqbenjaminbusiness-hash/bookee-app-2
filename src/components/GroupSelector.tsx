import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Users, Plus, Check, Loader2 } from 'lucide-react';
import { dataService, type Group } from '../lib/data';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

interface GroupSelectorProps {
  onGroupSelected: (groupId: string) => void;
  selectedGroupId?: string;
}

export function GroupSelector({ onGroupSelected, selectedGroupId }: GroupSelectorProps) {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    dataService.listGroupsByOrganizer(user.id).then(g => {
      setGroups(g);
      setIsLoading(false);
    });
  }, [user]);

  if (!user) return null;

  const handleCreate = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    setIsCreating(true);
    try {
      const group = await dataService.createGroup({
        organizer_id: user.id,
        name: newGroupName.trim(),
        sport: 'Other',
      });
      if (group) {
        setGroups(prev => [group, ...prev]);
        setNewGroupName('');
        setShowCreate(false);
        onGroupSelected(group.id);
        toast.success('Group created!');
      }
    } catch (err: any) {
      toast.error('Failed to create group: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const examples = ['Badminton Group', 'Pickleball Group', 'Balloting Group'];

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Select Group
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Tag this session to a group, or create a new one.</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map(group => (
              <button
                key={group.id}
                type="button"
                onClick={() => onGroupSelected(group.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                  selectedGroupId === group.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.sport}</p>
                  </div>
                </div>
                {selectedGroupId === group.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        ) : null}

        {!showCreate ? (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Group
          </Button>
        ) : (
          <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Group Name</Label>
              <Input
                placeholder="e.g. Badminton Group"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setNewGroupName(ex)}
                  className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" className="rounded-full" onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                <Plus className="mr-1 h-3.5 w-3.5" /> Create
              </Button>
              <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
