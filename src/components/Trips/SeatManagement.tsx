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
          const totalSeats = tripData.carType === "Medium" ? 15 : 60;
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

    const totalSeats = trip.carType === "Medium" ? 15 : 60;
    const seatsPerRow = trip.carType === "Medium" ? 4 : 4;

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

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))`,
          }}
        >
          {/* Driver seat icon */}
          <div className="col-span-full flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center">
              <FiArrowLeft className="rotate-[135deg]" />
            </div>
          </div>

          {Array.from({ length: totalSeats }, (_, i) => {
            const seatNumber = i + 1;
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
                      handleSeatStatusChange(seatNumber, key as SeatStatus)
                    }
                  >
                    <DropdownItem key="Available" className="text-success">
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
      </div>
    );
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
