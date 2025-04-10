import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import DashboardPage from "./pages/dashboard";
import IndexPage from "./pages/index";
import DocsPage from "./pages/docs";
import TeamPage from "./pages/team";
import TripsPage from "./pages/trips";
import FinancePage from "./pages/finance";
import { SeatManagement } from "./components/Trips/SeatManagement";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import WelcomePage from "./pages/onboarding/welcome";
import SelectCompanyPage from "./pages/onboarding/select-company";
import AgencyDetailsPage from "./pages/onboarding/agency-details";
import StaffPage from "./pages/onboarding/staff";
import BillingPage from "./pages/onboarding/billing";
import CreditsPage from "./pages/onboarding/credits";
import ReviewPage from "./pages/onboarding/review";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import NotFoundPage from "./pages/404";
import ErrorPage from "./components/ErrorBoundary/ErrorPage";
import MessageEmail from "./pages/message-email";
import SignUpTestPage0 from "./pages/signup-test0";
import SignUpTestPage1 from "./pages/signup-test1";
import MapPage from "./pages/map";
// Import settings components
import { SettingsLayout } from "./components/Settings/SettingsLayout";
import { GeneralSettings } from "./pages/settings/general";
import { TeamSettings } from "./pages/settings/team";
import { NotificationSettings } from "./pages/settings/notifications";
import { SecuritySettings } from "./pages/settings/security";
import { BillingSettings } from "./pages/settings/billing";
import { IntegrationsSettings } from "./pages/settings/integrations";

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
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
        path: "/message-email",
        element: <MessageEmail />,
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
        path: "/map",
        element: <MapPage />,
      },
      // Onboarding Flow
      {
        path: "/onboarding",
        element: (
          <ProtectedRoute requireAuth>
            <OnboardingLayout>
              <Outlet />
            </OnboardingLayout>
          </ProtectedRoute>
        ),
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <Navigate to="/onboarding/select-company" replace />,
          },
          {
            path: "welcome",
            element: <WelcomePage />,
          },
          {
            path: "select-company",
            element: <SelectCompanyPage />,
          },
          {
            path: "agency-details",
            element: <AgencyDetailsPage />,
          },
          {
            path: "staff",
            element: <StaffPage />,
          },
          {
            path: "billing",
            element: <BillingPage />,
          },
          {
            path: "credits",
            element: <CreditsPage />,
          },
          {
            path: "review",
            element: <ReviewPage />,
          },
        ],
      },
      // Main Application Routes
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute requireAuth requireOnboarding>
            <AppLayout />
          </ProtectedRoute>
        ),
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "team",
            element: <TeamPage />,
          },
          {
            path: "trips",
            children: [
              {
                index: true,
                element: <TripsPage />,
              },
              {
                path: "seats/:tripId",
                element: <SeatManagement />,
              },
            ],
          },
          {
            path: "settings",
            element: <SettingsLayout />,
            children: [
              {
                index: true,
                element: <GeneralSettings />,
              },
              {
                path: "general",
                element: <GeneralSettings />,
              },
              {
                path: "team",
                element: <TeamSettings />,
              },
              {
                path: "notifications",
                element: <NotificationSettings />,
              },
              {
                path: "security",
                element: <SecuritySettings />,
              },
              {
                path: "billing",
                element: <BillingSettings />,
              },
              {
                path: "integrations",
                element: <IntegrationsSettings />,
              },
            ],
          },
          {
            path: "finance",
            element: (
              <ProtectedRoute requireAuth requireStatus="approved">
                <FinancePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "docs",
            element: <DocsPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
