import React from "react";
import {
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  Avatar,
  Switch,
  Tooltip,
} from "@heroui/react";
import { FiSearch, FiBell } from "react-icons/fi";
import { MoonFilledIcon, SunFilledIcon } from "@/components/icons";
import { useTheme } from "@heroui/use-theme";
import { useNavigate } from "react-router-dom";
import { useCompanyData } from "@/hooks/useQueries";
import { auth } from "../../../FirebaseConfig";

interface DashboardTopBarProps {
  searchPlaceholder?: string;
  showSearch?: boolean;
  rightContent?: React.ReactNode;
}

// Add a custom style for the avatar
const avatarStyles = {
  "--avatar-img-object-fit": "contain",
  backgroundColor: "white",
} as React.CSSProperties;

export const DashboardTopBar = ({
  searchPlaceholder = "Search...",
  showSearch = true,
  rightContent,
}: DashboardTopBarProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const userId = auth.currentUser?.uid || null;
  const { data: companyData, isLoading } = useCompanyData(userId);

  return (
    <div className="sticky top-0 bg-content1 border-b border-divider px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
              <Input
                type="text"
                className="pl-10"
                placeholder={searchPlaceholder}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {rightContent}
          <Tooltip content="Notifications">
            <Button isIconOnly variant="light" className="relative">
              <FiBell className="h-5 w-5" />
              <div className="absolute top-1 right-1">
                <Badge color="danger">5</Badge>
              </div>
            </Button>
          </Tooltip>
          {!isLoading && (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                {companyData ? (
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform bg-white"
                    style={avatarStyles}
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
                  <DropdownItem key="company_profile">
                    Company Profile
                  </DropdownItem>
                  <DropdownItem key="settings">Settings</DropdownItem>
                  <DropdownItem key="help">Help & Support</DropdownItem>
                  <DropdownItem key="logout" color="danger">
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
      </div>
    </div>
  );
};
