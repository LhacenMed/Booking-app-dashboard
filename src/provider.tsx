import { HeroUIProvider } from "@heroui/react";
import { NotificationProvider } from "@/components/ui/notification";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </HeroUIProvider>
  );
}
