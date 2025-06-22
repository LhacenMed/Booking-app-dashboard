import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Timestamp } from "firebase/firestore";

export interface Trip {
  id: string;
  departureCity: string;
  destinationCity: string;
  departureTime: Timestamp | null;
  arrivalTime: Timestamp | null;
  carType: "medium" | "large";
  pricePerSeat: number;
  createdAt: Timestamp | null;
}

interface TripsTableProps {
  trips: Trip[];
  isLoading: boolean;
  latestAddedTripId: string | null;
  onEditTrip: (tripId: string) => void;
  onViewSeats: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

export function TripsTable({
  trips,
  isLoading,
  latestAddedTripId,
  onEditTrip,
  onViewSeats,
  onDeleteTrip,
}: TripsTableProps) {
  const formatTimestamp = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp || typeof timestamp.seconds === "undefined") {
      return "N/A";
    }
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  if (isLoading) {
    return <LoadingTableRow />;
  }

  if (trips.length === 0) {
    return <EmptyTableRow />;
  }

  return (
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
        {trips.map((trip) => (
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
            <TableCell>{formatTimestamp(trip.departureTime)}</TableCell>
            <TableCell>{formatTimestamp(trip.arrivalTime)}</TableCell>
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
                  <DropdownItem key="edit" onPress={() => onEditTrip(trip.id)}>
                    Edit Trip
                  </DropdownItem>
                  <DropdownItem key="view" onPress={() => onViewSeats(trip.id)}>
                    View Seats
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    onPress={() => onDeleteTrip(trip.id)}
                  >
                    Delete Trip
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LoadingTableRow() {
  return (
    <Table aria-label="Loading trips">
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
      </TableBody>
    </Table>
  );
}

function EmptyTableRow() {
  return (
    <Table aria-label="Empty trips">
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
        <TableRow>
          <TableCell>No trips found</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
