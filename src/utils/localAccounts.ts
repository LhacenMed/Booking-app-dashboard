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
  account: Omit<StoredAccount, "lastLoginAt">
) => {
  try {
    if (!account.id || !account.name || !account.email || !account.logo?.url) {
      console.error("Invalid account data:", account);
      return false;
    }

    console.log("Adding account to local storage:", account);
    const existingAccounts = getLocalAccounts();
    console.log("Existing accounts:", existingAccounts);

    const newAccount = { ...account, lastLoginAt: new Date().toISOString() };

    // Remove if account already exists (to update it)
    const filteredAccounts = existingAccounts.filter(
      (acc) => acc.id !== account.id
    );

    // Add new account at the beginning
    const updatedAccounts = [newAccount, ...filteredAccounts].slice(0, 5); // Keep only last 5 accounts
    console.log("Updated accounts list:", updatedAccounts);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedAccounts));
    return true;
  } catch (error) {
    console.error("Error saving account to local storage:", error);
    return false;
  }
};

export const getLocalAccounts = (): StoredAccount[] => {
  try {
    const accounts = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsedAccounts = accounts ? JSON.parse(accounts) : [];
    console.log("Retrieved accounts from local storage:", parsedAccounts);
    return parsedAccounts;
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
