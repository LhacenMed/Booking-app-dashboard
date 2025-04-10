import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { Spinner } from "@heroui/react";
import { db } from "@/config/firebase";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import {
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiSend,
  FiAlertCircle,
} from "react-icons/fi";

// Types for staff member and permissions
interface Permission {
  id: string;
  name: string;
  description: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: Record<string, boolean>;
  status: "pending" | "active" | "suspended";
  createdAt: Date;
}

// Available roles and permissions
const ROLES = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "accountant", name: "Accountant" },
  { id: "agent", name: "Agent" },
  { id: "driver", name: "Driver" },
  { id: "customer_service", name: "Customer Service" },
];

const PERMISSIONS: Permission[] = [
  {
    id: "create_trips",
    name: "Create Trips",
    description: "Create and publish new trips",
  },
  {
    id: "manage_seats",
    name: "Manage Seats",
    description: "Assign and manage seat bookings",
  },
  {
    id: "view_revenue",
    name: "View Revenue",
    description: "Access financial reports and revenue data",
  },
  {
    id: "manage_staff",
    name: "Manage Staff",
    description: "Add, edit, and remove staff members",
  },
  {
    id: "view_customer_data",
    name: "View Customer Data",
    description: "Access customer information",
  },
  {
    id: "buy_credits",
    name: "Buy Credits",
    description: "Purchase credits for the agency",
  },
];

// Default permissions by role
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.id),
  manager: ["create_trips", "manage_seats", "view_customer_data"],
  accountant: ["view_revenue"],
  agent: ["create_trips", "manage_seats", "view_customer_data"],
  driver: ["view_customer_data"],
  customer_service: ["view_customer_data"],
};

const StaffManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "informative" | "success" | "warning" | "danger";
    id: number;
  } | null>(null);

  // Staff state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // New staff member form state
  const [newStaff, setNewStaff] = useState<
    Omit<StaffMember, "id" | "createdAt" | "status">
  >({
    name: "",
    email: "",
    phone: "",
    role: "agent",
    permissions: {},
  });

  // Initialize permissions based on role
  useEffect(() => {
    if (newStaff.role) {
      const rolePermissions = DEFAULT_PERMISSIONS[newStaff.role] || [];
      const permissionsObj = PERMISSIONS.reduce(
        (acc, permission) => {
          acc[permission.id] = rolePermissions.includes(permission.id);
          return acc;
        },
        {} as Record<string, boolean>
      );

      setNewStaff((prev) => ({
        ...prev,
        permissions: permissionsObj,
      }));
    }
  }, [newStaff.role]);

  // Load existing staff members from the subcollection
  useEffect(() => {
    const loadStaffData = async () => {
      if (!user?.uid) return;

      setIsLoading(true);
      try {
        // Get reference to the staff subcollection
        const staffCollectionRef = collection(
          db,
          "agencies",
          user.uid,
          "staff"
        );

        // Query all staff documents ordered by creation time
        const staffQuery = query(
          staffCollectionRef,
          orderBy("createdAt", "desc")
        );
        const staffSnapshot = await getDocs(staffQuery);

        // Convert the documents to StaffMember objects
        const loadedStaff: StaffMember[] = [];

        staffSnapshot.forEach((doc) => {
          const data = doc.data();
          loadedStaff.push({
            id: doc.id,
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            role: data.role || "agent",
            permissions: data.permissions || {},
            status: data.status || "pending",
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        setStaffMembers(loadedStaff);

        if (loadedStaff.length > 0) {
          showNotification("Staff data loaded successfully", "informative");
        }
      } catch (error) {
        console.error("Error loading staff data:", error);
        showNotification("Failed to load existing staff data", "warning");
      } finally {
        setIsLoading(false);
      }
    };

    loadStaffData();
  }, [user]);

  // Show notification
  const showNotification = (
    message: string,
    type: "informative" | "success" | "warning" | "danger"
  ) => {
    const id = Date.now();
    setNotification({
      message,
      type,
      id,
    });
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle permission checkbox change
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setNewStaff((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: checked,
      },
    }));
  };

  // Reset form
  const resetForm = () => {
    setNewStaff({
      name: "",
      email: "",
      phone: "",
      role: "agent",
      permissions: {},
    });
    setIsEditMode(false);
    setEditingStaffId(null);
    setIsFormVisible(false);
  };

  // Add or update staff member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStaff.name || !newStaff.email) {
      showNotification("Name and email are required", "warning");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStaff.email)) {
      showNotification("Please enter a valid email address", "warning");
      return;
    }

    if (isEditMode && editingStaffId) {
      // Update existing staff member
      updateStaffMember(editingStaffId);
    } else {
      // Add new staff member
      addStaffMember();
    }
  };

  // Add new staff member to the subcollection
  const addStaffMember = async () => {
    if (!user?.uid) {
      showNotification("You must be logged in to add staff members", "danger");
      return;
    }

    // Check if email already exists in staff list
    const emailExists = staffMembers.some(
      (staff) => staff.email.toLowerCase() === newStaff.email.toLowerCase()
    );

    if (emailExists) {
      showNotification(
        "A staff member with this email already exists",
        "warning"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Get reference to the staff subcollection
      const staffCollectionRef = collection(db, "agencies", user.uid, "staff");

      // Create a new staff member object
      const staffData = {
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone || "",
        role: newStaff.role,
        permissions: newStaff.permissions,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add the document to the subcollection
      const docRef = await addDoc(staffCollectionRef, staffData);

      // Create the complete staff member object with the generated ID
      const newStaffMember: StaffMember = {
        id: docRef.id,
        ...newStaff,
        status: "pending",
        createdAt: new Date(),
      };

      // Add to local state
      setStaffMembers((prev) => [...prev, newStaffMember]);

      // Send invite (this would typically call a backend function to send an email)
      // For now, just simulate it
      showNotification(`Invitation sent to ${newStaff.email}`, "success");

      // Reset form
      resetForm();

      // Update the agency document with hasStaff flag
      const agencyRef = doc(db, "agencies", user.uid);
      await updateDoc(agencyRef, {
        hasStaff: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding staff member:", error);
      showNotification(
        "Failed to add staff member. Please try again.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing staff member in the subcollection
  const updateStaffMember = async (staffId: string) => {
    if (!user?.uid) {
      showNotification(
        "You must be logged in to update staff members",
        "danger"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Get reference to the specific staff document
      const staffDocRef = doc(db, "agencies", user.uid, "staff", staffId);

      // Update the document in Firestore
      await updateDoc(staffDocRef, {
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone || "",
        role: newStaff.role,
        permissions: newStaff.permissions,
        updatedAt: serverTimestamp(),
      });

      // Update in local state
      setStaffMembers((prev) =>
        prev.map((staff) =>
          staff.id === staffId
            ? {
                ...staff,
                name: newStaff.name,
                email: newStaff.email,
                phone: newStaff.phone,
                role: newStaff.role,
                permissions: newStaff.permissions,
              }
            : staff
        )
      );

      showNotification("Staff member updated successfully", "success");
      resetForm();
    } catch (error) {
      console.error("Error updating staff member:", error);
      showNotification(
        "Failed to update staff member. Please try again.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Remove staff member from the subcollection
  const handleRemoveStaff = async (staffId: string) => {
    if (!user?.uid) {
      showNotification(
        "You must be logged in to remove staff members",
        "danger"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Get reference to the specific staff document
      const staffDocRef = doc(db, "agencies", user.uid, "staff", staffId);

      // Delete the document from Firestore
      await deleteDoc(staffDocRef);

      // Remove from local state
      setStaffMembers((prev) => prev.filter((staff) => staff.id !== staffId));
      showNotification("Staff member removed successfully", "informative");

      // If this was the last staff member, update the agency document
      if (staffMembers.length <= 1) {
        const agencyRef = doc(db, "agencies", user.uid);
        await updateDoc(agencyRef, {
          hasStaff: false,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error removing staff member:", error);
      showNotification(
        "Failed to remove staff member. Please try again.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Edit staff member
  const handleEditStaff = (staffId: string) => {
    const staffToEdit = staffMembers.find((staff) => staff.id === staffId);

    if (staffToEdit) {
      setNewStaff({
        name: staffToEdit.name,
        email: staffToEdit.email,
        phone: staffToEdit.phone,
        role: staffToEdit.role,
        permissions: { ...staffToEdit.permissions },
      });

      setIsEditMode(true);
      setEditingStaffId(staffId);
      setIsFormVisible(true);
    }
  };

  // Resend invite - in a real app, this would call a backend function
  const handleResendInvite = async (staffId: string) => {
    if (!user?.uid) {
      showNotification("You must be logged in to resend invites", "danger");
      return;
    }

    setIsSendingInvite(staffId);

    try {
      // Get the staff member to resend invite to
      const staffMember = staffMembers.find((staff) => staff.id === staffId);

      if (!staffMember) {
        throw new Error("Staff member not found");
      }

      // In a real app, you'd call an API to send the invite email
      // For now, just simulate it
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update the document to reflect the resent invite
      const staffDocRef = doc(db, "agencies", user.uid, "staff", staffId);
      await updateDoc(staffDocRef, {
        inviteResent: serverTimestamp(),
      });

      showNotification(`Invitation resent to ${staffMember.email}`, "success");
    } catch (error) {
      console.error("Error resending invite:", error);
      showNotification("Failed to resend invitation", "danger");
    } finally {
      setIsSendingInvite(null);
    }
  };

  // Proceed to the next step in onboarding
  const handleContinue = () => {
    // Just navigate to the next step, no need to save anything
    // as data is already stored in Firestore upon each action
    navigate("/onboarding/credits");
  };

  return (
    <OnboardingLayout notification={notification}>
      <PageTransition>
        <div className="min-h-screen flex flex-col p-6">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-ot-medium text-white">
                Add Your Team – Manage Your Agency Smoothly
              </h1>
              <p className="text-white/60 max-w-2xl mx-auto">
                Add staff members who will help run your agency. Each person can
                have different permissions based on their role.
              </p>
            </div>

            {/* Add Staff Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              {isFormVisible ? (
                <form onSubmit={handleAddStaff} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm text-white/60 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newStaff.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm text-white/60 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newStaff.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                        placeholder="johndoe@example.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm text-white/60 mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={newStaff.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm text-white/60 mb-1">
                        Role
                      </label>
                      <select
                        name="role"
                        value={newStaff.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white"
                      >
                        {ROLES.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm text-white/60 mb-3">
                      Permissions
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-start">
                          <input
                            type="checkbox"
                            id={permission.id}
                            checked={
                              newStaff.permissions[permission.id] || false
                            }
                            onChange={(e) =>
                              handlePermissionChange(
                                permission.id,
                                e.target.checked
                              )
                            }
                            className="mt-1 h-4 w-4 text-blue-600 rounded"
                          />
                          <label
                            htmlFor={permission.id}
                            className="ml-2 block text-sm"
                          >
                            <span className="font-medium text-white">
                              {permission.name}
                            </span>
                            <p className="text-white/60 text-xs mt-0.5">
                              {permission.description}
                            </p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 border border-white/10 rounded-lg text-white/80 hover:text-white hover:border-white/30 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          <span>
                            {isEditMode ? "Updating..." : "Adding..."}
                          </span>
                        </>
                      ) : (
                        <span>
                          {isEditMode
                            ? "Update Staff Member"
                            : "Add Staff Member"}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsFormVisible(true)}
                  className="w-full py-4 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:text-white/90 hover:border-white/40 transition-all flex items-center justify-center group"
                >
                  <span className="w-5 h-5 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mr-2 transition-all">
                    +
                  </span>
                  Add Staff Member
                </button>
              )}
            </div>

            {/* Staff List */}
            {staffMembers.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-medium text-white mb-4">
                  Your Team ({staffMembers.length})
                </h2>
                <div className="space-y-4">
                  {staffMembers.map((staff) => (
                    <div
                      key={staff.id}
                      className="border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-lg font-medium text-white">
                            {staff.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center text-white/60 gap-x-4 mt-1">
                            <span>{staff.email}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {ROLES.find((r) => r.id === staff.role)?.name ||
                                staff.role}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status badge */}
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              staff.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : staff.status === "suspended"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {staff.status === "active"
                              ? "Active"
                              : staff.status === "suspended"
                                ? "Suspended"
                                : "Pending Invite"}
                          </span>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditStaff(staff.id)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                              aria-label="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>

                            {staff.status === "pending" && (
                              <button
                                onClick={() => handleResendInvite(staff.id)}
                                disabled={isSendingInvite === staff.id}
                                className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                aria-label="Resend invite"
                              >
                                {isSendingInvite === staff.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FiSend className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => handleRemoveStaff(staff.id)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
                              aria-label="Remove"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(staff.permissions)
                          .filter(([_, hasPermission]) => hasPermission)
                          .map(([permId]) => {
                            const permission = PERMISSIONS.find(
                              (p) => p.id === permId
                            );
                            return permission ? (
                              <span
                                key={permId}
                                className="px-2 py-1 bg-white/5 text-white/80 rounded-md text-xs"
                                title={permission.description}
                              >
                                {permission.name}
                              </span>
                            ) : null;
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-blue-300 text-sm">
              <div className="flex items-start">
                <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>
                  You can always manage your staff later in the Agencies & Staff
                  section of your dashboard.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 py-6">
              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center"
              >
                Continue to Credits
              </button>
              <button
                onClick={() => navigate("/onboarding/credits")}
                className="px-8 py-3 border border-white/20 text-white/80 rounded-lg font-medium hover:text-white hover:border-white/40 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </OnboardingLayout>
  );
};

export default StaffManagementPage;
