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
  route: string;
  dateTime: string;
  carType: "Medium" | "Large";
  seatsAvailable: number;
  seatsBooked: number;
  status: "Active" | "Inactive";
  price: number;
  companyId: string;
  departureCity: string;
  destinationCity: string;
  createdAt: Date;
}

interface AdminData {
  id: string;
  name: string;
  email: string;
  logo: {
    url: string;
  };
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
        collection(db, "trips"),
        where("companyId", "==", companyId)
      );
      const snapshot = await getDocs(tripsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Trip[];
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 15 * 60 * 1000, // Keep data in cache for 15 minutes
  });
};

export const useAdminData = (firebaseUid: string | null) => {
  return useQuery<AdminData | null, Error>({
    queryKey: ["admin", firebaseUid],
    queryFn: async () => {
      if (!firebaseUid) return null;

      // Query admins collection to find the admin document with matching Firebase UID
      const adminsQuery = query(
        collection(db, "admins"),
        where("firebaseUid", "==", firebaseUid)
      );
      const querySnapshot = await getDocs(adminsQuery);

      if (querySnapshot.empty) return null;

      // Get the first matching admin document
      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();

      return {
        id: adminDoc.id, // This is the custom admin_XXXX ID
        name: adminData.name,
        email: adminData.email,
        logo: adminData.logo,
      };
    },
    enabled: !!firebaseUid,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });
};
