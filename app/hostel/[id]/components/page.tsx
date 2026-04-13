"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Search, Package2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CreateComponentDialog } from "@/components/room-components/create-component-dialog";
import { EditComponentDialog } from "@/components/room-components/edit-component-dialog";
import { DeleteComponentDialog } from "@/components/room-components/delete-component-dialog";

interface RoomComponent {
  _id: string;
  name: string;
  description: string;
  hostelId: string;
}

export default function RoomComponentsPage() {
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<RoomComponent | null>(null);
  const [components, setComponents] = useState<RoomComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const response = await fetch(`/api/hostels/${params.id}/components`);
      const data = await response.json();
      
      if (data.success) {
        setComponents(data.data);
      } else {
        toast.error("Failed to fetch room components");
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      toast.error("Failed to fetch room components");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (componentId: string) => {
    try {
      const response = await fetch(`/api/hostels/${params.id}/components/${componentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete component");
      }

      toast.success("Component deleted successfully");
      fetchComponents();
      setIsDeleteDialogOpen(false);
      setSelectedComponent(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete component");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} component(s)?`)) {
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const idsArray = Array.from(selectedIds);
      for (const id of idsArray) {
        try {
          const response = await fetch(`/api/hostels/${params.id}/components/${id}`, {
            method: "DELETE",
          });

          const data = await response.json();

          if (response.ok && data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} component(s) deleted successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} component(s)`);
      }

      setSelectedIds(new Set());
      fetchComponents();
    } catch (error) {
      toast.error("Failed to delete components");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredComponents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredComponents.map(c => c._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredComponents = components.filter((component) =>
    component.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ComponentCard = ({ component }: { component: RoomComponent }) => (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            checked={selectedIds.has(component._id)}
            onCheckedChange={() => toggleSelect(component._id)}
            className="mt-1"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{component.name}</h3>
            <p className="text-muted-foreground mt-2">{component.description}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center"
              onClick={() => {
                setSelectedComponent(component);
                setIsEditDialogOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center text-destructive focus:text-destructive"
              onClick={() => {
                setSelectedComponent(component);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Room Components</h1>
        <p className="text-muted-foreground mt-2">
          Manage and organize room components for your organisation
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          )}
          <div className="hidden sm:block">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Component
            </Button>
          </div>
          <div className="sm:hidden">
            <Button size="icon" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!loading && filteredComponents.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedIds.size === filteredComponents.length && filteredComponents.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">
            Select All ({selectedIds.size}/{filteredComponents.length})
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : components.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Package2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium text-lg">No components yet</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-sm">
            Create your first room component to start managing room features and amenities
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-6"
          >
            Create Component
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map((component) => (
            <ComponentCard key={component._id} component={component} />
          ))}
        </div>
      )}

      <CreateComponentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={fetchComponents}
        hostelId={Array.isArray(params.id) ? params.id[0] : params.id}
      />

      {selectedComponent && (
        <>
          <EditComponentDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedComponent(null);
            }}
            onSuccess={fetchComponents}
            hostelId={Array.isArray(params.id) ? params.id[0] : params.id}
            component={{
              id: selectedComponent._id,
              name: selectedComponent.name,
              description: selectedComponent.description,
            }}
          />

          <DeleteComponentDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setSelectedComponent(null);
            }}
            onConfirm={() => handleDelete(selectedComponent._id)}
            componentName={selectedComponent.name}
          />
        </>
      )}
    </div>
  );
}
