import { useState } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { FiPlus, FiFilter } from "react-icons/fi";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useAgency";
import { DashboardTopBar } from "@/components/Dashboard/DashboardTopBar";
import { useQueryClient } from "@tanstack/react-query";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";
import { CreateTripModal } from "@/components/Trips/CreateTripModal";
import { TripsTable, type Trip } from "@/components/Trips/TripsTable";

type SortOption = "newest" | "oldest";

export default function TripsPage() {
  const navigate = useNavigate();
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const userId = auth.currentUser?.uid || null;
  const { data: trips = [], isLoading } = useTrips(userId);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const queryClient = useQueryClient();
  const [latestAddedTripId, setLatestAddedTripId] = useState<string | null>(
    null
  );

  const cities = ["Nouakchott", "Atar", "Rosso", "Nouadhibou", "Zouérat"];

  const handleEditTrip = (tripId: string) => {
    console.log("Edit trip:", tripId);
  };

  const handleViewSeats = (tripId: string) => {
    if (!userId) return;
    navigate(`/dashboard/trips/seats/${tripId}`);
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!userId) return;

    try {
      const seatsRef = collection(
        db,
        `agencies/${userId}/trips/${tripId}/seats`
      );
      const seatsSnapshot = await getDocs(seatsRef);
      const batch = writeBatch(db);

      seatsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const tripRef = doc(db, `agencies/${userId}/trips`, tripId);
      batch.delete(tripRef);

      await batch.commit();
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const generateTripId = async (companyId: string) => {
    const companyChars = companyId
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .split("")
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .join("");

    const tripsRef = collection(db, `agencies/${companyId}/trips`);
    const tripsSnapshot = await getDocs(tripsRef);
    const tripCount = (tripsSnapshot.size + 1).toString().padStart(4, "0");
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `TR${companyChars}${tripCount}${year}-${random}`;
  };

  const handleCreateTrip = async (formData: any) => {
    if (!userId) {
      console.error("No company ID found");
      return;
    }

    const tripId = await generateTripId(userId);
    const departureTimestamp = Timestamp.fromDate(
      new Date(`${formData.date}T${formData.time}`)
    );
    const arrivalTimestamp = Timestamp.fromDate(
      new Date(`${formData.arrivalDate}T${formData.arrivalTime}`)
    );

    const tripRef = doc(collection(db, `agencies/${userId}/trips`), tripId);
    const tripData = {
      departureCity: formData.departureCity,
      destinationCity: formData.destinationCity,
      departureTime: departureTimestamp,
      arrivalTime: arrivalTimestamp,
      carType: formData.carType,
      pricePerSeat: formData.price,
      createdAt: Timestamp.now(),
    };

    await setDoc(tripRef, tripData);

    const seats = generateSeats(formData.carType);
    const seatsCollectionRef = collection(
      db,
      `agencies/${userId}/trips/${tripId}/seats`
    );

    const batch = writeBatch(db);
    Object.entries(seats).forEach(([seatId, seatData]) => {
      const seatRef = doc(seatsCollectionRef, seatId);
      batch.set(seatRef, seatData);
    });
    await batch.commit();

    await queryClient.invalidateQueries({ queryKey: ["trips", userId] });
    setLatestAddedTripId(tripId);
    setTimeout(() => setLatestAddedTripId(null), 1000);
  };

  const getSortedTrips = () => {
    if (!trips) return [];

    return [...trips].sort((a, b) => {
      const aSeconds = a.createdAt?.seconds ?? 0;
      const bSeconds = b.createdAt?.seconds ?? 0;

      switch (sortBy) {
        case "newest":
          return bSeconds - aSeconds;
        case "oldest":
          return aSeconds - bSeconds;
        default:
          return 0;
      }
    });
  };

  const generateSeats = (carType: "medium" | "large") => {
    const seatCount = carType === "medium" ? 15 : 60;
    const seats: {
      [key: string]: {
        id: number;
        status: "available" | "booked" | "disabled";
      };
    } = {};

    for (let i = 1; i <= seatCount; i++) {
      seats[i] = {
        id: i,
        status: "available",
      };
    }

    return seats;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <DashboardTopBar
        searchPlaceholder="Search trips by ID or destination..."
        rightContent={
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                startContent={<FiFilter className="text-default-500" />}
              >
                Sort by
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Sort options"
              onAction={(key) => setSortBy(key as SortOption)}
              selectedKeys={new Set([sortBy])}
              selectionMode="single"
            >
              <DropdownItem key="newest">Newest First</DropdownItem>
              <DropdownItem key="oldest">Oldest First</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        }
      />
      <div className="flex-1 overflow-hidden">
        <CustomScrollbar className="h-full">
          <div className="bg-content1 rounded-lg shadow">
            <div className="p-6 border-b border-divider flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Trips Management
                </h1>
                <p className="text-default-500 text-sm mt-1">
                  Manage and monitor your trips
                </p>
              </div>
              <Button
                color="primary"
                startContent={<FiPlus />}
                onPress={() => setIsAddTripModalOpen(true)}
              >
                Add New Trip
              </Button>
            </div>

            <div className="p-6">
              <TripsTable
                trips={getSortedTrips() as Trip[]}
                isLoading={isLoading}
                latestAddedTripId={latestAddedTripId}
                onEditTrip={handleEditTrip}
                onViewSeats={handleViewSeats}
                onDeleteTrip={handleDeleteTrip}
              />
            </div>
          </div>
        </CustomScrollbar>
      </div>

      <CreateTripModal
        isOpen={isAddTripModalOpen}
        onClose={() => setIsAddTripModalOpen(false)}
        onSubmit={handleCreateTrip}
        cities={cities}
      />
    </div>
  );
}
