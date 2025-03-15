interface StoredAccount {
  id: string;
  name: string;
  email: string;
  logo: {
    url: string;
  };
  lastLoginAt: string;
}

const LOCAL_STORAGE_KEY = "recentAccounts";

export const addAccountToLocalStorage = (
  account: Omit<StoredAccount, "lastLoginAt"> & { lastLoginAt?: string }
) => {
  try {
    // Basic validation
    if (!account || !account.id || !account.name || !account.email) {
      console.error("Missing basic account data");
      return false;
    }

    // Create new account object with all required fields
    const newAccount = {
      id: account.id,
      name: account.name,
      email: account.email,
      logo: { url: account.logo?.url || "" },
      lastLoginAt: account.lastLoginAt || new Date().toISOString(),
    };

    console.log("Prepared account data:", newAccount);

    // Get existing accounts
    let existingAccounts: StoredAccount[] = [];
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed)) {
          existingAccounts = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse existing accounts:", e);
      }
    }

    console.log("Existing accounts:", existingAccounts);

    // Remove if account already exists
    const filteredAccounts = existingAccounts.filter(
      (acc) => acc.id !== newAccount.id
    );

    // Add new account at the beginning
    const updatedAccounts = [newAccount, ...filteredAccounts].slice(0, 5);
    console.log("Saving accounts:", updatedAccounts);

    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedAccounts));

    // Verify save was successful
    const verifyData = localStorage.getItem(LOCAL_STORAGE_KEY);
    console.log("Verify saved data:", verifyData);

    return true;
  } catch (error) {
    console.error("Error saving account to local storage:", error);
    return false;
  }
};

export const getLocalAccounts = (): StoredAccount[] => {
  try {
    const accounts = localStorage.getItem(LOCAL_STORAGE_KEY);
    console.log("Raw storage data:", accounts);

    if (!accounts) {
      console.log("No accounts in storage");
      return [];
    }

    let parsedAccounts: any[];
    try {
      parsedAccounts = JSON.parse(accounts);
      console.log("Parsed accounts:", parsedAccounts);
    } catch (e) {
      console.error("Failed to parse accounts:", e);
      return [];
    }

    if (!Array.isArray(parsedAccounts)) {
      console.error("Storage data is not an array");
      return [];
    }

    // Filter and validate accounts
    const validAccounts = parsedAccounts.filter((acc) => {
      const isValid =
        acc &&
        typeof acc === "object" &&
        typeof acc.id === "string" &&
        typeof acc.name === "string" &&
        typeof acc.email === "string" &&
        acc.logo &&
        typeof acc.logo.url === "string";

      if (!isValid) {
        console.warn("Invalid account data:", acc);
      }
      return isValid;
    });

    console.log("Valid accounts:", validAccounts);
    return validAccounts;
  } catch (error) {
    console.error("Error reading accounts from local storage:", error);
    return [];
  }
};

export const removeAccountFromLocalStorage = (accountId: string) => {
  try {
    console.log("Removing account:", accountId);
    const accounts = getLocalAccounts();
    const filteredAccounts = accounts.filter((acc) => acc.id !== accountId);
    console.log("Updated accounts after removal:", filteredAccounts);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredAccounts));
    return true;
  } catch (error) {
    console.error("Error removing account from local storage:", error);
    return false;
  }
};
