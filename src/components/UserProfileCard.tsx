import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export const UserProfileCard = () => {
  const { profile, loading, updateProfile } = useUserProfile();
  const [editing, setEditing] = useState(false);
  const [orgType, setOrgType] = useState(profile?.org_type || "");
  const [city, setCity] = useState(profile?.city || "");
  const [organizationName, setOrganizationName] = useState(profile?.organization_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateProfile({
      org_type: orgType,
      city: city,
      organization_name: organizationName,
    });
    
    if (success) {
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setOrgType(profile?.org_type || "");
    setCity(profile?.city || "");
    setOrganizationName(profile?.organization_name || "");
    setEditing(false);
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-foreground">
              Your Profile
            </h3>
            <p className="text-sm text-muted-foreground">
              {profile?.email}
            </p>
          </div>
        </div>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="My Healthcare Organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgType">Organization Type</Label>
            <Select value={orgType} onValueChange={setOrgType}>
              <SelectTrigger id="orgType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clinic">Clinic</SelectItem>
                <SelectItem value="Diagnostic Center">Diagnostic Center</SelectItem>
                <SelectItem value="Hospital">Hospital</SelectItem>
                <SelectItem value="Wellness Center">Wellness Center</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="Corporate Wellness">Corporate Wellness</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Organization</span>
            <span className="text-sm font-medium text-foreground">
              {profile?.organization_name || "Not set"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium text-foreground">
              {profile?.org_type || "Not set"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">City</span>
            <span className="text-sm font-medium text-foreground">
              {profile?.city || "Not set"}
            </span>
          </div>
        </div>
      )}

      {!profile?.org_type && !editing && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-600">
            Please complete your profile to get the best experience. Your organization type will be used when importing customers.
          </p>
        </div>
      )}
    </Card>
  );
};
