import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import DashboardPage from "./pages/dashboard";
import IndexPage from "./pages/index";
import DocsPage from "./pages/docs";
import TeamPage from "./pages/team";
import TripsPage from "./pages/trips";
import IntegrationsPage from "./pages/integrations";
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
import MessageEmail from "./pages/message-email"

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
        element: (
          <ProtectedRoute requireAuth requireOnboarding>
            <AppLayout />
          </ProtectedRoute>
        ),
        errorElement: <ErrorPage />,
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
              <ProtectedRoute requireAuth requireStatus="approved">
                <FinancePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "/docs",
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
