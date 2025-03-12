import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { FiArrowLeft } from "react-icons/fi";
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
  departureCity: string;
  destinationCity: string;
}

export const SeatManagement = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;

      try {
        const tripDoc = await getDoc(doc(db, "trips", tripId));
        if (tripDoc.exists()) {
          setTrip({ id: tripDoc.id, ...tripDoc.data() } as Trip);
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

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
                Manage seats for trip {tripId}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md text-default-500">Trip Details</p>
                  <p className="text-small text-default-400">{trip.route}</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-default-500">Date & Time</span>
                    <span className="text-foreground">{trip.dateTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Car Type</span>
                    <span className="text-foreground">{trip.carType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Price</span>
                    <span className="text-foreground">${trip.price}</span>
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

            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md text-default-500">Seat Overview</p>
                  <p className="text-small text-default-400">
                    Current booking status
                  </p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-default-500">Total Seats</span>
                    <span className="text-foreground">
                      {trip.seatsAvailable + trip.seatsBooked}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Booked Seats</span>
                    <span className="text-foreground">{trip.seatsBooked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Available Seats</span>
                    <span className="text-foreground">
                      {trip.seatsAvailable}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">
                Seat Bookings
              </h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="Seat bookings">
                <TableHeader>
                  <TableColumn>SEAT NO.</TableColumn>
                  <TableColumn>PASSENGER</TableColumn>
                  <TableColumn>BOOKING ID</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Coming soon...</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
