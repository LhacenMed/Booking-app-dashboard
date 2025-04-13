import { Button, Input, Textarea } from "@heroui/react";
import { useState } from "react";
import { useAgency } from "@/hooks/useAgency";
import { auth } from "@/config/firebase";
import { useNavigate } from "react-router-dom";

export const GeneralSettings = () => {
  const userId = auth.currentUser?.uid || null;
  const { company } = useAgency(userId);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Mock routes data (this would come from your database in a real implementation)
  const [routes, setRoutes] = useState([
    {
      id: "route-1",
      name: "Downtown Delivery Route",
      startLocation: "Company Headquarters",
      endLocation: "Downtown Business District",
      distance: "12.5 km",
      duration: "25 min",
      created: "2023-11-15",
    },
    {
      id: "route-2",
      name: "Airport Transit",
      startLocation: "Company Headquarters",
      endLocation: "International Airport",
      distance: "35.8 km",
      duration: "45 min",
      created: "2023-11-20",
    },
    {
      id: "route-3",
      name: "North Warehouse Supply",
      startLocation: "Distribution Center",
      endLocation: "North Warehouse",
      distance: "18.2 km",
      duration: "30 min",
      created: "2023-11-25",
    },
  ]);

  // Form state would be initialized with company data in a real implementation
  const [formData, setFormData] = useState({
    name: company?.name || "",
    email: company?.email || "",
    phone: "",
    address: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Save implementation would go here
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Save the company details
  const saveCompanyDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Save implementation would go here
    console.log("Saving company details:", formData);
    setTimeout(() => {
      setIsLoading(false);
      alert("Company details saved!");
    }, 1000);
  };

  // Navigate to route creation page
  const navigateToRouteCreation = () => {
    navigate("/dashboard/settings/general/route");
  };

  // Navigate to route details/edit page
  const navigateToRouteDetails = (routeId: string) => {
    navigate(`/dashboard/settings/general/route?id=${routeId}`);
  };

  // Delete a route
  const deleteRoute = (routeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the row click
    // Here you would typically make an API call to delete the route
    setRoutes(routes.filter((route) => route.id !== routeId));
    console.log(`Deleting route ${routeId}`);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-ot-bold mb-6">General Settings</h1>

      {/* Company Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-ot-semibold mb-4">Company Details</h2>

        <form onSubmit={saveCompanyDetails} className="space-y-4 max-w-xl">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
          <Textarea
            label="Company Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div className="pt-2">
            <Button type="submit" color="primary" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Custom Route Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-ot-semibold">Custom Routes</h2>
          <Button color="primary" onClick={navigateToRouteCreation}>
            Create New Route
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">
            About Custom Routes
          </h3>
          <p className="text-blue-700 mb-2">
            Plan and save custom routes for your company's trips. These routes
            can be used for:
          </p>
          <ul className="list-disc ml-5 text-blue-700">
            <li>Standard delivery routes</li>
            <li>Optimized transportation paths</li>
            <li>Fleet navigation guidance</li>
            <li>Trip distance and time estimation</li>
          </ul>
        </div>

        {/* Routes table */}
        {routes.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start → End
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => (
                  <tr
                    key={route.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigateToRouteDetails(route.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {route.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {route.startLocation} → {route.endLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {route.distance}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {route.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {route.created}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => deleteRoute(route.id, e)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">No custom routes created yet.</p>
            <Button color="secondary" onClick={navigateToRouteCreation}>
              Create Your First Route
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
