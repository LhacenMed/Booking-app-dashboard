import React, { useState, useRef } from "react";
import { FiChevronDown, FiChevronUp, FiLogOut, FiPlus } from "react-icons/fi";
import { auth } from "../../../FirebaseConfig";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  getLocalAccounts,
  removeAccountFromLocalStorage,
} from "@/utils/localAccounts";
import { useCompanyData } from "@/hooks/useQueries";

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  logo: {
    url: string;
  };
  lastLoginAt: string;
}

export const AccountToggle = () => {
  const navigate = useNavigate();
  const [localAccounts, setLocalAccounts] = useState<StoredAccount[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: companyData, isLoading } = useCompanyData(
    auth.currentUser?.uid || null
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load local accounts whenever the dropdown is expanded
  React.useEffect(() => {
    if (isExpanded) {
      const accounts = getLocalAccounts();
      console.log("Fetched local accounts:", accounts);

      // Filter out current account and sort by last login
      const filteredAccounts = accounts
        .filter((account) => account.id !== companyData?.id)
        .sort(
          (a, b) =>
            new Date(b.lastLoginAt).getTime() -
            new Date(a.lastLoginAt).getTime()
        );

      console.log("Filtered accounts:", filteredAccounts);
      setLocalAccounts(filteredAccounts);
    }
  }, [isExpanded, companyData?.id]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSwitchAccount = async (account: StoredAccount) => {
    try {
      const password = window.prompt(
        "Please enter your password to switch accounts:"
      );
      if (!password) return;

      await signInWithEmailAndPassword(auth, account.email, password);
      setIsExpanded(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error switching account:", error);
      alert(
        "Failed to switch account. Please check your password and try again."
      );
    }
  };

  const handleRemoveAccount = (accountId: string) => {
    removeAccountFromLocalStorage(accountId);
    setLocalAccounts(localAccounts.filter((acc) => acc.id !== accountId));
  };

  if (isLoading) {
    return (
      <div className="border-b mb-4 mt-2 pb-4 border-divider">
        <div className="flex p-0.5 relative gap-2 w-full items-center">
          <div className="size-8 rounded shrink-0 bg-default-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-default-200 rounded animate-pulse mb-1" />
            <div className="h-3 bg-default-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return null;
  }

  return (
    <div className="border-b mb-4 mt-2 pb-4 border-divider">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex p-0.5 hover:bg-content2 rounded transition-colors relative gap-2 w-full items-center"
        >
          <img
            src={companyData.logo.url}
            alt={`${companyData.name} logo`}
            className="size-8 rounded shrink-0 bg-white shadow-small object-contain"
          />
          <div className="text-start">
            <span className="text-sm font-bold block text-foreground">
              {companyData.name}
            </span>
            <span className="text-xs block text-default-500">
              {companyData.email}
            </span>
          </div>

          {isExpanded ? (
            <FiChevronUp className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-default-400" />
          ) : (
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-default-400" />
          )}
        </button>

        {/* Dropdown Menu */}
        {isExpanded && (
          <div className="absolute top-full left-0 w-full mt-1 py-2 bg-content1 rounded-lg shadow-lg border border-divider z-50">
            {/* Other Accounts Section */}
            {localAccounts.length > 0 && (
              <>
                <div className="px-2 py-1">
                  <span className="text-xs font-semibold text-default-500">
                    Other Accounts
                  </span>
                </div>
                {localAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="group relative flex items-center w-full"
                  >
                    <button
                      onClick={() => handleSwitchAccount(account)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-content2 transition-colors"
                    >
                      <img
                        src={account.logo.url}
                        alt={`${account.name} logo`}
                        className="size-6 rounded shrink-0 bg-white shadow-small object-contain"
                      />
                      <div className="text-start flex-1">
                        <span className="text-sm block text-foreground">
                          {account.name}
                        </span>
                        <span className="text-xs block text-default-500">
                          {account.email}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRemoveAccount(account.id)}
                      className="opacity-0 group-hover:opacity-100 absolute right-2 p-1 hover:bg-danger/10 rounded transition-all"
                    >
                      <span className="text-xs text-danger">Remove</span>
                    </button>
                  </div>
                ))}
                <div className="h-px bg-divider my-2" />
              </>
            )}

            {/* Add Account Button */}
            <button
              onClick={() => navigate("/signup")}
              className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-content2 transition-colors text-default-600"
            >
              <FiPlus className="text-lg" />
              <span className="text-sm">Add another account</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-content2 transition-colors text-danger"
            >
              <FiLogOut className="text-lg" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
