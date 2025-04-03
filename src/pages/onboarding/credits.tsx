import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface TeamMember {
  id: string;
  email: string;
  role: "admin" | "manager" | "support";
  inviteSent: boolean;
}

const InvitePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({
    email: "",
    role: "manager" as const,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.email) return;

    const id = `member_${Date.now()}`;
    setTeamMembers((prev) => [
      ...prev,
      { ...newMember, id, inviteSent: false },
    ]);
    setNewMember({
      email: "",
      role: "manager",
    });
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleSendInvites = async () => {
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
        teamMembers: teamMembers.map(({ id, email, role }) => ({
          email,
          role,
          invitedAt: new Date(),
        })),
      });

      // Send invitation emails (you'll need to implement this)
      for (const member of teamMembers) {
        if (!member.inviteSent) {
          // Send invitation email
          // Update member status
          setTeamMembers((prev) =>
            prev.map((m) =>
              m.id === member.id ? { ...m, inviteSent: true } : m
            )
          );
        }
      }

      // Navigate to next step
      navigate("/onboarding/plan");
    } catch (error) {
      console.error("Error sending invites:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send invites"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={4}>
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Invite Your Team
              </h3>
              <p className="text-gray-600">
                Add team members to help manage your transportation business.
                You can invite administrators, managers, and support staff.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Team Members List */}
        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900">
                        {member.email}
                      </h4>
                      {member.inviteSent && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Invited
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Role:{" "}
                      {member.role.charAt(0).toUpperCase() +
                        member.role.slice(1)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
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

        {/* Add Member Form */}
        <form
          onSubmit={handleAddMember}
          className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={newMember.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter team member's email"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={newMember.role}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Team Member
            </button>
          </div>
        </form>

        {/* Send Invites Button */}
        {teamMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <button
              onClick={handleSendInvites}
              disabled={isLoading}
              className={`px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Sending Invites..." : "Send Invites"}
            </button>
          </motion.div>
        )}

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

export default InvitePage;
