import { HeroUIProvider } from "@heroui/react";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}
