import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { FiChevronDown } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string; logoUrl: string }>;
  placeholder?: string;
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const items: MenuProps["items"] = options.map((opt) => ({
    key: opt.id,
    label: (
      <div className="flex items-center gap-2">
        <img
          src={opt.logoUrl}
          alt={opt.name}
          className="w-10 h-10 rounded-md object-contain"
        />
        <span className="text-white">{opt.name}</span>
      </div>
    ),
    className: cn(
      "px-3 py-2.5 text-[15px]",
      "text-gray-400 [&>*]:!text-inherit",
      "[&:hover]:!bg-white/5 hover:text-white transition-colors cursor-pointer",
      value === opt.id && "!bg-white/10 !text-white [&>*]:!text-white"
    ),
  }));

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => onChange(key),
        selectedKeys: value ? [value] : [],
        className:
          "py-1 bg-[#141414] border border-white/10 rounded-lg shadow-xl [&_.ant-dropdown-menu-item]:!text-inherit [&_.ant-dropdown-menu-item:not(:last-child)]:mb-1.5",
        style: { backgroundColor: "#141414" },
      }}
      trigger={["click"]}
      placement="bottomLeft"
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      <button
        className={cn(
          "w-full px-3 text-left rounded-lg h-[55px]",
          "bg-[#141414] border border-white/10",
          "flex items-center justify-between gap-2",
          "hover:border-white/20 transition-all",
          "text-[15px] text-gray-400"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption && (
            <img
              src={selectedOption.logoUrl}
              alt={selectedOption.name}
              className="w-10 h-10 rounded-md object-contain flex-shrink-0"
            />
          )}
          <span className="truncate">
            {selectedOption?.name || placeholder}
          </span>
        </div>
        <FiChevronDown
          className={cn(
            "flex-shrink-0 opacity-40 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
    </Dropdown>
  );
}
