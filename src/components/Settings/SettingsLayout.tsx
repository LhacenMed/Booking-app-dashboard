import { Outlet, useLocation, Link } from "react-router-dom";
import {
  FiSettings,
  FiCreditCard,
  FiGlobe,
  FiBook,
  FiUsers,
  FiLink,
  FiBarChart2,
  FiShield,
  FiKey,
  FiCode,
  FiAnchor,
  FiBell,
} from "react-icons/fi";

/**
 * Settings navigation items organized by categories
 */
const SETTINGS_CATEGORIES = [
  {
    title: "Workspace",
    items: [
      { path: "/dashboard/settings", icon: <FiSettings />, title: "General" },
      {
        path: "/dashboard/settings/billing",
        icon: <FiCreditCard />,
        title: "Billing",
      },
      {
        path: "/dashboard/settings/domains",
        icon: <FiGlobe />,
        title: "Domains",
      },
      {
        path: "/dashboard/settings/library",
        icon: <FiBook />,
        title: "Library",
      },
      { path: "/dashboard/settings/team", icon: <FiUsers />, title: "People" },
      {
        path: "/dashboard/settings/integrations",
        icon: <FiLink />,
        title: "Integrations",
      },
      {
        path: "/dashboard/settings/analytics",
        icon: <FiBarChart2 />,
        title: "Analytics",
      },
      {
        path: "/dashboard/settings/security",
        icon: <FiShield />,
        title: "Security",
      },
    ],
  },
  {
    title: "Developer",
    items: [
      {
        path: "/dashboard/settings/api-keys",
        icon: <FiKey />,
        title: "API Keys",
      },
      {
        path: "/dashboard/settings/oauth",
        icon: <FiCode />,
        title: "OAuth Apps",
      },
      {
        path: "/dashboard/settings/webhooks",
        icon: <FiAnchor />,
        title: "Webhooks",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        path: "/dashboard/settings/notifications",
        icon: <FiBell />,
        title: "Notifications",
      },
    ],
  },
];

/**
 * Settings Navigation Menu - Used in the sidebar
 * Organized with categories matching the design in the image
 */
export const SettingsMenu = () => {
  const { pathname } = useLocation();

  return (
    <div className="px-3 py-2">
      {SETTINGS_CATEGORIES.map((category) => (
        <div key={category.title} className="mb-4">
          <h3 className="text-sm font-medium text-default-500 px-2 mb-1">
            {category.title}
          </h3>
          <div className="space-y-1">
            {category.items.map(({ path, icon, title }) => {
              // Consider both /dashboard/settings and /dashboard/settings/general as active for General page
              const isActive =
                pathname === path ||
                (path === "/dashboard/settings" &&
                  pathname === "/dashboard/settings/general");

              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-content1 text-foreground shadow-small"
                      : "hover:bg-content2 bg-transparent text-default-500 shadow-none"
                  }`}
                >
                  <span
                    className={`${isActive ? "text-primary" : "text-default-500"}`}
                  >
                    {icon}
                  </span>
                  <span>{title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Settings Layout - Used in the main content area
 */
export const SettingsLayout = () => {
  return (
    <div className="p-6 w-full">
      <div className="bg-content1 rounded-lg shadow">
        <div className="p-6 border-b border-divider">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-default-500 text-sm mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
