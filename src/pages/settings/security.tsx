import { Button, Card, CardBody, Input, Divider } from "@heroui/react";
import { useState } from "react";

export const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Password change logic would go here
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Security Settings</h2>

      <Card className="mb-6">
        <CardBody>
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" color="primary" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-lg font-medium mb-4">
            Two-Factor Authentication
          </h3>
          <p className="text-default-500 mb-4">
            Add an extra layer of security to your account by enabling
            two-factor authentication.
          </p>
          <Button color="secondary">Enable 2FA</Button>
        </CardBody>
      </Card>
    </div>
  );
};
