import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import DashboardPage from "./pages/dashboard";
import IndexPage from "./pages/index";
import DocsPage from "./pages/docs";
import Home from "./pages/page";
import PrivateRoute from "./components/PrivateRoute";
import TeamPage from "./pages/team";
import TripsPage from "./pages/trips";
import IntegrationsPage from "./pages/integrations";
import FinancePage from "./pages/finance";
import { SeatManagement } from "./components/Trips/SeatManagement";
import { AppLayout } from "./layouts/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "/home",
        element: <IndexPage />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/team",
        element: <TeamPage />,
      },
      {
        path: "/trips",
        children: [
          {
            path: "",
            element: <TripsPage />,
          },
          {
            path: "seats/:tripId",
            element: <SeatManagement />,
          },
        ],
      },
      {
        path: "/integrations",
        element: <IntegrationsPage />,
      },
      {
        path: "/finance",
        element: <FinancePage />,
      },
      {
        path: "/docs",
        element: <DocsPage />,
      },
    ],
  },
]);
