"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Camera, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  ExternalLink,
  Home,
  Users,
  Shield,
  Wifi,
  Car,
  Zap,
  Droplets,
  Star,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HostelPhoto {
  url: string;
  title: string;
  description?: string;
  type: 'boys' | 'girls' | 'common' | 'exterior' | 'interior' | 'amenities';
  isMain?: boolean;
}

interface City {
  _id: string;
  name: string;
  slug: string;
  state: string;
}

interface RoomTypeOption {
  type: string;
  label: string;
  selected: boolean;
  price: string;
}

interface HostelProfile {
  _id?: string;
  slug?: string;
  city?: string; // City ID reference
  isOnlinePresenceEnabled?: boolean;
  basicInfo: {
    name: string;
    description: string;
    address: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    contactNumber: string;
    email: string;
  };
  propertyDetails: {
    totalFloors: number;
    totalRooms: number;
    accommodationType: 'boys' | 'girls' | 'coed' | 'separate';
    establishedYear?: number;
    buildingType: 'independent' | 'apartment' | 'commercial';
  };
  roomTypes: RoomTypeOption[];
  locationInfo: {
    googleMapLink?: string;
    latitude?: number;
    longitude?: number;
    nearbyLandmarks: Array<{
      name: string;
      distance: string;
      type: 'hospital' | 'school' | 'market' | 'transport' | 'other';
    }>;
    transportConnectivity: Array<{
      mode: 'bus' | 'metro' | 'train' | 'auto';
      distance: string;
      details: string;
    }>;
  };
  media: {
    banner?: {
      url: string;
      publicId: string;
    };
    photos: HostelPhoto[];
    virtualTourLink?: string;
  };
  amenities: Array<{
    name: string;
    available: boolean;
    description?: string;
    floor?: string;
  }>;
  safetyFeatures: Array<{
    feature: string;
    available: boolean;
    details?: string;
  }>;
}

const defaultAmenities = [
  { name: "Wi-Fi", available: true, description: "", floor: "" },
  { name: "Laundry Service", available: true, description: "", floor: "" },
  { name: "AC Rooms", available: true, description: "", floor: "" },
  { name: "Power Backup", available: true, description: "", floor: "" },
  { name: "Housekeeping", available: true, description: "", floor: "" },
  { name: "RO Water", available: true, description: "", floor: "" },
  { name: "Common Kitchen", available: true, description: "", floor: "" },
  { name: "Study Room", available: true, description: "", floor: "" },
  { name: "Recreation Area", available: true, description: "", floor: "" },
  { name: "Gym", available: true, description: "", floor: "" },
];

const defaultSafetyFeatures = [
  { feature: "CCTV Surveillance", available: true, details: "" },
  { feature: "Security Guard", available: true, details: "" },
  { feature: "Biometric Access", available: true, details: "" },
  { feature: "Fire Safety Equipment", available: true, details: "" },
  { feature: "Emergency Exit", available: true, details: "" },
  { feature: "First Aid Kit", available: true, details: "" },
];

const defaultRoomTypes: RoomTypeOption[] = [
  { type: 'single_non_ac', label: 'Single Sharing Non-AC', selected: false, price: '' },
  { type: 'single_ac', label: 'Single Sharing AC', selected: false, price: '' },
  { type: 'double_non_ac', label: 'Double Sharing Non-AC', selected: false, price: '' },
  { type: 'double_ac', label: 'Double Sharing AC', selected: false, price: '' },
  { type: 'triple_non_ac', label: 'Triple Sharing Non-AC', selected: false, price: '' },
  { type: 'triple_ac', label: 'Triple Sharing AC', selected: false, price: '' },
  { type: 'four_sharing_non_ac', label: 'Four Sharing Non-AC', selected: false, price: '' },
  { type: 'four_sharing_ac', label: 'Four Sharing AC', selected: false, price: '' },
];

