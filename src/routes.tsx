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
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/page",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/team",
    element: (
      <PrivateRoute>
        <TeamPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/trips",
    element: (
      <PrivateRoute>
        <TripsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/integrations",
    element: (
      <PrivateRoute>
        <IntegrationsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/finance",
    element: (
      <PrivateRoute>
        <FinancePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/docs",
    element: (
      <PrivateRoute>
        <DocsPage />
      </PrivateRoute>
    ),
  },
]);
