import React from "react";
import { IconType } from "react-icons";
import { Link, useLocation } from "react-router-dom";
import {
  FiDollarSign,
  FiHome,
  FiLink,
  FiPaperclip,
  FiUsers,
} from "react-icons/fi";

const routes = [
  { path: "/dashboard", Icon: FiHome, title: "Dashboard" },
  { path: "/team", Icon: FiUsers, title: "Team" },
  { path: "/trips", Icon: FiPaperclip, title: "Trips" },
  { path: "/integrations", Icon: FiLink, title: "Integrations" },
  { path: "/finance", Icon: FiDollarSign, title: "Finance" },
];

export const RouteSelect = () => {
  const location = useLocation();

  return (
    <div className="space-y-1">
      {routes.map((route) => (
        <Route
          key={route.path}
          Icon={route.Icon}
          selected={location.pathname === route.path}
          title={route.title}
          path={route.path}
        />
      ))}
    </div>
  );
};

const Route = ({
  selected,
  Icon,
  title,
  path,
}: {
  selected: boolean;
  Icon: IconType;
  title: string;
  path: string;
}) => {
  return (
    <Link
      to={path}
      className={`flex items-center justify-start gap-2 w-full rounded px-2 py-1.5 text-sm transition-[box-shadow,_background-color,_color] ${
        selected
          ? "bg-content1 text-foreground shadow-small"
          : "hover:bg-content2 bg-transparent text-default-500 shadow-none"
      }`}
    >
      <Icon className={selected ? "text-primary" : ""} />
      <span>{title}</span>
    </Link>
  );
};
