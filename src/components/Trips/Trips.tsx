import React, { useState, useEffect } from "react";
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
  Badge,
  Avatar,
  Tooltip,
  Switch,
} from "@heroui/react";
import { FiSearch, FiBell, FiPlus, FiCalendar, FiClock } from "react-icons/fi";
import { MoonFilledIcon, SunFilledIcon } from "@/components/icons";
import { useTheme } from "@heroui/use-theme";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../../FirebaseConfig";
import { useNavigate } from "react-router-dom";

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

  const [trips, setTrips] = useState<Trip[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Check authentication and get company ID
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      setCompanyId(user.uid);

      // Get company's trips
      const tripsQuery = query(
        collection(db, "trips"),
        where("companyId", "==", user.uid)
      );

      const unsubscribeTrips = onSnapshot(tripsQuery, (snapshot) => {
        const tripsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Trip[];
        setTrips(tripsData);
        setIsLoading(false);
      });

      return () => unsubscribeTrips();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditTrip = (tripId: string) => {
    console.log("Edit trip:", tripId);
  };

  const handleViewSeats = (tripId: string) => {
    console.log("View seats:", tripId);
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

  const handleNewTripSubmit = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (!companyId) {
      console.error("No company ID found");
      return;
    }

    try {
      // Create new trip in Firestore
      const tripData = {
        companyId,
        route: `${newTripForm.departureCity} → ${newTripForm.destinationCity}`,
        dateTime: `${newTripForm.date} ${newTripForm.time}`,
        carType: newTripForm.carType,
        seatsAvailable: newTripForm.carType === "Medium" ? 20 : 30,
        seatsBooked: 0,
        status: "Active",
        price: newTripForm.price,
        departureCity: newTripForm.departureCity,
        destinationCity: newTripForm.destinationCity,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "trips"), tripData);

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
      // Here you might want to show an error message to the user
    }
  };

  const cities = ["Nouakchott", "Atar", "Rosso", "Nouadhibou", "Zouérat"];

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1">
        {/* Top Bar */}
        <div className="bg-content1 border-b border-divider px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                <Input
                  type="text"
                  className="pl-10"
                  placeholder="Search trips by ID or destination..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Tooltip content="Notifications">
                <Button isIconOnly variant="light" className="relative">
                  <FiBell className="h-5 w-5" />
                  <div className="absolute top-1 right-1">
                    <Badge color="danger">5</Badge>
                  </div>
                </Button>
              </Tooltip>
              {!isLoading && (
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    {companyId ? (
                      <Avatar
                        isBordered
                        as="button"
                        className="transition-transform bg-white"
                        color="warning"
                        name={companyId}
                        size="sm"
                        src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
                        imgProps={{
                          className: "object-contain",
                        }}
                      />
                    ) : (
                      <Avatar
                        isDisabled
                        isBordered
                        as="button"
                        className="transition-transform"
                        color="primary"
                        name=""
                        size="sm"
                        src=""
                      />
                    )}
                  </DropdownTrigger>
                  {companyId ? (
                    <DropdownMenu aria-label="Profile Actions" variant="flat">
                      <DropdownItem key="profile" className="h-14 gap-2">
                        <p className="font-semibold">Signed in as</p>
                        <p className="font-semibold text-primary">
                          {companyId}
                        </p>
                      </DropdownItem>
                      <DropdownItem key="theme" className="h-14 gap-2">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex gap-2 items-center">
                            {theme === "light" ? (
                              <SunFilledIcon size={20} />
                            ) : (
                              <MoonFilledIcon size={20} />
                            )}
                            <span>Dark mode</span>
                          </div>
                          <Switch
                            defaultSelected={theme === "dark"}
                            size="sm"
                            onChange={() =>
                              setTheme(theme === "light" ? "dark" : "light")
                            }
                          />
                        </div>
                      </DropdownItem>
                      <DropdownItem key="company_profile">
                        Company Profile
                      </DropdownItem>
                      <DropdownItem key="settings">Settings</DropdownItem>
                      <DropdownItem key="help">Help & Support</DropdownItem>
                      <DropdownItem
                        key="logout"
                        color="danger"
                        onPress={() => {
                          // Implement logout functionality
                        }}
                      >
                        Log Out
                      </DropdownItem>
                    </DropdownMenu>
                  ) : (
                    <DropdownMenu aria-label="Profile Actions" variant="flat">
                      <DropdownItem
                        key="login"
                        className="h-10"
                        onPress={() => navigate("/login")}
                      >
                        <p className="font-semibold">Login</p>
                      </DropdownItem>
                    </DropdownMenu>
                  )}
                </Dropdown>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
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
                  ) : trips.length === 0 ? (
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
                    trips.map((trip) => (
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
                <div className="bg-gray-50 p-4 rounded-lg">
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
