import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { HeroUIProvider } from "@heroui/react";
import { NotificationProvider } from "@/components/ui/notification";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";

const rootElement = document.getElementById("root");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // disable automatic refetching when window gains focus
      retry: 1, // retry failed requests only once
    },
  },
});

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <HeroUIProvider>
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </HeroUIProvider>
  );
}
