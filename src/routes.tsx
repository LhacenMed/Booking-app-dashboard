import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import DashboardPage from "./pages/dashboard";
import IndexPage from "./pages/index";
import DocsPage from "./pages/docs";
import Home from "./pages/page";
import PrivateRoute from "./components/PrivateRoute";

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
    path: "/docs",
    element: (
      <PrivateRoute>
        <DocsPage />
      </PrivateRoute>
    ),
  },
]);
