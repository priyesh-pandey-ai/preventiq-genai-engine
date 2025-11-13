import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PersonaEditorProps {
  persona: {
    id: string;
    label: string;
    description: string;
    tone_defaults?: string[];
    channels?: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const PersonaEditor = ({ persona, isOpen, onClose, onSave }: PersonaEditorProps) => {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [toneDefaults, setToneDefaults] = useState("");
  const [saving, setSaving] = useState(false);

  // Update form values when persona changes
  useEffect(() => {
    if (persona) {
      setLabel(persona.label || "");
      setDescription(persona.description || "");
      setToneDefaults(persona.tone_defaults?.join(", ") || "");
    }
  }, [persona]);

  const handleSave = async () => {
    if (!persona) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('personas')
        .update({
          label,
          description,
          tone_defaults: toneDefaults.split(',').map(t => t.trim()).filter(t => t),
        })
        .eq('id', persona.id);

      if (error) throw error;

      toast.success("Persona updated successfully");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating persona:", error);
      toast.error("Failed to update persona");
    } finally {
      setSaving(false);
    }
  };

  if (!persona) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Persona</DialogTitle>
          <DialogDescription>
            Customize the persona to better match your target audience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="persona-id">Persona ID</Label>
            <Input
              id="persona-id"
              value={persona.id}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="persona-label">Label</Label>
            <Input
              id="persona-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Proactive Professional"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="persona-description">Description</Label>
            <Textarea
              id="persona-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the persona characteristics..."
              rows={4}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="persona-tones">Tone Defaults (comma-separated)</Label>
            <Input
              id="persona-tones"
              value={toneDefaults}
              onChange={(e) => setToneDefaults(e.target.value)}
              placeholder="e.g., professional, friendly, caring"
            />
            <p className="text-xs text-muted-foreground">
              These tones will be used when generating AI content for this persona.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
