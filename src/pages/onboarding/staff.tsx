import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface VehicleType {
  id: string;
  type: "medium" | "large";
  seatCapacity: number;
  description: string;
}

const FleetInfoPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Omit<VehicleType, "id">>({
    type: "medium",
    seatCapacity: 0,
    description: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewVehicle((prev) => ({
      ...prev,
      [name]: name === "seatCapacity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `vehicle_${Date.now()}`;
    setVehicles((prev) => [...prev, { ...newVehicle, id }]);
    setNewVehicle({
      type: "medium",
      seatCapacity: 0,
      description: "",
    });
    setShowAddForm(false);
  };

  const handleRemoveVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get company ID from localStorage
      const companyId = localStorage.getItem("signupUID");
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Update company document in Firestore
      const companyRef = doc(db, "transportation_companies", companyId);
      await updateDoc(companyRef, {
        fleet: {
          vehicles,
          updatedAt: new Date(),
        },
      });

      // Navigate to next step
      navigate("/onboarding/invite");
    } catch (error) {
      console.error("Error saving fleet info:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save fleet information"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={3}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-600">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Fleet Information
              </h3>
              <p className="text-gray-600">
                Add your vehicle types and their seating capacities. This
                information will be used when creating trips.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Vehicle List */}
        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {vehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {vehicle.type.charAt(0).toUpperCase() +
                        vehicle.type.slice(1)}{" "}
                      Vehicle
                    </h4>
                    <p className="text-sm text-gray-600">
                      Capacity: {vehicle.seatCapacity} seats
                    </p>
                    {vehicle.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {vehicle.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveVehicle(vehicle.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Vehicle Form */}
        <AnimatePresence>
          {showAddForm ? (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddVehicle}
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8"
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Vehicle Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={newVehicle.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="seatCapacity"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Seat Capacity
                  </label>
                  <input
                    type="number"
                    id="seatCapacity"
                    name="seatCapacity"
                    min="1"
                    value={newVehicle.seatCapacity}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={newVehicle.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add any additional details about the vehicle"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Vehicle
                  </button>
                </div>
              </div>
            </motion.form>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
            >
              <svg
                className="w-6 h-6 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Vehicle
            </motion.button>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-6"
          >
            {error}
          </motion.div>
        )}
      </div>
    </OnboardingLayout>
  );
};

export default FleetInfoPage;
