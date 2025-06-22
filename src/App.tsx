import "@/styles/globals.css";
import "@/styles/mouse-follower.css";
// import MouseFollower from "mouse-follower";
// import gsap from "gsap";
// import { useEffect } from "react";
// import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import type { NavigateOptions } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // disable automatic refetching when window gains focus
      retry: 1, // retry failed requests only once
    },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const initApp = async () => {
      try {
        // Add any initialization logic here
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Minimum loading time
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden">
        <Spinner size="lg" />
      </div>
    );
  }

  // Initialize smooth scroll
  // useSmoothScroll();

  // useEffect(() => {
  //   // Initialize MouseFollower
  //   MouseFollower.registerGSAP(gsap);
  //   const cursor = new MouseFollower({
  //     el: null,
  //     container: document.body,
  //     className: "mf-cursor",
  //     innerClassName: "mf-cursor-inner",
  //     textClassName: "mf-cursor-text",
  //     mediaClassName: "mf-cursor-media",
  //     mediaBoxClassName: "mf-cursor-media-box",
  //     iconSvgClassName: "mf-svgsprite",
  //     iconSvgNamePrefix: "-",
  //     iconSvgSrc: "",
  //     dataAttr: "cursor",
  //     hiddenState: "-hidden",
  //     textState: "-text",
  //     iconState: "-icon",
  //     activeState: "-active",
  //     mediaState: "-media",
  //     stateDetection: {
  //       "-pointer": "a,button",
  //       "-hidden": "iframe",
  //     },
  //     visible: true,
  //     visibleOnState: false,
  //     speed: 0.55,
  //     ease: "expo.out",
  //     overwrite: true,
  //     skewing: 3,
  //     skewingText: 2,
  //     skewingIcon: 2,
  //     skewingMedia: 2,
  //     skewingDelta: 0.001,
  //     skewingDeltaMax: 0.15,
  //     stickDelta: 0.15,
  //     showTimeout: 20,
  //     hideOnLeave: true,
  //     hideTimeout: 300,
  //   });

  //   return () => {
  //     cursor.destroy();
  //   };
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
