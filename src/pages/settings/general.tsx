import { Button, Input, Textarea } from "@heroui/react";
import { useState } from "react";
import { useAgency } from "@/hooks/useAgency";
import { auth } from "@/config/firebase";

export const GeneralSettings = () => {
  const userId = auth.currentUser?.uid || null;
  const { company } = useAgency(userId);
  const [isLoading, setIsLoading] = useState(false);

  // Form state would be initialized with company data in a real implementation
  const [formData, setFormData] = useState({
    name: company?.name || "",
    email: company?.email || "",
    phone: "",
    address: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Save implementation would go here
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">General Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <Input
          label="Company Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label="Address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
        <Textarea
          label="Company Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
        <div className="pt-2">
          <Button type="submit" color="primary" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
