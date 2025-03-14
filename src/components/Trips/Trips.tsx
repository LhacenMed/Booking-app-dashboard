import React, { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
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
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../FirebaseConfig";
import { useNavigate } from "react-router-dom";
import { useCompanyData, useTrips } from "@/hooks/useQueries";
import { DashboardTopBar } from "@/components/Dashboard/DashboardTopBar";

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
  carType: "Medium" | "Large";
  price: number;
}

type SortOption =
  | "newest"
  | "oldest"
  | "active_newest"
  | "active_oldest"
  | "inactive_newest"
  | "inactive_oldest";

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
    carType: "Medium",
    price: 0,
  });

  const userId = auth.currentUser?.uid || null;
  const { data: companyData } = useCompanyData(userId);
  const { data: trips = [], isLoading } = useTrips(userId);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditTrip = (tripId: string) => {
    console.log("Edit trip:", tripId);
  };

  const handleViewSeats = (tripId: string) => {
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
    try {
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

  const handleNewTripSubmit = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (!userId) {
      console.error("No company ID found");
      return;
    }

    try {
      const tripId = await generateTripId(userId);
      const tripRef = doc(db, "trips", tripId);

      // Create new trip in Firestore
      const tripData = {
        companyId: userId,
        route: `${newTripForm.departureCity} → ${newTripForm.destinationCity}`,
        dateTime: `${newTripForm.date} ${newTripForm.time}`,
        carType: newTripForm.carType,
        seatsAvailable: newTripForm.carType === "Medium" ? 20 : 30,
        seatsBooked: 0,
        status: "Active",
        price: newTripForm.price,
        departureCity: newTripForm.departureCity,
        destinationCity: newTripForm.destinationCity,
        createdAt: Timestamp.now(),
      };

      await setDoc(tripRef, tripData);

      // Reset form and close modal
      setIsAddTripModalOpen(false);
      setCurrentStep(1);
      setNewTripForm({
        departureCity: "",
        destinationCity: "",
        date: "",
        time: "",
        carType: "Medium",
        price: 0,
      });
    } catch (error) {
      console.error("Error adding trip:", error);
    }
  };

  const cities = ["Nouakchott", "Atar", "Rosso", "Nouadhibou", "Zouérat"];

  const getSortedTrips = () => {
    if (!trips) return [];

    return [...trips]
      .filter((trip) => {
        // Filter by status first
        if (sortBy.startsWith("active_")) return trip.status === "Active";
        if (sortBy.startsWith("inactive_")) return trip.status === "Inactive";
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "active_newest":
          case "inactive_newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "active_oldest":
          case "inactive_oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          default:
            return 0;
        }
      });
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
              disabledKeys={["active", "inactive"]}
            >
              <DropdownItem key="newest">Newest First</DropdownItem>
              <DropdownItem key="oldest">Oldest First</DropdownItem>
              <DropdownItem
                key="active"
                className="text-default-500"
                isReadOnly
              >
                Active Trips
              </DropdownItem>
              <DropdownItem key="active_newest" className="pl-[25px]">
                Newest First
              </DropdownItem>
              <DropdownItem key="active_oldest" className="pl-[25px]">
                Oldest First
              </DropdownItem>
              <DropdownItem
                key="inactive"
                className="text-default-500"
                isReadOnly
              >
                Inactive Trips
              </DropdownItem>
              <DropdownItem key="inactive_newest" className="pl-[25px]">
                Newest First
              </DropdownItem>
              <DropdownItem key="inactive_oldest" className="pl-[25px]">
                Oldest First
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        }
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
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
            <div className="p-6 border-b border-divider">
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
            </div>

            {/* Trips Table */}
            <div className="p-6">
              <Table aria-label="Trips table">
                <TableHeader>
                  <TableColumn>TRIP ID</TableColumn>
                  <TableColumn>ROUTE</TableColumn>
                  <TableColumn>DATE & TIME</TableColumn>
                  <TableColumn>CAR TYPE</TableColumn>
                  <TableColumn>SEATS</TableColumn>
                  <TableColumn>PRICE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ) : getSortedTrips().length === 0 ? (
                    <TableRow>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>No trips found</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ) : (
                    getSortedTrips().map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.id}</TableCell>
                        <TableCell>{trip.route}</TableCell>
                        <TableCell>{trip.dateTime}</TableCell>
                        <TableCell>{trip.carType}</TableCell>
                        <TableCell>
                          {trip.seatsBooked}/
                          {trip.seatsAvailable + trip.seatsBooked}
                        </TableCell>
                        <TableCell>${trip.price}</TableCell>
                        <TableCell>
                          <Chip
                            color={
                              trip.status === "Active" ? "success" : "danger"
                            }
                            variant="flat"
                          >
                            {trip.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="light">Actions</Button>
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
                                key="deactivate"
                                className="text-danger"
                                color="danger"
                                onPress={() => handleDeactivateTrip(trip.id)}
                              >
                                {trip.status === "Active"
                                  ? "Deactivate"
                                  : "Activate"}{" "}
                                Trip
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
        </div>
      </div>

      {/* Add New Trip Modal */}
      <Modal
        isOpen={isAddTripModalOpen}
        onClose={() => {
          setIsAddTripModalOpen(false);
          setCurrentStep(1);
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
                          carType: e.target.value as "Medium" | "Large",
                        })
                      }
                    >
                      <SelectItem key="medium">Medium (20 seats)</SelectItem>
                      <SelectItem key="large">Large (30 seats)</SelectItem>
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
                      Date & Time: {newTripForm.date} {newTripForm.time}
                    </p>
                    <p>Car Type: {newTripForm.carType}</p>
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
              }}
            >
              Cancel
            </Button>
            <Button color="primary" onPress={handleNewTripSubmit}>
              {currentStep < 3 ? "Next" : "Create Trip"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
