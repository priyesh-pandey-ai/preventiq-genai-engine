import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";

interface CustomerImportProps {
  onImportComplete: () => void;
}

export const CustomerImport = ({ onImportComplete }: CustomerImportProps) => {
  const [importing, setImporting] = useState(false);
  const { profile } = useUserProfile();
  
  // Manual form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [lang, setLang] = useState("en");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !city) {
      toast.error("Please fill all required fields");
      return;
    }

    // Use user's org_type from profile, or default city if not available
    const orgType = profile?.org_type || "Other";
    const customerCity = city || profile?.city || "";

    setImporting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          name,
          email,
          city: customerCity,
          org_type: orgType,
          lang,
          is_test: false,
          consent: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("This email already exists in the system");
        } else {
          throw error;
        }
      } else {
        toast.success("Customer added successfully");
        // Reset form
        setName("");
        setEmail("");
        setCity("");
        setLang("en");
        onImportComplete();
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    // Use user's org_type from profile
    const userOrgType = profile?.org_type || "Other";

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate headers - org_type is now optional
      const requiredHeaders = ['name', 'email', 'city'];
      const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequiredHeaders) {
        toast.error(`CSV must have columns: ${requiredHeaders.join(', ')}`);
        setImporting(false);
        return;
      }

      // Parse data
      const customers = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        const customer: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          customer[header] = values[index];
        });
        
        if (customer.name && customer.email && customer.city) {
          customers.push({
            name: customer.name,
            email: customer.email,
            city: customer.city,
            org_type: customer.org_type || userOrgType, // Use user's org_type if not in CSV
            lang: customer.lang || 'en',
            is_test: false,
            consent: true,
          });
        }
      }

      if (customers.length === 0) {
        toast.error("No valid customer data found in CSV");
        setImporting(false);
        return;
      }

      // Insert customers
      const { error } = await supabase
        .from('leads')
        .insert(customers);

      if (error) {
        console.error("Import error:", error);
        toast.error(`Failed to import customers: ${error.message}`);
      } else {
        toast.success(`Successfully imported ${customers.length} customers`);
        onImportComplete();
      }
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast.error("Failed to process CSV file");
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
      <div className="mb-4">
        <h3 className="text-xl font-heading font-bold text-foreground">
          Import Customer Data
        </h3>
        {profile?.org_type && (
          <p className="text-sm text-muted-foreground mt-1">
            Customers will be added to your organization: <span className="font-semibold">{profile.org_type}</span>
            {profile.city && ` (${profile.city})`}
          </p>
        )}
      </div>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            <Plus className="h-4 w-4 mr-2" />
            Add Manually
          </TabsTrigger>
          <TabsTrigger value="csv">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Upload CSV
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={profile?.city || "Mumbai"}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lang">Preferred Language</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger id="lang">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={importing} className="w-full">
              {importing ? "Adding..." : "Add Customer"}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="csv" className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold text-foreground mb-2">Upload CSV File</h4>
            <p className="text-sm text-muted-foreground mb-4">
              CSV should contain columns: name, email, city, lang (optional)
              {profile?.org_type && <><br/>Organization type will be set to: <span className="font-semibold">{profile.org_type}</span></>}
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="max-w-xs mx-auto"
            />
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h5 className="font-semibold text-sm mb-2">CSV Format Example:</h5>
            <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`name,email,city,lang
John Doe,john@example.com,Mumbai,en
Jane Smith,jane@example.com,Delhi,hi`}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
