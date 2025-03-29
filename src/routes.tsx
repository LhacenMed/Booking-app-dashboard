import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/login";
import SignUpTestPage0 from "./pages/signup-test0";
import SignUpTestPage1 from "./pages/signup-test1";
import DashboardPage from "./pages/dashboard";
import IndexPage from "./pages/index";
import DocsPage from "./pages/docs";
// import Home from "./pages/page";
import PrivateRoute from "./components/PrivateRoute";
import TeamPage from "./pages/team";
import TripsPage from "./pages/trips";
import IntegrationsPage from "./pages/integrations";
import FinancePage from "./pages/finance";
import { SeatManagement } from "./components/Trips/SeatManagement";
import { AppLayout } from "./layouts/AppLayout";
import { StatusProtectedRoute } from "@/components/ProtectedRoute/StatusProtectedRoute";
import SignUpPage from "./pages/signup";
import MessageEmail from "./pages/message-email";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <IndexPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup-test0",
    element: <SignUpTestPage0 />,
  },
  {
    path: "/signup-test1",
    element: <SignUpTestPage1 />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/message-email",
    element: <MessageEmail />,
  },
  {
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
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
        element: (
          <PrivateRoute>
            <StatusProtectedRoute>
              <FinancePage />
            </StatusProtectedRoute>
          </PrivateRoute>
        ),
      },
      {
        path: "/docs",
        element: <DocsPage />,
      },
    ],
  },
]);
