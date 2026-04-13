'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface Organisation {
  _id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  isOnlinePresenceEnabled: boolean;
  isOwner: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    try {
      const response = await fetch('/api/organisations');
      const data = await response.json();
      if (data.success) {
        setOrganisations(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch organisations');
    } finally {
      setLoading(false);
    }
  };

  const createOrganisation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Organisation created successfully');
        setDialogOpen(false);
        setFormData({ name: '' });
        fetchOrganisations();
      } else {
        toast.error(data.error || 'Failed to create organisation');
      }
    } catch (error) {
      toast.error('Failed to create organisation');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteOrganisation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organisation?')) return;

    try {
      const response = await fetch(`/api/organisations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Organisation deleted successfully');
        fetchOrganisations();
      } else {
        toast.error(data.error || 'Failed to delete organisation');
      }
    } catch (error) {
      toast.error('Failed to delete organisation');
    }
  };

  const toggleOnlinePresence = async (id: string, currentStatus: boolean) => {
    try {
      console.log(
        'Toggling online presence for:',
        id,
        'Current status:',
        currentStatus,
        'New status:',
        !currentStatus
      );

      const response = await fetch(`/api/organisations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnlinePresenceEnabled: !currentStatus }),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        toast.success(`Online presence ${!currentStatus ? 'enabled' : 'disabled'}`);
        fetchOrganisations();
      } else {
        toast.error(data.error || 'Failed to update online presence');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Failed to update online presence');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Organisation Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organisations, hostels, and room configurations
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Organisation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={createOrganisation}>
              <DialogHeader>
                <DialogTitle>Create New Organisation</DialogTitle>
                <DialogDescription>
                  Add a new organisation to your management system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organisation Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter organisation name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Organisation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {organisations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No organisations yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Get started by creating your first organisation. You can then add hostels
              and manage room configurations.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Organisation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organisations.map((organisation) => (
            <Card
              key={organisation._id}
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                !organisation.isOwner ? 'opacity-60' : ''
              }`}
              onClick={() =>
                organisation.isOwner && router.push(`/organisation/${organisation._id}`)
              }
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {organisation.name}
                  {!organisation.isOwner && (
                    <span className="text-xs font-normal text-muted-foreground">
                      (View Only)
                    </span>
                  )}
                </CardTitle>
                {organisation.isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOrganisation(organisation._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Join Code:</span>
                    <span className="font-mono font-semibold">
                      {organisation.joinCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>
                      {new Date(organisation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between pt-2 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Online Presence
                      </span>
                    </div>
                    <Switch
                      checked={organisation.isOnlinePresenceEnabled}
                      onCheckedChange={() =>
                        organisation.isOwner &&
                        toggleOnlinePresence(
                          organisation._id,
                          organisation.isOnlinePresenceEnabled
                        )
                      }
                      disabled={!organisation.isOwner}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

