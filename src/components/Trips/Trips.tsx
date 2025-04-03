import React, { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { FiPlus, FiCalendar, FiClock, FiFilter } from "react-icons/fi";
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { useNavigate } from "react-router-dom";
import { useCompanyData, useTrips } from "@/hooks/useQueries";
import { DashboardTopBar } from "@/components/Dashboard/DashboardTopBar";
import { useQueryClient } from "@tanstack/react-query";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";

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

interface CompanyData {
  id: string;
  name: string;
  email: string;
  logo: {
    url: string;
  };
}

interface FilterState {
  search: string;
  date: string;
  destination: string;
  carType: string;
}

interface NewTripForm {
  departureCity: string;
  destinationCity: string;
  date: string;
  time: string;
  arrivalDate: string;
  arrivalTime: string;
  carType: "medium" | "large";
  price: number;
}

type SortOption = "newest" | "oldest";

// Add a custom style for the avatar
const avatarStyles = {
  "--avatar-img-object-fit": "contain",
  backgroundColor: "white", // Add a white background to make the logo more visible
} as React.CSSProperties;

export const Trips = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    date: "",
    destination: "",
    carType: "",
  });

  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newTripForm, setNewTripForm] = useState<NewTripForm>({
    departureCity: "",
    destinationCity: "",
    date: "",
    time: "",
    arrivalDate: "",
    arrivalTime: "",
    carType: "medium",
    price: 0,
  });

  const userId = auth.currentUser?.uid || null;
  const { data: companyData } = useCompanyData(userId);
  const { data: trips = [], isLoading } = useTrips(userId);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAddedTripId, setLatestAddedTripId] = useState<string | null>(
    null
  );

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditTrip = (tripId: string) => {
    console.log("Edit trip:", tripId);
  };

  const handleViewSeats = (tripId: string) => {
    if (!userId) return;
    navigate(`/trips/seats/${tripId}`);
  };

  const handleDeactivateTrip = async (tripId: string) => {
    try {
      const tripRef = doc(db, "trips", tripId);
      const tripDoc = await getDoc(tripRef);

      if (tripDoc.exists()) {
        const currentStatus = tripDoc.data().status;
        await updateDoc(tripRef, {
          status: currentStatus === "Active" ? "Inactive" : "Active",
        });
      }
    } catch (error) {
      console.error("Error updating trip status:", error);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!userId) return;

    try {
      // Delete all seats in the seats subcollection
      const seatsRef = collection(
        db,
        `transportation_companies/${userId}/trips/${tripId}/seats`
      );
      const seatsSnapshot = await getDocs(seatsRef);
      const batch = writeBatch(db);

      seatsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete the trip document
      const tripRef = doc(
        db,
        `transportation_companies/${userId}/trips`,
        tripId
      );
      batch.delete(tripRef);

      await batch.commit();
      await deleteDoc(doc(db, "trips", tripId));
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const generateTripId = async (companyId: string) => {
    // Get 2 random capitalized characters from company ID
    const companyChars = companyId
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .split("")
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .join("");

    // Get count of existing trips for this company
    const tripsQuery = query(
      collection(db, "trips"),
      where("companyId", "==", companyId)
    );
    const tripsSnapshot = await getDocs(tripsQuery);
    const tripCount = (tripsSnapshot.size + 1).toString().padStart(4, "0");

    // Get year
    const year = new Date().getFullYear().toString().slice(-2);

    // Generate random string
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `TR${companyChars}${tripCount}${year}-${random}`;
  };

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleNewTripSubmit = async () => {
    if (currentStep < 3) {
      handleNextStep();
      return;
    }

    if (!userId) {
      console.error("No company ID found");
      return;
    }

    setIsSubmitting(true);
    try {
      const tripId = await generateTripId(userId);

      // Create departure and arrival timestamps
      const departureTimestamp = Timestamp.fromDate(
        new Date(`${newTripForm.date}T${newTripForm.time}`)
      );
      const arrivalTimestamp = Timestamp.fromDate(
        new Date(`${newTripForm.arrivalDate}T${newTripForm.arrivalTime}`)
      );

      // Reference to the company's trips subcollection
      const tripRef = doc(
        collection(db, `transportation_companies/${userId}/trips`),
        tripId
      );

      // Create new trip in Firestore
      const tripData = {
        departureCity: newTripForm.departureCity,
        destinationCity: newTripForm.destinationCity,
        departureTime: departureTimestamp,
        arrivalTime: arrivalTimestamp,
        carType: newTripForm.carType,
        pricePerSeat: newTripForm.price,
        createdAt: Timestamp.now(),
      };

      // Add trip document
      await setDoc(tripRef, tripData);

      // Generate and add seats to the seats subcollection
      const seats = generateSeats(newTripForm.carType);
      const seatsCollectionRef = collection(tripRef, "seats");

      // Add all seats in a batch
      const batch = writeBatch(db);
      Object.entries(seats).forEach(([seatId, seatData]) => {
        const seatRef = doc(seatsCollectionRef, seatId);
        batch.set(seatRef, seatData);
      });
      await batch.commit();

      // Invalidate and refetch trips query
      await queryClient.invalidateQueries({ queryKey: ["trips", userId] });

      // Set the latest added trip ID for highlighting
      setLatestAddedTripId(tripId);
      // Remove the highlight after 3 seconds
      setTimeout(() => setLatestAddedTripId(null), 1000);

      // Reset form and close modal
      setIsAddTripModalOpen(false);
      setCurrentStep(1);
      setNewTripForm({
        departureCity: "",
        destinationCity: "",
        date: "",
        time: "",
        arrivalDate: "",
        arrivalTime: "",
        carType: "medium",
        price: 0,
      });
    } catch (error) {
      console.error("Error adding trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cities = ["Nouakchott", "Atar", "Rosso", "Nouadhibou", "Zouérat"];

  const formatTimestamp = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp || typeof timestamp.seconds === "undefined") {
      return "N/A";
    }
    return new Date(timestamp.seconds * 1000).toLocaleString();
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
        <CustomScrollbar className="h-full p-6">
          <div className="bg-content1 rounded-lg shadow">
            {/* Header */}
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

            {/* Filters */}
            {/* <div className="p-6 border-b border-divider">
              <div className="flex gap-4">
                <Input
                  type="date"
                  label="Date"
                  placeholder="Select date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                  startContent={<FiCalendar className="text-default-400" />}
                />
                <Input
                  type="text"
                  label="Destination"
                  placeholder="Enter destination"
                  value={filters.destination}
                  onChange={(e) =>
                    handleFilterChange("destination", e.target.value)
                  }
                />
                <Select
                  label="Car Type"
                  placeholder="Select car type"
                  value={filters.carType}
                  onChange={(e) =>
                    handleFilterChange("carType", e.target.value)
                  }
                >
                  <SelectItem key="medium">Medium</SelectItem>
                  <SelectItem key="large">Large</SelectItem>
                </Select>
              </div>
            </div> */}

            {/* Trips Table */}
            <div className="p-6">
              <Table aria-label="Trips table">
                <TableHeader>
                  <TableColumn>TRIP ID</TableColumn>
                  <TableColumn>ROUTE</TableColumn>
                  <TableColumn>DEPARTURE</TableColumn>
                  <TableColumn>ARRIVAL</TableColumn>
                  <TableColumn>CAR TYPE</TableColumn>
                  <TableColumn>PRICE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell>
                        <div className="h-6 bg-default-200 rounded animate-pulse mb-3" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-default-200 rounded animate-pulse mb-1" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-default-200 rounded animate-pulse mb-1" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-default-200 rounded animate-pulse mb-1" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-default-200 rounded animate-pulse mb-1" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-default-200 rounded animate-pulse mb-1" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-default-200 rounded animate-pulse mb-1" />
                      </TableCell>
                    </TableRow>
                  ) : getSortedTrips().length === 0 ? (
                    <TableRow>
                      <TableCell>No trips found</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ) : (
                    getSortedTrips().map((trip) => (
                      <TableRow
                        key={trip.id}
                        className={`transition-colors duration-300 ${
                          trip.id === latestAddedTripId
                            ? "bg-success/10 animate-highlight"
                            : ""
                        }`}
                      >
                        <TableCell>{trip.id}</TableCell>
                        <TableCell>
                          {trip.departureCity} → {trip.destinationCity}
                        </TableCell>
                        <TableCell>
                          {formatTimestamp(trip.departureTime)}
                        </TableCell>
                        <TableCell>
                          {formatTimestamp(trip.arrivalTime)}
                        </TableCell>
                        <TableCell>
                          {trip.carType === "medium" ? "Medium" : "Large"}
                        </TableCell>
                        <TableCell>${trip.pricePerSeat}</TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly variant="ghost">
                                ⋮
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Trip actions">
                              <DropdownItem
                                key="edit"
                                onPress={() => handleEditTrip(trip.id)}
                              >
                                Edit Trip
                              </DropdownItem>
                              <DropdownItem
                                key="view"
                                onPress={() => handleViewSeats(trip.id)}
                              >
                                View Seats
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                onPress={() => handleDeleteTrip(trip.id)}
                              >
                                Delete Trip
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CustomScrollbar>
      </div>

      {/* Add New Trip Modal */}
      <Modal
        isOpen={isAddTripModalOpen}
        onClose={() => {
          setIsAddTripModalOpen(false);
          setCurrentStep(1);
          setIsSubmitting(false);
        }}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold text-foreground">
              Add New Trip - Step {currentStep} of 3
            </h3>
          </ModalHeader>
          <ModalBody>
            {currentStep === 1 && (
              <div className="space-y-4">
                <Select
                  label="Departure City"
                  placeholder="Select departure city"
                  value={newTripForm.departureCity}
                  onChange={(e) =>
                    setNewTripForm({
                      ...newTripForm,
                      departureCity: e.target.value,
                    })
                  }
                >
                  {cities.map((city) => (
                    <SelectItem key={city}>{city}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Destination City"
                  placeholder="Select destination city"
                  value={newTripForm.destinationCity}
                  onChange={(e) =>
                    setNewTripForm({
                      ...newTripForm,
                      destinationCity: e.target.value,
                    })
                  }
                >
                  {cities.map((city) => (
                    <SelectItem key={city}>{city}</SelectItem>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Departure Time</h4>
                    <Input
                      type="date"
                      label="Date"
                      value={newTripForm.date}
                      onChange={(e) =>
                        setNewTripForm({ ...newTripForm, date: e.target.value })
                      }
                      startContent={<FiCalendar className="text-gray-400" />}
                    />
                    <Input
                      type="time"
                      label="Time"
                      value={newTripForm.time}
                      onChange={(e) =>
                        setNewTripForm({ ...newTripForm, time: e.target.value })
                      }
                      startContent={<FiClock className="text-gray-400" />}
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Arrival Time</h4>
                    <Input
                      type="date"
                      label="Date"
                      value={newTripForm.arrivalDate}
                      onChange={(e) =>
                        setNewTripForm({
                          ...newTripForm,
                          arrivalDate: e.target.value,
                        })
                      }
                      startContent={<FiCalendar className="text-gray-400" />}
                    />
                    <Input
                      type="time"
                      label="Time"
                      value={newTripForm.arrivalTime}
                      onChange={(e) =>
                        setNewTripForm({
                          ...newTripForm,
                          arrivalTime: e.target.value,
                        })
                      }
                      startContent={<FiClock className="text-gray-400" />}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Select
                      label="Car Type"
                      value={newTripForm.carType}
                      onChange={(e) =>
                        setNewTripForm({
                          ...newTripForm,
                          carType: e.target.value as "medium" | "large",
                        })
                      }
                    >
                      <SelectItem key="medium">Medium (15 seats)</SelectItem>
                      <SelectItem key="large">Large (60 seats)</SelectItem>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Price per Seat ($)"
                  value={newTripForm.price.toString()}
                  onChange={(e) =>
                    setNewTripForm({
                      ...newTripForm,
                      price: Number(e.target.value),
                    })
                  }
                />
                <div className="bg-background/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Trip Summary</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      Route: {newTripForm.departureCity} →{" "}
                      {newTripForm.destinationCity}
                    </p>
                    <p>
                      Departure: {newTripForm.date} {newTripForm.time}
                    </p>
                    <p>
                      Arrival: {newTripForm.arrivalDate}{" "}
                      {newTripForm.arrivalTime}
                    </p>
                    <p>
                      Car Type:{" "}
                      {newTripForm.carType === "medium"
                        ? "Medium (15 seats)"
                        : "Large (60 seats)"}
                    </p>
                    <p>Price per Seat: ${newTripForm.price}</p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsAddTripModalOpen(false);
                setCurrentStep(1);
                setIsSubmitting(false);
              }}
            >
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button
                variant="flat"
                onPress={handlePreviousStep}
                isDisabled={isSubmitting}
              >
                Previous
              </Button>
            )}
            <Button
              color="primary"
              onPress={handleNewTripSubmit}
              isLoading={isSubmitting}
            >
              {currentStep < 3 ? "Next" : "Create Trip"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
