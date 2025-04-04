import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { motion } from "framer-motion";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 49,
    credits: 100,
    features: [
      "100 Trip Credits",
      "Basic Analytics",
      "Email Support",
      "Standard API Access",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    price: 99,
    credits: 250,
    features: [
      "250 Trip Credits",
      "Advanced Analytics",
      "Priority Support",
      "Advanced API Access",
      "Custom Branding",
    ],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    credits: 1000,
    features: [
      "1000 Trip Credits",
      "Enterprise Analytics",
      "24/7 Support",
      "Full API Access",
      "Custom Branding",
      "Dedicated Account Manager",
    ],
  },
];

const PlanPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get company ID from localStorage
      const companyId = localStorage.getItem("signupUID");
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Update company document in Firestore
      const companyRef = doc(db, "agencies", companyId);
      await updateDoc(companyRef, {
        subscription: {
          planId: selectedPlan,
          startDate: new Date(),
          credits: plans.find((p) => p.id === selectedPlan)?.credits || 0,
        },
        onboarded: true,
      });

      // Get the saved redirect path or default to dashboard
      const redirectPath =
        localStorage.getItem("redirectAfterOnboarding") || "/dashboard";
      localStorage.removeItem("redirectAfterOnboarding"); // Clean up

      // Navigate to saved path or dashboard
      navigate(redirectPath + "?onboarded=true");
    } catch (error) {
      console.error("Error selecting plan:", error);
      setError(
        error instanceof Error ? error.message : "Failed to select plan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={5}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600">
            Select a plan that best fits your business needs. You can upgrade or
            downgrade at any time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.recommended ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                  Recommended
                </div>
              )}
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mt-0.5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    selectedPlan === plan.id
                      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500"
                  }`}
                >
                  {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <button
            onClick={handleSelectPlan}
            disabled={isLoading}
            className={`px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Processing..." : "Continue with Selected Plan"}
          </button>
        </motion.div>

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

        {/* Money-Back Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>30-day money-back guarantee</span>
          </div>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
};

export default PlanPage;
