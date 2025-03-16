export interface CompanyLogo {
  publicId: string;
  url: string;
  uploadedAt: string;
}

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  logo: CompanyLogo;
  lastLoginAt: string;
}

export interface CompanyData {
  id: string;
  name: string;
  email: string;
  logo: CompanyLogo;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  updatedAt: any;
} 