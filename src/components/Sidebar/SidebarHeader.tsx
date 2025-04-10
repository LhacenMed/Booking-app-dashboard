import {
  Avatar,
  DropdownItem,
  DropdownMenu,
  Dropdown,
  DropdownTrigger,
  Switch,
  Button,
} from "@heroui/react";
import { auth } from "@/config/firebase";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { MoonFilledIcon, SunFilledIcon } from "../icons";
import { useTheme } from "@heroui/use-theme";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { signOut } from "firebase/auth";

const useAgency = (companyId: string | null) => {
  return useQuery({
    queryKey: ["companyData", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const docRef = doc(db, "agencies", companyId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return {
        name: docSnap.data().name,
        email: docSnap.data().email,
        logo: docSnap.data().logo,
      };
    },
    enabled: !!companyId,
  });
};

export const SidebarHeader = () => {
  const userId = auth.currentUser?.uid || null;
  const { data: companyData, isLoading } = useAgency(userId);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route is a settings page
  const isSettingsRoute = location.pathname.includes("/settings");

  // Handler for back button click
  const handleBackClick = () => {
    navigate("/dashboard");
  };

  // Handler for logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-divider">
      {isSettingsRoute ? (
        // Back button for settings pages
        <Button
          variant="flat"
          size="sm"
          startContent={<FiArrowLeft />}
          onPress={handleBackClick}
          className="px-2"
        >
          Back
        </Button>
      ) : (
        // Company name for non-settings pages
        <span className="text-xl font-bold">SupNum</span>
      )}

      {!isLoading && (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            {companyData ? (
              <Avatar
                isBordered
                as="button"
                className="transition-transform bg-white"
                color="warning"
                name={companyData.name}
                size="sm"
                src={companyData.logo.url}
                imgProps={{
                  className: "object-contain",
                }}
              />
            ) : (
              <Avatar
                isDisabled
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                name=""
                size="sm"
                src=""
              />
            )}
          </DropdownTrigger>
          {companyData ? (
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold text-primary">
                  {companyData.email}
                </p>
              </DropdownItem>
              <DropdownItem key="theme" className="h-14 gap-2">
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-2 items-center">
                    {theme === "light" ? (
                      <SunFilledIcon size={20} />
                    ) : (
                      <MoonFilledIcon size={20} />
                    )}
                    <span>Dark mode</span>
                  </div>
                  <Switch
                    defaultSelected={theme === "dark"}
                    size="sm"
                    onChange={() =>
                      setTheme(theme === "light" ? "dark" : "light")
                    }
                  />
                </div>
              </DropdownItem>
              <DropdownItem
                key="settings"
                onPress={() => navigate("/dashboard/settings")}
              >
                Settings
              </DropdownItem>
              <DropdownItem
                key="help"
                onPress={() => navigate("/dashboard/docs")}
              >
                Help & Support
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          ) : (
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem
                key="login"
                className="h-10"
                onPress={() => navigate("/login")}
              >
                <p className="font-semibold">Login</p>
              </DropdownItem>
            </DropdownMenu>
          )}
        </Dropdown>
      )}
    </div>
  );
};
