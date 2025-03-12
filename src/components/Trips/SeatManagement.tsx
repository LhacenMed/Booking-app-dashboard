import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from "@heroui/react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

type SeatStatus = "Available" | "Booked" | "Paid";

interface Seat {
  id: number;
  status: SeatStatus;
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
  departureCity: string;
  destinationCity: string;
  seats: Record<string, Seat>;
}

const statusColors = {
  Available: "success",
  Booked: "warning",
  Paid: "primary",
} as const;

export const SeatManagement = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const tripRef = doc(db, "trips", tripId);

    // Set up real-time listener for trip updates
    const unsubscribe = onSnapshot(tripRef, (doc) => {
      if (doc.exists()) {
        const tripData = doc.data();
        // Initialize seats if they don't exist
        if (!tripData.seats) {
          const totalSeats = tripData.carType === "Medium" ? 14 : 60;
          const initialSeats: Record<string, Seat> = {};

          for (let i = 1; i <= totalSeats; i++) {
            initialSeats[i] = {
              id: i,
              status: "Available",
            };
          }

          // Update Firestore with initial seats
          updateDoc(tripRef, { seats: initialSeats }).then(() => {
            setTrip({ ...tripData, id: doc.id, seats: initialSeats } as Trip);
          });
        } else {
          setTrip({ ...tripData, id: doc.id } as Trip);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  const handleSeatStatusChange = async (
    seatId: number,
    newStatus: SeatStatus
  ) => {
    if (!trip || !tripId) return;

    const tripRef = doc(db, "trips", tripId);
    const updatedSeats = { ...trip.seats };
    updatedSeats[seatId] = {
      ...updatedSeats[seatId],
      status: newStatus,
    };

    try {
      await updateDoc(tripRef, {
        seats: updatedSeats,
        seatsAvailable: Object.values(updatedSeats).filter(
          (seat) => seat.status === "Available"
        ).length,
        seatsBooked: Object.values(updatedSeats).filter(
          (seat) => seat.status === "Booked" || seat.status === "Paid"
        ).length,
      });
    } catch (error) {
      console.error("Error updating seat status:", error);
    }
  };

  const renderSeatGrid = () => {
    if (!trip) return null;

    if (trip.carType === "Medium") {
      // Specific layout for 14-seater
      const seatLayout = [
        [null, null, null, 1], // First row: 1 seat
        [2, 3, 4, null], // Second row: 3 seats
        [5, 6, null, 7], // Third row: 3 seats
        [8, 9, null, 10], // Fourth row: 3 seats
        [11, 12, 13, 14], // Fifth row: 4 seats
      ];

      return (
        <div className="grid gap-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-default-100 p-2 rounded-lg flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/20 border border-success"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning/20 border border-warning"></div>
                <span className="text-sm">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20 border border-primary"></div>
                <span className="text-sm">Paid</span>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-[600px] mx-auto bg-default-50 rounded-xl p-8">
            {/* Driver seat */}
            <div className="absolute top-4 left-4">
              <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center">
                <FiArrowLeft className="rotate-[135deg]" />
              </div>
            </div>

            <div className="grid gap-y-6">
              {seatLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-4 gap-4">
                  {row.map((seatNumber, colIndex) => {
                    if (seatNumber === null) {
                      return <div key={`empty-${rowIndex}-${colIndex}`} />;
                    }

                    const seat = trip.seats[seatNumber] || {
                      id: seatNumber,
                      status: "Available",
                    };

                    return (
                      <Tooltip
                        key={seatNumber}
                        content={`Seat ${seatNumber} - ${seat.status}`}
                      >
                        <Dropdown>
                          <DropdownTrigger>
                            <button
                              className={`w-full aspect-square rounded-lg border transition-colors flex items-center justify-center text-sm
                                ${
                                  seat.status === "Available"
                                    ? "bg-success/20 border-success hover:bg-success/30"
                                    : seat.status === "Booked"
                                      ? "bg-warning/20 border-warning hover:bg-warning/30"
                                      : "bg-primary/20 border-primary hover:bg-primary/30"
                                }`}
                            >
                              {seatNumber}
                            </button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Seat status options"
                            onAction={(key) =>
                              handleSeatStatusChange(
                                seatNumber,
                                key as SeatStatus
                              )
                            }
                          >
                            <DropdownItem
                              key="Available"
                              className="text-success"
                            >
                              Available
                            </DropdownItem>
                            <DropdownItem key="Booked" className="text-warning">
                              Booked
                            </DropdownItem>
                            <DropdownItem key="Paid" className="text-primary">
                              Paid
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      // Layout for 60-seater
      const seatLayout = [
        [null, null, null, null, null], // The front: 0 seats
        [1, 2, null, null, 3], // First row: 4 seats
        [4, 5, 6, null, 7], // Second row: 4 seats
        [8, 9, 10, null, 11], // Third row: 4 seats
        [12, 13, 14, null, 15], // Fourth row: 4 seats
        [16, 17, 18, null, 19], // Fifth row: 4 seats
        [20, 21, 22, null, 23], // Sixth row: 4 seats
        [24, 25, 26, null, 27], // Seventh row: 4 seats
        [28, 29, 30, null, 31], // Eight row: 4 seats
        [32, 33, 34, null, 35], // Ninth row: 4 seats
        [36, 37, 38, null, 39], // Tenth row: 4 seats
        [40, 41, 42, null, 43], // Eleventh row: 4 seats
        [44, 45, 46, null, 47], // Twelfth row: 4 seats
        [48, 49, 50, null, 51], // Thirteenth row: 4 seats
        [52, 53, 54, null, 55], // Fourteenth row: 4 seats
        [56, 57, 58, 59, 60], // Fifteenth row: 4 seats
      ];

      return (
        <div className="grid gap-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-default-100 p-2 rounded-lg flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/20 border border-success"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning/20 border border-warning"></div>
                <span className="text-sm">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20 border border-primary"></div>
                <span className="text-sm">Paid</span>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-[800px] mx-auto bg-default-50 rounded-xl p-8">
            {/* Driver seat */}
            <div className="absolute top-4 left-4">
              <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center">
                <FiArrowLeft className="rotate-[135deg]" />
              </div>
            </div>

            <div className="grid gap-y-4 mt-8">
              {seatLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-4">
                  {row.map((seatNumber, colIndex) => {
                    if (seatNumber === null) {
                      return <div key={`empty-${rowIndex}-${colIndex}`} />;
                    }

                    const seat = trip.seats[seatNumber] || {
                      id: seatNumber,
                      status: "Available",
                    };

                    return (
                      <Tooltip
                        key={seatNumber}
                        content={`Seat ${seatNumber} - ${seat.status}`}
                      >
                        <Dropdown>
                          <DropdownTrigger>
                            <button
                              className={`w-full aspect-square rounded-lg border transition-colors flex items-center justify-center text-sm
                                ${
                                  seat.status === "Available"
                                    ? "bg-success/20 border-success hover:bg-success/30"
                                    : seat.status === "Booked"
                                      ? "bg-warning/20 border-warning hover:bg-warning/30"
                                      : "bg-primary/20 border-primary hover:bg-primary/30"
                                }`}
                            >
                              {seatNumber}
                            </button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Seat status options"
                            onAction={(key) =>
                              handleSeatStatusChange(
                                seatNumber,
                                key as SeatStatus
                              )
                            }
                          >
                            <DropdownItem
                              key="Available"
                              className="text-success"
                            >
                              Available
                            </DropdownItem>
                            <DropdownItem key="Booked" className="text-warning">
                              Booked
                            </DropdownItem>
                            <DropdownItem key="Paid" className="text-primary">
                              Paid
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!trip) {
    return <div className="p-6">Trip not found</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1">
        <div className="bg-content1 border-b border-divider px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => navigate("/trips")}
            >
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Seat Management
              </h1>
              <p className="text-small text-default-500">
                {trip.route} - {trip.dateTime}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md">Trip Details</p>
                  <p className="text-small text-default-500">{trip.route}</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-default-500">Date & Time</span>
                    <span>{trip.dateTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Car Type</span>
                    <span>{trip.carType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Price</span>
                    <span>${trip.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Status</span>
                    <Chip
                      color={trip.status === "Active" ? "success" : "danger"}
                      variant="flat"
                    >
                      {trip.status}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <h3 className="text-lg font-semibold">Seat Layout</h3>
              </CardHeader>
              <CardBody>{renderSeatGrid()}</CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
