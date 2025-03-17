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
import { Timestamp } from "firebase/firestore";

interface CompanyData {
  id: string;
  name: string;
  email: string;
  logo: {
    url: string;
  };
}

interface Trip {
  id: string;
  departureCity: string;
  destinationCity: string;
  departureTime: Timestamp | null;
  arrivalTime: Timestamp | null;
  carType: "medium" | "large";
  pricePerSeat: number;
  createdAt: Timestamp | null;
}

export const useCompanyData = (userId: string | null) => {
  return useQuery<CompanyData | null, Error>({
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
  return useQuery<Trip[], Error>({
    queryKey: ["trips", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const tripsQuery = query(
        collection(db, `transportation_companies/${companyId}/trips`)
      );
      const snapshot = await getDocs(tripsQuery);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          departureCity: data.departureCity,
          destinationCity: data.destinationCity,
          departureTime: data.departureTime,
          arrivalTime: data.arrivalTime,
          carType: data.carType,
          pricePerSeat: data.pricePerSeat,
          createdAt: data.createdAt,
        } as Trip;
      });
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 15 * 60 * 1000, // Keep data in cache for 15 minutes
  });
};
