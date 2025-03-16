import { StoredAccount, CompanyLogo } from "@/types/company";

const ACCOUNTS_KEY = "stored_accounts";

export const addAccountToLocalStorage = (
  account: Omit<StoredAccount, "lastLoginAt">
) => {
  const accounts = getLocalAccounts();
  const now = new Date().toISOString();

  const newAccount: StoredAccount = {
    ...account,
    lastLoginAt: now,
  };

  const updatedAccounts = accounts
    .filter((acc) => acc.id !== account.id)
    .concat(newAccount);

  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
};

export const getLocalAccounts = (): StoredAccount[] => {
  const accounts = localStorage.getItem(ACCOUNTS_KEY);
  return accounts ? JSON.parse(accounts) : [];
};

export const removeAccountFromLocalStorage = (accountId: string) => {
  const accounts = getLocalAccounts();
  const updatedAccounts = accounts.filter((acc) => acc.id !== accountId);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
};
