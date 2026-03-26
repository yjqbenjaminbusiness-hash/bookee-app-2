import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService, type Group } from '../../lib/data';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Users, Calendar, UserPlus, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const all = await dataService.listGroups();
      setAllGroups(all);
      if (user) {
        const joined = await dataService.listGroupsForUser(user.id);
        setJoinedGroups(joined);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleJoin = async (groupId: string) => {
    if (!user) { toast.error('Please log in to join a group'); navigate('/login'); return; }
    setJoiningId(groupId);
    try {
      await dataService.joinGroup(user.id, groupId);
      toast.success('Successfully joined the group!');
      await loadData();
    } catch (error) {
      toast.error('Failed to join group.');
    } finally {
      setJoiningId(null);
    }
  };

  const filteredGroups = allGroups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 max-w-6xl space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Lora, serif' }}>Community Groups</h1>
          <p className="text-muted-foreground">Find and join sports communities in Singapore.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search by name or sport..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="space-y-12">
        {/* Joined Groups */}
        {user && joinedGroups.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <h2 className="text-2xl font-bold">My Groups</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedGroups.map(group => (
                <Card key={group.id} className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-primary/5 group"
                  onClick={() => navigate(`/player/groups/${group.id}`)}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{group.name}</h3>
                        <p className="text-sm text-primary font-medium">{group.sport}</p>
                      </div>
                      <div className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-bold">Member</div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                    <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium"><Users className="h-3.5 w-3.5" /> {group.member_count || 0} Members</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Discover */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Search className="h-5 w-5 text-primary" /></div>
            <h2 className="text-2xl font-bold">Discover Groups</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.filter(g => !joinedGroups.some(jg => jg.id === g.id)).map(group => (
              <Card key={group.id} className="p-6 hover:shadow-xl transition-all border-2 border-primary/5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl">{group.name}</h3>
                    <p className="text-sm text-primary font-medium">{group.sport}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium"><Users className="h-3.5 w-3.5" /> {group.member_count || 0} Members</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Button className="w-full rounded-xl font-bold" variant="outline" onClick={() => handleJoin(group.id)} disabled={joiningId === group.id}>
                    {joiningId === group.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    Join Community
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredGroups.filter(g => !joinedGroups.some(jg => jg.id === g.id)).length === 0 && (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-bold text-lg">No more groups to discover</p>
              <p className="text-sm text-muted-foreground mt-1">You've joined all available groups or none match your search.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