export default function HostelProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [hostelInfo, setHostelInfo] = useState<any>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [descriptionStyle, setDescriptionStyle] = useState('professional');
  const [photoForm, setPhotoForm] = useState({
    title: "",
    description: "",
    type: "common" as HostelPhoto['type'],
    file: null as File | null,
  });
  
  const [profile, setProfile] = useState<HostelProfile>({
    slug: "",
    city: "",
    isOnlinePresenceEnabled: true,
    basicInfo: {
      name: "",
      description: "",
      address: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      contactNumber: "",
      email: "",
    },
    propertyDetails: {
      totalFloors: 1,
      totalRooms: 1,
      accommodationType: 'boys',
      establishedYear: new Date().getFullYear(),
      buildingType: 'independent',
    },
    roomTypes: defaultRoomTypes,
    locationInfo: {
      googleMapLink: "",
      latitude: undefined,
      longitude: undefined,
      nearbyLandmarks: [],
      transportConnectivity: [],
    },
    media: {
      banner: undefined,
      photos: [],
      virtualTourLink: "",
    },
    amenities: defaultAmenities,
    safetyFeatures: defaultSafetyFeatures,
  });

  useEffect(() => {
    fetchHostelProfile();
    fetchCities();
  }, [params.id]);

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities');
      const data = await response.json();
      if (data.success) {
        setCities(data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast.error('Failed to load cities');
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    // Initialize slug input when profile loads
    if (profile.slug) {
      setSlugInput(profile.slug);
      setSlugAvailable(true);
    } else if (profile.basicInfo.name && !slugInput) {
      // Auto-generate slug for existing profiles without one
      const generatedSlug = generateSlugFromName(profile.basicInfo.name);
      setSlugInput(generatedSlug);
      checkSlugAvailability(generatedSlug);
    }
  }, [profile.slug, profile.basicInfo.name]);

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleGenerateSlug = () => {
    const generatedSlug = generateSlugFromName(profile.basicInfo.name || 'hostel');
    setSlugInput(generatedSlug);
    checkSlugAvailability(generatedSlug);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const response = await fetch('/api/hostel-profile/check-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          excludeHostelId: params.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSlugAvailable(data.available);
      } else {
        setSlugAvailable(false);
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string) => {
    const formattedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlugInput(formattedSlug);
    
    // Debounce slug availability check
    if (formattedSlug.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSlugAvailability(formattedSlug);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSlugAvailable(null);
    }
  };

  const fetchHostelProfile = async () => {
    if (!params.id) return;
    
    try {
      // First get basic hostel info
      const hostelResponse = await fetch(`/api/hostels/${params.id}`);
      let hostelData: any = null;
      if (hostelResponse.ok) {
        const response = await hostelResponse.json();
        if (response.success) {
          hostelData = response.data;
          setHostelInfo(hostelData);
        }
      }
      
      // Get existing room types
      const roomTypesResponse = await fetch(`/api/hostels/${params.id}/room-types`);
      let existingRoomTypes: any[] = [];
      if (roomTypesResponse.ok) {
        const roomTypesData = await roomTypesResponse.json();
        if (roomTypesData.success) {
          existingRoomTypes = roomTypesData.data;
        }
      }
      
      // Then get hostel profile
      const profileResponse = await fetch(`/api/hostels/${params.id}/profile`);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          // Sync room types with existing room types from database
          const syncedRoomTypes = defaultRoomTypes.map(defaultRoom => {
            const existingRoom = existingRoomTypes.find(
              (r: any) => r.name === defaultRoom.label
            );
            
            if (existingRoom) {
              return {
                ...defaultRoom,
                selected: true,
                price: existingRoom.rent.toString(),
              };
            }
            return defaultRoom;
          });
          
          // Ensure roomTypes exists in the fetched data
          const fetchedProfile = {
            ...profileData.data,
            roomTypes: syncedRoomTypes,
          };
          setProfile(fetchedProfile);
        }
      } else {
        // If no profile exists, sync with existing room types
        const syncedRoomTypes = defaultRoomTypes.map(defaultRoom => {
          const existingRoom = existingRoomTypes.find(
            (r: any) => r.name === defaultRoom.label
          );
          
          if (existingRoom) {
            return {
              ...defaultRoom,
              selected: true,
              price: existingRoom.rent.toString(),
            };
          }
          return defaultRoom;
        });
        
        // Use default with hostel name and synced room types
        setProfile(prev => ({
          ...prev,
          roomTypes: syncedRoomTypes,
          basicInfo: {
            ...prev.basicInfo,
            name: hostelData?.name || "",
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching hostel profile:", error);
      toast.error("Failed to load hostel profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate slug before saving
    if (!slugInput || slugInput.length < 3) {
      toast.error("Please provide a valid slug (minimum 3 characters)");
      return;
    }

    if (slugAvailable === false) {
      toast.error("This slug is already taken. Please choose another one.");
      return;
    }

    // Validate at least one room type is selected
    const selectedRoomTypes = profile.roomTypes.filter(r => r.selected && r.price);
    if (selectedRoomTypes.length === 0) {
      toast.error("Please select at least one room type with a price");
      return;
    }

    setSaving(true);
    try {
      // Always update hostel name to ensure it's synced
      try {
        const hostelUpdateResponse = await fetch(`/api/hostels/${params.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.basicInfo.name,
          }),
        });

        if (hostelUpdateResponse.ok) {
          console.log('Hostel name updated successfully');
        } else {
          console.error('Failed to update hostel name');
        }
      } catch (error) {
        console.error('Error updating hostel name:', error);
      }

      const profileData = {
        ...profile,
        slug: slugInput,
      };

      const response = await fetch(`/api/hostels/${params.id}/profile`, {
        method: profile._id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save profile");
      }

      toast.success("Hostel profile saved successfully");

      // Auto-create room types
      toast.loading("Creating room types...");
      
      try {
        const roomResponse = await fetch(`/api/hostels/${params.id}/auto-create-rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomTypes: selectedRoomTypes,
            hostelName: profile.basicInfo.name,
            city: profile.basicInfo.city,
            amenities: profile.amenities.filter(a => a.available).map(a => a.name),
          }),
        });

        const roomData = await roomResponse.json();

        if (roomData.success) {
          toast.success(roomData.message || "Room types created successfully!");
        } else {
          toast.error(roomData.error || "Failed to create room types");
        }
      } catch (roomError: any) {
        console.error('Error creating rooms:', roomError);
        toast.error("Profile saved but failed to create room types");
      }

      // Redirect to hostel page
      setTimeout(() => {
        router.push(`/hostel/${params.id}`);
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || "Failed to save hostel profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoForm.file || !photoForm.title) {
      toast.error("Please provide a title and select a photo");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", photoForm.file);
      formData.append("folder", "hostel-photos");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload photo");
      }
      
      const newPhoto: HostelPhoto = {
        url: result.secure_url,
        title: photoForm.title,
        description: photoForm.description,
        type: photoForm.type,
        isMain: profile.media.photos.length === 0, // First photo is main by default
      };

      setProfile(prev => ({
        ...prev,
        media: {
          ...prev.media,
          photos: [...prev.media.photos, newPhoto],
        }
      }));

      setPhotoForm({
        title: "",
        description: "",
        type: "common",
        file: null,
      });

      setIsPhotoDialogOpen(false);
      toast.success("Photo uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "hostel-banners");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload banner");
      }

      setProfile(prev => ({
        ...prev,
        media: {
          ...prev.media,
          banner: {
            url: result.secure_url,
            publicId: result.public_id,
          },
        }
      }));

      toast.success("Banner uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerDelete = async () => {
    if (!profile.media.banner) return;

    setDeletingBanner(true);
    try {
      const response = await fetch(`/api/hostels/${params.id}/profile/banner`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete banner");
      }

      setProfile(prev => ({
        ...prev,
        media: {
          ...prev.media,
          banner: undefined,
        }
      }));

      toast.success("Banner deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete banner");
    } finally {
      setDeletingBanner(false);
    }
  };

  const removePhoto = (index: number) => {
    setProfile(prev => ({
      ...prev,
      media: {
        ...prev.media,
        photos: prev.media.photos.filter((_, i) => i !== index),
      }
    }));
  };

  const setMainPhoto = (index: number) => {
    setProfile(prev => ({
      ...prev,
      media: {
        ...prev.media,
        photos: prev.media.photos.map((photo, i) => ({
          ...photo,
          isMain: i === index,
        })),
      }
    }));
  };

  const addLandmark = () => {
    setProfile(prev => ({
      ...prev,
      locationInfo: {
        ...prev.locationInfo,
        nearbyLandmarks: [
          ...prev.locationInfo.nearbyLandmarks,
          { name: "", distance: "", type: "other" }
        ]
      }
    }));
  };

  const removeLandmark = (index: number) => {
    setProfile(prev => ({
      ...prev,
      locationInfo: {
        ...prev.locationInfo,
        nearbyLandmarks: prev.locationInfo.nearbyLandmarks.filter((_, i) => i !== index)
      }
    }));
  };

  const addTransport = () => {
    setProfile(prev => ({
      ...prev,
      locationInfo: {
        ...prev.locationInfo,
        transportConnectivity: [
          ...prev.locationInfo.transportConnectivity,
          { mode: "bus", distance: "", details: "" }
        ]
      }
    }));
  };

  const removeTransport = (index: number) => {
    setProfile(prev => ({
      ...prev,
      locationInfo: {
        ...prev.locationInfo,
        transportConnectivity: prev.locationInfo.transportConnectivity.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAmenity = (index: number, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) =>
        i === index ? { ...amenity, [field]: value } : amenity
      )
    }));
  };

  const updateSafetyFeature = (index: number, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      safetyFeatures: prev.safetyFeatures.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const toggleRoomType = (index: number, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.map((room, i) =>
        i === index ? { ...room, selected: checked, price: checked ? room.price : '' } : room
      )
    }));
  };

  const updateRoomTypePrice = (index: number, price: string) => {
    setProfile(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.map((room, i) =>
        i === index ? { ...room, price } : room
      )
    }));
  };

  const handleGenerateDescription = async () => {
    setGeneratingDescription(true);
    try {
      // Get selected room types with prices
      const selectedRoomTypes = profile.roomTypes
        .filter(r => r.selected && r.price)
        .map(r => ({ name: r.label, price: r.price }));

      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostelName: profile.basicInfo.name,
          city: profile.basicInfo.city,
          state: profile.basicInfo.state,
          address: profile.basicInfo.address,
          accommodationType: profile.propertyDetails.accommodationType,
          totalRooms: profile.propertyDetails.totalRooms,
          totalFloors: profile.propertyDetails.totalFloors,
          roomTypes: selectedRoomTypes, // Include room types
          amenities: profile.amenities.filter(a => a.available).map(a => a.name),
          safetyFeatures: profile.safetyFeatures.filter(f => f.available).map(f => f.feature),
          nearbyLandmarks: profile.locationInfo.nearbyLandmarks.map(l => l.name).filter(Boolean),
          transportConnectivity: profile.locationInfo.transportConnectivity.map(t => `${t.mode} - ${t.details}`).filter(Boolean),
          style: descriptionStyle, // Include selected style
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            description: data.description,
          }
        }));
        toast.success('Description generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate description');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const getPhotoTypeLabel = (type: string) => {
    switch (type) {
      case 'boys': return 'Boys Section';
      case 'girls': return 'Girls Section';
      case 'common': return 'Common Areas';
      case 'exterior': return 'Building Exterior';
      case 'interior': return 'Interior Spaces';
      case 'amenities': return 'Amenities';
      default: return type;
    }
  };

  const getPhotoTypeBadge = (type: string) => {
    const colors = {
      boys: 'bg-blue-100 text-blue-800',
      girls: 'bg-pink-100 text-pink-800',
      common: 'bg-green-100 text-green-800',
      exterior: 'bg-orange-100 text-orange-800',
      interior: 'bg-purple-100 text-purple-800',
      amenities: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {getPhotoTypeLabel(type)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <LoadingSkeleton className="h-10 w-64" />
          <LoadingSkeleton className="h-6 w-96 mt-2" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => router.push(`/hostel/${params.id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Hostel
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{hostelInfo?.name || 'Hostel'} Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage detailed information about this hostel
        </p>
      </div>

      {/* Basic Information */}
      <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostelName">Hostel Name</Label>
              <Input
                id="hostelName"
                value={profile.basicInfo.name}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, name: e.target.value }
                }))}
                placeholder="Enter hostel name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={profile.basicInfo.contactNumber}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, contactNumber: e.target.value }
                }))}
                placeholder="Enter contact number"
              />
            </div>
          </div>

          {/* Slug Field */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Hostel Slug <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              A unique URL-friendly identifier for this hostel (e.g., "my-hostel-name")
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="slug"
                  value={slugInput}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="enter-hostel-slug"
                  className={
                    slugAvailable === true 
                      ? "border-green-500" 
                      : slugAvailable === false 
                      ? "border-red-500" 
                      : ""
                  }
                />
                {checkingSlug && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Checking...
                  </span>
                )}
                {!checkingSlug && slugAvailable === true && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-green-600">
                    ✓ Available
                  </span>
                )}
                {!checkingSlug && slugAvailable === false && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-600">
                    ✗ Taken
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateSlug}
                disabled={!profile.basicInfo.name}
              >
                Generate
              </Button>
            </div>
            {slugInput && slugInput.length < 3 && (
              <p className="text-sm text-red-500">Slug must be at least 3 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.basicInfo.email}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, email: e.target.value }
              }))}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address</Label>
            <Textarea
              id="address"
              value={profile.basicInfo.address}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, address: e.target.value }
              }))}
              placeholder="Enter complete address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                value={profile.basicInfo.landmark}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, landmark: e.target.value }
                }))}
                placeholder="Enter landmark"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="citySelect">City <span className="text-red-500">*</span></Label>
              <Select
                value={profile.city || ""}
                onValueChange={(value) => {
                  const selectedCity = cities.find(c => c._id === value);
                  setProfile(prev => ({
                    ...prev,
                    city: value,
                    basicInfo: {
                      ...prev.basicInfo,
                      city: selectedCity?.name || "",
                      state: selectedCity?.state || prev.basicInfo.state,
                    }
                  }));
                }}
                disabled={loadingCities}
              >
                <SelectTrigger id="citySelect">
                  <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select a city"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city._id} value={city._id}>
                      {city.name}, {city.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City Name (Text)</Label>
              <Input
                id="city"
                value={profile.basicInfo.city}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, city: e.target.value }
                }))}
                placeholder="Enter city"
                disabled={!!profile.city}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                value={profile.basicInfo.state}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, state: e.target.value }
                }))}
                placeholder="Enter state"
                />
              </div>
              <div className="space-y-2">
              <Label htmlFor="pincode">PIN Code</Label>
                <Input
                  id="pincode"
                value={profile.basicInfo.pincode}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, pincode: e.target.value }
                }))}
                placeholder="Enter PIN code"
              />
            </div>
            </div>

          <Separator />

          {/* Online Presence Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="onlinePresence">Online Presence</Label>
              <p className="text-sm text-muted-foreground">
                Enable this hostel to be visible on the public website
              </p>
            </div>
            <Switch
              id="onlinePresence"
              checked={profile.isOnlinePresenceEnabled ?? true}
              onCheckedChange={(checked) => setProfile(prev => ({
                ...prev,
                isOnlinePresenceEnabled: checked
              }))}
            />
          </div>
          </CardContent>
        </Card>

      {/* Property Details */}
      <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Details
          </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalFloors">Total Floors</Label>
                <Input
                  id="totalFloors"
                  type="number"
                  min="1"
                value={profile.propertyDetails.totalFloors}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  propertyDetails: { ...prev.propertyDetails, totalFloors: parseInt(e.target.value) || 1 }
                }))}
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="totalRooms">Total Rooms</Label>
                <Input
                  id="totalRooms"
                  type="number"
                  min="1"
                value={profile.propertyDetails.totalRooms}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  propertyDetails: { ...prev.propertyDetails, totalRooms: parseInt(e.target.value) || 1 }
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="establishedYear">Established Year</Label>
              <Input
                id="establishedYear"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={profile.propertyDetails.establishedYear || ""}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  propertyDetails: { ...prev.propertyDetails, establishedYear: parseInt(e.target.value) || undefined }
                }))}
                placeholder="Enter year"
                />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label>Accommodation Type</Label>
                <Select
                value={profile.propertyDetails.accommodationType}
                onValueChange={(value: 'boys' | 'girls' | 'coed' | 'separate') => 
                  setProfile(prev => ({
                    ...prev,
                    propertyDetails: { ...prev.propertyDetails, accommodationType: value }
                  }))
                  }
                >
                  <SelectTrigger>
                  <SelectValue placeholder="Select accommodation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys Only</SelectItem>
                    <SelectItem value="girls">Girls Only</SelectItem>
                  <SelectItem value="coed">Co-ed (Mixed)</SelectItem>
                  <SelectItem value="separate">Separate Boys & Girls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div className="space-y-2">
              <Label>Building Type</Label>
                <Select
                value={profile.propertyDetails.buildingType}
                onValueChange={(value: 'independent' | 'apartment' | 'commercial') => 
                  setProfile(prev => ({
                    ...prev,
                    propertyDetails: { ...prev.propertyDetails, buildingType: value }
                  }))
                  }
                >
                  <SelectTrigger>
                  <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="independent">Independent Building</SelectItem>
                  <SelectItem value="apartment">Apartment Complex</SelectItem>
                  <SelectItem value="commercial">Commercial Building</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Room Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Room Types & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select the room types available in your hostel and set their monthly prices
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.roomTypes && profile.roomTypes.map((roomType, index) => (
              <div key={roomType.type} className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={roomType.selected}
                  onCheckedChange={(checked) => toggleRoomType(index, checked as boolean)}
                />
                <div className="flex-1">
                  <span className="font-medium">{roomType.label}</span>
                </div>
                {roomType.selected && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      placeholder="Price"
                      value={roomType.price}
                      onChange={(e) => updateRoomTypePrice(index, e.target.value)}
                      className="w-28 h-9"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {profile.roomTypes && profile.roomTypes.filter(r => r.selected).length === 0 && (
            <p className="text-sm text-amber-600 mt-4">
              ⚠️ Please select at least one room type
            </p>
          )}
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="googleMapLink">Google Maps Link</Label>
            <div className="flex gap-2">
              <Input
                id="googleMapLink"
                value={profile.locationInfo.googleMapLink || ""}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  locationInfo: { ...prev.locationInfo, googleMapLink: e.target.value }
                }))}
                placeholder="Paste Google Maps link"
              />
              {profile.locationInfo.googleMapLink && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(profile.locationInfo.googleMapLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Nearby Landmarks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Nearby Landmarks</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addLandmark}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Landmark
              </Button>
            </div>
            
            <div className="space-y-3">
              {profile.locationInfo.nearbyLandmarks.map((landmark, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                  <Input
                    placeholder="Landmark name"
                    value={landmark.name}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      locationInfo: {
                        ...prev.locationInfo,
                        nearbyLandmarks: prev.locationInfo.nearbyLandmarks.map((item, i) =>
                          i === index ? { ...item, name: e.target.value } : item
                        )
                      }
                    }))}
                  />
                  <Input
                    placeholder="Distance (e.g., 500m)"
                    value={landmark.distance}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      locationInfo: {
                        ...prev.locationInfo,
                        nearbyLandmarks: prev.locationInfo.nearbyLandmarks.map((item, i) =>
                          i === index ? { ...item, distance: e.target.value } : item
                        )
                      }
                    }))}
                  />
                  <Select
                    value={landmark.type}
                    onValueChange={(value: 'hospital' | 'school' | 'market' | 'transport' | 'other') => 
                      setProfile(prev => ({
                        ...prev,
                        locationInfo: {
                          ...prev.locationInfo,
                          nearbyLandmarks: prev.locationInfo.nearbyLandmarks.map((item, i) =>
                            i === index ? { ...item, type: value } : item
                          )
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="school">School/College</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="transport">Transport Hub</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeLandmark(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Transport Connectivity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Transport Connectivity</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addTransport}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transport
              </Button>
            </div>
            
            <div className="space-y-3">
              {profile.locationInfo.transportConnectivity.map((transport, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                  <Select
                    value={transport.mode}
                    onValueChange={(value: 'bus' | 'metro' | 'train' | 'auto') => 
                      setProfile(prev => ({
                        ...prev,
                        locationInfo: {
                          ...prev.locationInfo,
                          transportConnectivity: prev.locationInfo.transportConnectivity.map((item, i) =>
                            i === index ? { ...item, mode: value } : item
                          )
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="auto">Auto/Taxi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Distance"
                    value={transport.distance}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      locationInfo: {
                        ...prev.locationInfo,
                        transportConnectivity: prev.locationInfo.transportConnectivity.map((item, i) =>
                          i === index ? { ...item, distance: e.target.value } : item
                        )
                      }
                    }))}
                  />
                  <Input
                    placeholder="Details"
                    value={transport.details}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      locationInfo: {
                        ...prev.locationInfo,
                        transportConnectivity: prev.locationInfo.transportConnectivity.map((item, i) =>
                          i === index ? { ...item, details: e.target.value } : item
                        )
                      }
                    }))}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeTransport(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Amenities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.amenities.map((amenity, index) => (
              <div key={amenity.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <Checkbox
                    checked={amenity.available}
                    onCheckedChange={(checked) => 
                      updateAmenity(index, 'available', checked as boolean)
                    }
                  />
                  <span className="font-medium">{amenity.name}</span>
                </div>
                {amenity.available && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Floor"
                      value={amenity.floor || ""}
                      onChange={(e) => updateAmenity(index, 'floor', e.target.value)}
                      className="w-20 h-8"
                    />
                    <Input
                      placeholder="Details"
                      value={amenity.description || ""}
                      onChange={(e) => updateAmenity(index, 'description', e.target.value)}
                      className="w-32 h-8"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.safetyFeatures.map((feature, index) => (
              <div key={feature.feature} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <Checkbox
                    checked={feature.available}
                    onCheckedChange={(checked) => 
                      updateSafetyFeature(index, 'available', checked as boolean)
                    }
                  />
                  <span className="font-medium">{feature.feature}</span>
                </div>
                {feature.available && (
                  <Input
                    placeholder="Details"
                    value={feature.details || ""}
                    onChange={(e) => updateSafetyFeature(index, 'details', e.target.value)}
                    className="w-32 h-8"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Description
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={descriptionStyle} onValueChange={setDescriptionStyle}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly & Welcoming</SelectItem>
                  <SelectItem value="modern">Modern & Trendy</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="luxury">Premium</SelectItem>
                  <SelectItem value="student_focused">Student-Focused</SelectItem>
                  <SelectItem value="working_professional">Professional-Focused</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || !profile.basicInfo.name}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generatingDescription ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="description">Hostel Description</Label>
            <Textarea
              id="description"
              value={profile.basicInfo.description}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, description: e.target.value }
              }))}
              placeholder="Enter detailed hostel description or click 'Generate' to auto-generate"
              rows={8}
            />
            <p className="text-sm text-muted-foreground">
              Select a writing style and click "Generate" to create an AI-powered description, or write your own.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Photos & Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos & Media
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Hostel Banner</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a banner image for your hostel (recommended: 1920x600px)
                </p>
              </div>
            </div>
            
            {profile.media.banner ? (
              <div className="relative group">
                <div className="aspect-[16/5] rounded-lg overflow-hidden border">
                  <img
                    src={profile.media.banner.url}
                    alt="Hostel Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <label htmlFor="bannerChange">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={uploadingBanner}
                      onClick={() => document.getElementById('bannerChange')?.click()}
                      type="button"
                    >
                      {uploadingBanner ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload className="h-3 w-3 mr-1" />
                          Change
                        </>
                      )}
                    </Button>
                  </label>
                  <input
                    id="bannerChange"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleBannerUpload(file);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBannerDelete}
                    disabled={deletingBanner}
                  >
                    {deletingBanner ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No banner uploaded yet</p>
                  <div className="flex justify-center">
                    <label htmlFor="bannerUpload">
                      <Button
                        type="button"
                        disabled={uploadingBanner}
                        onClick={() => document.getElementById('bannerUpload')?.click()}
                      >
                        {uploadingBanner ? (
                          "Uploading..."
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Banner
                          </>
                        )}
                      </Button>
                    </label>
                    <input
                      id="bannerUpload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleBannerUpload(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Hostel Photos</h3>
              <p className="text-sm text-muted-foreground">
                Upload photos to showcase your hostel
              </p>
            </div>
            <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Hostel Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoTitle">Photo Title</Label>
                    <Input
                      id="photoTitle"
                      value={photoForm.title}
                      onChange={(e) => setPhotoForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter photo title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="photoDescription">Description (Optional)</Label>
                    <Textarea
                      id="photoDescription"
                      value={photoForm.description}
                      onChange={(e) => setPhotoForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter photo description"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Photo Type</Label>
                    <Select
                      value={photoForm.type}
                      onValueChange={(value: HostelPhoto['type']) => 
                        setPhotoForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boys">Boys Section</SelectItem>
                        <SelectItem value="girls">Girls Section</SelectItem>
                        <SelectItem value="common">Common Areas</SelectItem>
                        <SelectItem value="exterior">Building Exterior</SelectItem>
                        <SelectItem value="interior">Interior Spaces</SelectItem>
                        <SelectItem value="amenities">Amenities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="photoFile">Select Photo</Label>
                    <Input
                      id="photoFile"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => setPhotoForm(prev => ({ 
                        ...prev, 
                        file: e.target.files?.[0] || null 
                      }))}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
          <Button
            variant="outline"
                      onClick={() => setIsPhotoDialogOpen(false)}
          >
            Cancel
          </Button>
                    <Button
                      onClick={handlePhotoUpload}
                      disabled={uploading || !photoForm.file || !photoForm.title}
                    >
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {profile.media.photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.media.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 left-2">
                    {getPhotoTypeBadge(photo.type)}
                    {photo.isMain && (
                      <Badge className="ml-1 bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Main
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {!photo.isMain && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setMainPhoto(index)}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="font-medium text-sm">{photo.title}</h4>
                    {photo.description && (
                      <p className="text-xs text-muted-foreground">{photo.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No photos uploaded yet</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="virtualTourLink">Virtual Tour Link (Optional)</Label>
            <Input
              id="virtualTourLink"
              value={profile.media.virtualTourLink || ""}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                media: { ...prev.media, virtualTourLink: e.target.value }
              }))}
              placeholder="Enter virtual tour link"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || uploading} size="lg">
          {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
    </div>
  );
}
