import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { CompanyData } from "@/types/company";

export const useCompanyData = (companyId: string | null) => {
  return useQuery<CompanyData | null, Error>({
    queryKey: ["companyData", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const docRef = doc(db, "transportation_companies", companyId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error("Company document not found");
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        email: data.email,
        logo: data.logo,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as CompanyData;
    },
    enabled: !!companyId,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
