import { Button, Card, CardBody, Switch, Avatar } from "@heroui/react";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";

type Integration = {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
};

// Sample integrations data
const integrations: Integration[] = [
  {
    id: "google",
    name: "Google Drive",
    description: "Connect to automatically back up your data",
    logo: "https://cdn-icons-png.flaticon.com/512/2965/2965327.png",
    connected: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get trip notifications in your Slack channels",
    logo: "https://cdn-icons-png.flaticon.com/512/2111/2111615.png",
    connected: false,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Sync your trips with your calendar",
    logo: "https://cdn-icons-png.flaticon.com/512/2673/2673574.png",
    connected: true,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to thousands of apps",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968927.png",
    connected: false,
  },
];

export const IntegrationsSettings = () => {
  const [connectedApps, setConnectedApps] = useState(
    integrations.map((app) => app.connected)
  );

  const toggleConnection = (index: number) => {
    const newState = [...connectedApps];
    newState[index] = !newState[index];
    setConnectedApps(newState);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Integrations</h2>
        <Button color="primary" startContent={<FiPlus />}>
          Browse More
        </Button>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration, index) => (
          <Card key={integration.id}>
            <CardBody>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={integration.logo}
                    size="lg"
                    radius="sm"
                    imgProps={{ className: "object-contain p-1" }}
                  />
                  <div>
                    <h3 className="text-lg font-medium">{integration.name}</h3>
                    <p className="text-default-500">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <div>
                  <Switch
                    isSelected={connectedApps[index]}
                    onValueChange={() => toggleConnection(index)}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
