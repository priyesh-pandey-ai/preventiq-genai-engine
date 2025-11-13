import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Users, MessageSquare, Globe } from "lucide-react";

interface PersonaCardProps {
  persona: {
    id: string;
    label: string;
    description: string;
    tone_defaults?: string[];
    channels?: string[];
    lang?: string;
  };
  onEdit: (persona: PersonaCardProps['persona']) => void;
  leadCount?: number;
}

export const PersonaCard = ({ persona, onEdit, leadCount = 0 }: PersonaCardProps) => {
  return (
    <Card className="p-6 bg-card border-2 border-border/50 rounded-xl hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-heading font-bold text-foreground mb-2">
            {persona.label}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {persona.description}
          </p>
          
          {/* Tone Tags */}
          {persona.tone_defaults && persona.tone_defaults.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Tone:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {persona.tone_defaults.map((tone) => (
                  <Badge key={tone} variant="secondary" className="text-xs">
                    {tone}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Channels */}
          {persona.channels && persona.channels.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Channels:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {persona.channels.map((channel) => (
                  <Badge key={channel} variant="outline" className="text-xs">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Lead Count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{leadCount}</span>
            <span className="text-muted-foreground">assigned {leadCount === 1 ? 'lead' : 'leads'}</span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(persona)}
          className="rounded-full"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground border-t border-border/50 pt-3 mt-3">
        <div className="flex items-center justify-between">
          <span>ID: <code className="bg-muted px-1 py-0.5 rounded">{persona.id}</code></span>
          {persona.lang && (
            <Badge variant="outline" className="text-xs">
              {persona.lang.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
