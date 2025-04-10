import { Command } from "cmdk";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  FiHome,
  FiDollarSign,
  FiUsers,
  FiLink,
  FiTruck,
  FiLogOut,
  FiSearch,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAgency } from "@/hooks/useAgency";
import { auth } from "@/config/firebase";

interface Page {
  title: string;
  href: string;
  icon: JSX.Element;
  description: string;
  keywords: string[];
}

const pages: Page[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <FiHome className="text-default-500" />,
    description: "Overview of your business",
    keywords: ["home", "overview", "stats", "analytics"],
  },
  {
    title: "Trips",
    href: "/trips",
    icon: <FiTruck className="text-default-500" />,
    description: "Manage your trips and bookings",
    keywords: ["bookings", "routes", "schedule", "transport"],
  },
  {
    title: "Finance",
    href: "/finance",
    icon: <FiDollarSign className="text-default-500" />,
    description: "Financial reports and transactions",
    keywords: ["money", "payments", "revenue", "transactions", "reports"],
  },
  {
    title: "Team",
    href: "/team",
    icon: <FiUsers className="text-default-500" />,
    description: "Manage team members and roles",
    keywords: ["members", "staff", "employees", "roles", "permissions"],
  },
  {
    title: "Settings",
    href: "/Settings",
    icon: <FiLink className="text-default-500" />,
    description: "Connect with other services",
    keywords: ["connect", "services", "apps", "tools"],
  },
];

export const CommandMenu = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [value, setValue] = useState("");
  const [pages_filtered, setFilteredPages] = useState<Page[]>(pages);
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid || null;
  const { status: statusData } = useAgency(userId);
  const isPending = statusData?.status === "pending";

  // Filter pages based on search input
  useEffect(() => {
    if (!value) {
      setFilteredPages(pages);
      return;
    }

    const searchTerm = value.toLowerCase();
    const filtered = pages.filter((page) => {
      return (
        page.title.toLowerCase().includes(searchTerm) ||
        page.description.toLowerCase().includes(searchTerm) ||
        page.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchTerm)
        )
      );
    });
    setFilteredPages(filtered);
  }, [value]);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isPending) {
          setOpen((open) => !open);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isPending]);

  const handleSelect = (href: string) => {
    if (isPending && href !== "/dashboard") return;
    navigate(href);
    setOpen(false);
    setValue("");
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(open) => {
        if (isPending && open) return;
        setOpen(open);
      }}
      label="Global Command Menu"
      className="fixed inset-0 bg-overlay/50"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-lg shadow-medium border-divider border overflow-hidden w-full max-w-lg mx-auto mt-12"
      >
        <div className="flex items-center gap-2 px-3 border-b border-divider">
          <FiSearch className="text-default-400" />
          <Command.Input
            value={value}
            onValueChange={setValue}
            placeholder={isPending ? "Search (Pending)" : "Search pages..."}
            className="w-full py-3 text-foreground placeholder:text-default-400 focus:outline-none bg-transparent"
            disabled={isPending}
          />
        </div>

        <Command.List className="p-3 max-h-[300px] overflow-y-auto">
          <Command.Empty className="py-6 text-center text-sm text-default-400">
            No results found for "{value}"
          </Command.Empty>

          {pages_filtered.length > 0 && (
            <Command.Group
              heading="Pages"
              className="text-sm mb-3 text-default-400"
            >
              {pages_filtered.map((page) => (
                <Command.Item
                  key={page.href}
                  value={page.title}
                  onSelect={() => handleSelect(page.href)}
                  className={`flex cursor-pointer transition-colors p-2 text-sm text-foreground hover:bg-content2 rounded items-center gap-2 ${
                    isPending && page.href !== "/dashboard"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {page.icon}
                  <div className="flex flex-col">
                    <span className="font-medium">{page.title}</span>
                    <span className="text-xs text-default-400">
                      {page.description}
                    </span>
                  </div>
                  {isPending && page.href !== "/dashboard" && (
                    <span className="ml-auto text-xs text-warning">
                      Pending
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Item
            onSelect={() => {
              // Handle logout
              setOpen(false);
            }}
            className="flex cursor-pointer transition-colors p-2 text-sm text-danger-foreground hover:bg-danger/20 rounded items-center gap-2 mt-2"
          >
            <FiLogOut />
            Sign Out
          </Command.Item>
        </Command.List>
      </div>
    </Command.Dialog>
  );
};
