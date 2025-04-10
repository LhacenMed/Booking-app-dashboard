import { useQuery } from "@tanstack/react-query";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Timestamp } from "firebase/firestore";

// Company data interface
interface CompanyData {
  id: string;
  name: string;
  email: string;
  logo: { url: string };
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Agency data interface
interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo: { url: string };
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Trip data interface
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

// Company status interface
interface CompanyStatus {
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Main agency hook that handles all agency-related data
export const useAgency = (agencyId: string | null) => {
  // Fetch company data
  const companyQuery = useQuery<CompanyData | null>({
    queryKey: ["companyData", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      const docRef = doc(db, "agencies", agencyId);
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
    enabled: !!agencyId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch agency data
  const agencyQuery = useQuery<Agency | null>({
    queryKey: ["agency", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      const docRef = doc(db, "agencies", agencyId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists()
        ? ({ id: docSnap.id, ...docSnap.data() } as Agency)
        : null;
    },
    enabled: !!agencyId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch agency status
  const statusQuery = useQuery<CompanyStatus | null>({
    queryKey: ["companyStatus", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      const companyRef = doc(db, "agencies", agencyId);
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
    enabled: !!agencyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch agency trips
  const tripsQuery = useQuery<Trip[]>({
    queryKey: ["trips", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const tripsRef = collection(db, `agencies/${agencyId}/trips`);
      const snapshot = await getDocs(tripsRef);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Trip
      );
    },
    enabled: !!agencyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    company: companyQuery.data,
    agency: agencyQuery.data,
    status: statusQuery.data,
    trips: tripsQuery.data,
    isLoading:
      companyQuery.isLoading ||
      agencyQuery.isLoading ||
      statusQuery.isLoading ||
      tripsQuery.isLoading,
    error:
      companyQuery.error ||
      agencyQuery.error ||
      statusQuery.error ||
      tripsQuery.error,
  };
};

// Separate hook for trips with more specific querying options
export const useTrips = (
  companyId: string | null,
  filters?: { status?: string }
) => {
  return useQuery<Trip[], Error>({
    queryKey: ["trips", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];

      try {
        // Use the correct path structure that matches the creation path
        const tripsRef = collection(db, `agencies/${companyId}/trips`);
        const tripsQuery = filters?.status
          ? query(tripsRef, where("status", "==", filters.status))
          : tripsRef;

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
      } catch (error) {
        console.error("Error fetching trips:", error);
        throw new Error("Failed to fetch trips");
      }
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 15 * 60 * 1000, // Keep data in cache for 15 minutes
  });
};
