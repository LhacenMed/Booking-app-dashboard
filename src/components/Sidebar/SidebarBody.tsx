// import { AccountToggle } from "./AccountToggle";
import { Search } from "./Search";
import { RouteSelect } from "./RouteSelect";
import { useLocation } from "react-router-dom";
import { SettingsMenu } from "@/components/Settings/SettingsLayout";
import { useState, useEffect } from "react";
// import { AccountToggle } from "./AccountToggle";

/**
 * SidebarBody Component
 *
 * Conditionally renders either the main navigation menu or settings menu
 * based on the current route with smooth horizontal transitions.
 */
function SidebarBody() {
  // Check if current route is a settings page
  const { pathname } = useLocation();
  const isSettingsRoute = pathname.includes("/settings");

  // Animation states
  const [showMainMenu, setShowMainMenu] = useState(!isSettingsRoute);
  const [showSettingsMenu, setShowSettingsMenu] = useState(isSettingsRoute);

  // Handle transition between menus with animation
  useEffect(() => {
    if (isSettingsRoute) {
      setShowMainMenu(false);
      setTimeout(() => setShowSettingsMenu(true), 100);
    } else {
      setShowSettingsMenu(false);
      setTimeout(() => setShowMainMenu(true), 100);
    }
  }, [isSettingsRoute]);

  return (
    <div className="h-full overflow-x-hidden relative">
      {/* <AccountToggle /> */}
      <Search />
      {/* Main menu with horizontal slide animation */}
      <div
        className={`absolute inset-x-0 w-full transition-transform duration-150 ease-out ${
          showMainMenu
            ? "transform translate-x-0"
            : "transform -translate-x-full pointer-events-none"
        }`}
      >
        <RouteSelect />
      </div>

      {/* Settings menu with horizontal slide animation */}
      <div
        className={`absolute inset-x-0 w-full transition-transform duration-150 ease-out ${
          showSettingsMenu
            ? "transform translate-x-0"
            : "transform translate-x-full pointer-events-none"
        }`}
      >
        <SettingsMenu />
      </div>
    </div>
  );
}

export default SidebarBody;
