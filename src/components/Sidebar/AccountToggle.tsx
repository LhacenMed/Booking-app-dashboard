import React, { useState, useRef } from "react";
import { FiChevronDown, FiChevronUp, FiLogOut } from "react-icons/fi";
import { auth, db } from "../../../FirebaseConfig";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  getLocalAccounts,
  removeAccountFromLocalStorage,
} from "@/utils/localAccounts";
import { useAdminData } from "@/hooks/useQueries";
import { collection, query, where, getDocs } from "firebase/firestore";

interface StoredAccount {
  id: string; // This is now the admin_XXXX format
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
  const { data: adminData, isLoading } = useAdminData(
    auth.currentUser?.uid || null
  );

  // Debug current state
  React.useEffect(() => {
    console.log("Auth current user:", auth.currentUser?.uid);
    console.log("Admin data:", adminData);
  }, [adminData]);

  // Load local accounts whenever adminData changes or dropdown is expanded
  React.useEffect(() => {
    const loadAccounts = () => {
      try {
        const accounts = getLocalAccounts();
        console.log("Current admin ID:", adminData?.id);
        console.log("All local accounts:", accounts);

        if (!accounts || accounts.length === 0) {
          console.log("No local accounts found");
          setLocalAccounts([]);
          return;
        }

        if (!adminData?.id) {
          console.log("No admin data yet, keeping all accounts");
          setLocalAccounts(accounts);
          return;
        }

        // Filter out current account and sort by last login
        const filteredAccounts = accounts
          .filter((account) => {
            const shouldInclude = account.id !== adminData.id;
            console.log(
              `Comparing account ${account.id} with current admin ${adminData.id}: ${shouldInclude ? "included" : "filtered out"}`
            );
            return shouldInclude;
          })
          .sort((a, b) => {
            const dateA = new Date(a.lastLoginAt || 0).getTime();
            const dateB = new Date(b.lastLoginAt || 0).getTime();
            return dateB - dateA;
          });

        console.log("Setting filtered accounts:", filteredAccounts);
        setLocalAccounts(filteredAccounts);
      } catch (error) {
        console.error("Error loading local accounts:", error);
        setLocalAccounts([]);
      }
    };

    if (isExpanded || adminData) {
      loadAccounts();
    }
  }, [isExpanded, adminData]);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
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

      // First sign in with email/password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        account.email,
        password
      );

      // Verify that the Firebase user corresponds to the selected admin account
      const adminsQuery = query(
        collection(db, "admins"),
        where("firebaseUid", "==", userCredential.user.uid)
      );
      const querySnapshot = await getDocs(adminsQuery);

      if (querySnapshot.empty) {
        throw new Error("Failed to authenticate admin account");
      }

      const adminDoc = querySnapshot.docs[0];
      if (adminDoc.id !== account.id) {
        throw new Error("Account mismatch");
      }

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
      <div className="border-b mb-4 mt-2 pb-4 border-divider px-3">
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

  if (!adminData) {
    return null;
  }

  return (
    <div className="border-b mb-4 mt-2 pb-4 border-divider px-3">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex p-0.5 hover:bg-content2 rounded transition-colors relative gap-2 w-full items-center"
        >
          <img
            src={adminData.logo.url}
            alt={`${adminData.name} logo`}
            className="size-8 rounded shrink-0 bg-white shadow-small object-contain"
          />
          <div className="text-start">
            <span className="text-sm font-bold block text-foreground">
              {adminData.name}
            </span>
            <span className="text-xs block text-default-500">
              {adminData.email}
            </span>
          </div>

          {isExpanded ? (
            <FiChevronUp className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-default-400" />
          ) : (
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-default-400" />
          )}
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 w-full bg-content1 rounded-lg shadow-lg mt-2 py-2 z-50">
            {localAccounts.map((account) => (
              <div
                key={account.id}
                className="px-2 py-1.5 hover:bg-content2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={account.logo.url}
                    alt={`${account.name} logo`}
                    className="size-6 rounded shrink-0 bg-white shadow-small object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {account.name}
                    </div>
                    <div className="text-xs text-default-500 truncate">
                      {account.email}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSwitchAccount(account)}
                    className="text-xs text-primary hover:text-primary-500"
                  >
                    Switch
                  </button>
                  <button
                    onClick={() => handleRemoveAccount(account.id)}
                    className="text-xs text-danger hover:text-danger-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t border-divider mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger hover:bg-content2"
              >
                <FiLogOut className="text-lg" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
