import { useState } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { FiCalendar, FiClock, FiX } from "react-icons/fi";
import { CustomScrollbar } from "../ui/CustomScrollbar";

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: TripFormData) => Promise<void>;
  cities: string[];
}

interface TripFormData {
  departureCity: string;
  destinationCity: string;
  date: string;
  time: string;
  arrivalDate: string;
  arrivalTime: string;
  carType: "medium" | "large";
  price: number;
}

export function CreateTripModal({
  isOpen,
  onClose,
  onSubmit,
  cities,
}: CreateTripModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<TripFormData>({
    departureCity: "",
    destinationCity: "",
    date: "",
    time: "",
    arrivalDate: "",
    arrivalTime: "",
    carType: "medium",
    price: 0,
  });

  const handleClose = () => {
    onClose();
    setCurrentStep(1);
    setIsSubmitting(false);
    setForm({
      departureCity: "",
      destinationCity: "",
      date: "",
      time: "",
      arrivalDate: "",
      arrivalTime: "",
      carType: "medium",
      price: 0,
    });
  };

  const handleSubmit = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form);
      handleClose();
    } catch (error) {
      console.error("Error creating trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-overlay/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-[500px] bg-background border-l border-divider shadow-xl transform transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } z-50`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-divider">
          <h3 className="text-xl font-semibold text-foreground">
            Create New Reservation - Step {currentStep} of 3
          </h3>
          <Button
            isIconOnly
            variant="light"
            onPress={handleClose}
            className="text-default-500"
          >
            <FiX size={20} />
          </Button>
        </div>

        {/* Content */}
        <CustomScrollbar className="h-[calc(100vh-64px-80px)] p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <Select
                label="Departure City"
                placeholder="Select departure city"
                value={form.departureCity}
                onChange={(e) =>
                  setForm({ ...form, departureCity: e.target.value })
                }
              >
                {cities.map((city) => (
                  <SelectItem key={city}>{city}</SelectItem>
                ))}
              </Select>
              <Select
                label="Destination City"
                placeholder="Select destination city"
                value={form.destinationCity}
                onChange={(e) =>
                  setForm({ ...form, destinationCity: e.target.value })
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
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    startContent={<FiCalendar className="text-gray-400" />}
                  />
                  <Input
                    type="time"
                    label="Time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    startContent={<FiClock className="text-gray-400" />}
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Arrival Time</h4>
                  <Input
                    type="date"
                    label="Date"
                    value={form.arrivalDate}
                    onChange={(e) =>
                      setForm({ ...form, arrivalDate: e.target.value })
                    }
                    startContent={<FiCalendar className="text-gray-400" />}
                  />
                  <Input
                    type="time"
                    label="Time"
                    value={form.arrivalTime}
                    onChange={(e) =>
                      setForm({ ...form, arrivalTime: e.target.value })
                    }
                    startContent={<FiClock className="text-gray-400" />}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <Select
                label="Car Type"
                value={form.carType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    carType: e.target.value as "medium" | "large",
                  })
                }
              >
                <SelectItem key="medium">Medium (15 seats)</SelectItem>
                <SelectItem key="large">Large (60 seats)</SelectItem>
              </Select>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <Input
                type="number"
                label="Price per Seat ($)"
                value={form.price.toString()}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
              <div className="bg-content2 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Trip Summary</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    Route: {form.departureCity} → {form.destinationCity}
                  </p>
                  <p>
                    Departure: {form.date} {form.time}
                  </p>
                  <p>
                    Arrival: {form.arrivalDate} {form.arrivalTime}
                  </p>
                  <p>
                    Car Type:{" "}
                    {form.carType === "medium"
                      ? "Medium (15 seats)"
                      : "Large (60 seats)"}
                  </p>
                  <p>Price per Seat: ${form.price}</p>
                </div>
              </div>
            </div>
          )}
        </CustomScrollbar>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-divider bg-background">
          <div className="flex justify-end gap-2">
            <Button variant="light" onPress={handleClose}>
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button
                variant="flat"
                onPress={() => setCurrentStep(currentStep - 1)}
                isDisabled={isSubmitting}
              >
                Previous
              </Button>
            )}
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {currentStep < 3 ? "Next" : "Create Trip"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
