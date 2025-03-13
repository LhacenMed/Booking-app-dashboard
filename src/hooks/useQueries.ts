import { useQuery } from "@tanstack/react-query";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../FirebaseConfig";

export const useCompanyData = (userId: string | null) => {
  return useQuery({
    queryKey: ["company", userId],
    queryFn: async () => {
      if (!userId) return null;
      const companyDoc = await getDoc(doc(db, "companies", userId));
      if (!companyDoc.exists()) return null;
      return {
        id: companyDoc.id,
        name: companyDoc.data().name,
        email: companyDoc.data().email,
        logo: companyDoc.data().logo,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });
};

export const useTrips = (companyId: string | null) => {
  return useQuery({
    queryKey: ["trips", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const tripsQuery = query(
        collection(db, "trips"),
        where("companyId", "==", companyId)
      );
      const snapshot = await getDocs(tripsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 15 * 60 * 1000, // Keep data in cache for 15 minutes
  });
};
