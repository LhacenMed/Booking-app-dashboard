import { Card, CardBody, Switch, Button, Divider } from "@heroui/react";
import { useState } from "react";

export const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    tripUpdates: true,
    teamChanges: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
  });

  const handleChange = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>

      <Card className="mb-6">
        <CardBody>
          <h3 className="text-lg font-medium mb-3">Email Notifications</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Trip Updates</p>
                <p className="text-default-500 text-sm">
                  Receive emails about trip status changes
                </p>
              </div>
              <Switch
                isSelected={settings.tripUpdates}
                onValueChange={() => handleChange("tripUpdates")}
              />
            </div>

            <Divider />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Team Changes</p>
                <p className="text-default-500 text-sm">
                  Notifications about team member updates
                </p>
              </div>
              <Switch
                isSelected={settings.teamChanges}
                onValueChange={() => handleChange("teamChanges")}
              />
            </div>

            <Divider />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Security Alerts</p>
                <p className="text-default-500 text-sm">
                  Get notified about security issues
                </p>
              </div>
              <Switch
                isSelected={settings.securityAlerts}
                onValueChange={() => handleChange("securityAlerts")}
              />
            </div>

            <Divider />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-default-500 text-sm">
                  Receive weekly summary reports
                </p>
              </div>
              <Switch
                isSelected={settings.weeklyReports}
                onValueChange={() => handleChange("weeklyReports")}
              />
            </div>

            <Divider />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-default-500 text-sm">
                  Receive promotional content and updates
                </p>
              </div>
              <Switch
                isSelected={settings.marketingEmails}
                onValueChange={() => handleChange("marketingEmails")}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Button color="primary">Save Preferences</Button>
    </div>
  );
};
