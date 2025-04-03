import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Timestamp } from "firebase/firestore";

interface CompanyStatus {
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const useCompanyStatus = (companyId: string | null) => {
  return useQuery<CompanyStatus | null>({
    queryKey: ["companyStatus", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const companyRef = doc(db, "transportation_companies", companyId);
      const companyDoc = await getDoc(companyRef);

      if (!companyDoc.exists()) {
        console.error("Company document not found");
        return null;
      }

      const data = companyDoc.data();

      return {
        status: data.status || "pending",
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
      };
    },
    enabled: !!companyId,
    // Check status more frequently since it's important
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};
