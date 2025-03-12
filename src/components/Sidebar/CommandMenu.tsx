import { Command } from "cmdk";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FiEye, FiLink, FiLogOut, FiPhone, FiPlus } from "react-icons/fi";

export const CommandMenu = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [value, setValue] = useState("");

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 bg-overlay/50"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-lg shadow-medium border-divider border overflow-hidden w-full max-w-lg mx-auto mt-12"
      >
        <Command.Input
          value={value}
          onValueChange={setValue}
          placeholder="What do you need?"
          className="relative border-b border-divider p-3 text-lg w-full text-foreground placeholder:text-default-400 focus:outline-none"
        />
        <Command.List className="p-3">
          <Command.Empty>
            No results found for <span className="text-primary">"{value}"</span>
          </Command.Empty>

          <Command.Group
            heading="Team"
            className="text-sm mb-3 text-default-400"
          >
            <Command.Item className="flex cursor-pointer transition-colors p-2 text-sm text-foreground hover:bg-content2 rounded items-center gap-2">
              <FiPlus className="text-default-500" />
              Invite Member
            </Command.Item>
            <Command.Item className="flex cursor-pointer transition-colors p-2 text-sm text-foreground hover:bg-content2 rounded items-center gap-2">
              <FiEye className="text-default-500" />
              See Org Chart
            </Command.Item>
          </Command.Group>

          <Command.Group
            heading="Integrations"
            className="text-sm text-default-400 mb-3"
          >
            <Command.Item className="flex cursor-pointer transition-colors p-2 text-sm text-foreground hover:bg-content2 rounded items-center gap-2">
              <FiLink className="text-default-500" />
              Link Services
            </Command.Item>
            <Command.Item className="flex cursor-pointer transition-colors p-2 text-sm text-foreground hover:bg-content2 rounded items-center gap-2">
              <FiPhone className="text-default-500" />
              Contact Support
            </Command.Item>
          </Command.Group>

          <Command.Item className="flex cursor-pointer transition-colors p-2 text-sm text-danger-foreground hover:bg-danger/20 bg-danger rounded items-center gap-2">
            <FiLogOut />
            Sign Out
          </Command.Item>
        </Command.List>
      </div>
    </Command.Dialog>
  );
};
