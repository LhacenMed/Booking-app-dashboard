import { IconType } from "react-icons";
import { Link, useLocation } from "react-router-dom";
import {
  FiDollarSign,
  FiHome,
  FiLink,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";
import { auth } from "@/config/firebase";

const routes = [
  { path: "/dashboard", Icon: FiHome, title: "Dashboard" },
  { path: "/team", Icon: FiUsers, title: "Team" },
  { path: "/trips", Icon: FiTruck, title: "Trips" },
  { path: "/integrations", Icon: FiLink, title: "Integrations" },
  { path: "/finance", Icon: FiDollarSign, title: "Finance" },
];

export const RouteSelect = () => {
  const location = useLocation();
  const userId = auth.currentUser?.uid || null;
  const { data: statusData } = useCompanyStatus(userId);
  const isPending = statusData?.status === "pending";

  return (
    <div className="space-y-1 px-3">
      {routes.map((route) => (
        <Route
          key={route.path}
          Icon={route.Icon}
          selected={location.pathname === route.path}
          title={route.title}
          path={route.path}
          disabled={isPending && route.path !== "/dashboard"}
        />
      ))}
    </div>
  );
};

const Route = ({
  // selected,
  Icon,
  title,
  path,
  disabled,
}: {
  selected: boolean;
  Icon: IconType;
  title: string;
  path: string;
  disabled?: boolean;
}) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(path);

  return (
    <Link
      to={path}
      className={`flex items-center justify-start gap-2 w-full rounded px-2 py-1.5 text-sm transition-[box-shadow,_background-color,_color] ${
        isActive
          ? "bg-content1 text-foreground shadow-small"
          : "hover:bg-content2 bg-transparent text-default-500 shadow-none"
      } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
    >
      <Icon className={isActive ? "text-primary" : ""} />
      <span>{title}</span>
    </Link>
  );
};
