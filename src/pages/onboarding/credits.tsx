import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { Spinner } from "@heroui/react";
import { db } from "@/config/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { FiCreditCard, FiAlertCircle, FiInfo } from "react-icons/fi";

// Credit package interface
interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  isPopular?: boolean;
}

// Available credit packages
const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", credits: 50, price: 1000 },
  { id: "popular", credits: 100, price: 1800, isPopular: true },
  { id: "pro", credits: 500, price: 8000 },
];

const CreditsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customCredits, setCustomCredits] = useState<number | "">("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "informative" | "success" | "warning" | "danger";
    id: number;
  } | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  // Calculate price for custom credits (20 MRO per credit)
  const calculateCustomPrice = (credits: number) => {
    return Math.floor(credits * 20);
  };

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

  // Handle custom credits input
  const handleCustomCreditsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "") {
      setCustomCredits("");
      setSelectedPackage(null);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setCustomCredits(numValue);
      setSelectedPackage(null);
    }
  };

  // Handle package selection
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setCustomCredits("");
  };

  // Handle agency creation and onboarding completion
  const handleCreateAgency = async () => {
    if (!user?.uid) {
      showNotification(
        "You must be logged in to complete onboarding",
        "danger"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Update agency document to mark as onboarded
      const agencyRef = doc(db, "agencies", user.uid);
      await updateDoc(agencyRef, {
        onboarded: true,
        status: "pending",
        updatedAt: serverTimestamp(),
      });

      showNotification("Onboarding completed successfully", "success");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!user?.uid) {
      showNotification("You must be logged in to purchase credits", "danger");
      return;
    }

    let creditsToAdd = 0;
    let price = 0;

    if (selectedPackage) {
      const pkg = CREDIT_PACKAGES.find((p) => p.id === selectedPackage);
      if (pkg) {
        creditsToAdd = pkg.credits;
        price = pkg.price;
      }
    } else if (customCredits) {
      creditsToAdd = customCredits;
      price = calculateCustomPrice(customCredits);
    }

    if (creditsToAdd <= 0) {
      showNotification(
        "Please select a credit package or enter an amount",
        "warning"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Update agency document with credits
      const agencyRef = doc(db, "agencies", user.uid);
      await updateDoc(agencyRef, {
        credits: creditsToAdd,
        creditHistory: [
          {
            amount: creditsToAdd,
            price: price,
            purchasedAt: serverTimestamp(),
            type: "initial_purchase",
          },
        ],
        updatedAt: serverTimestamp(),
      });

      showNotification(
        `Successfully purchased ${creditsToAdd} credits`,
        "success"
      );
      setTimeout(() => {
        navigate("/onboarding/review");
      }, 1500);
    } catch (error) {
      console.error("Error purchasing credits:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to purchase credits",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (!showSkipWarning) {
      setShowSkipWarning(true);
      return;
    }

    handleCreateAgency();
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
                  <FiCreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-ot-medium text-white">
                Get Started with Credits – Power Your Bookings
              </h1>
              <p className="text-white/60 max-w-2xl mx-auto">
                Purchase credits to make your trips visible in the app. Each
                booking uses one credit.
              </p>
            </div>

            {/* Credits System Explanation */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 text-blue-300">
              <div className="flex items-start space-x-4">
                <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium">How Credits Work:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      Each time a customer books a seat, 1 credit is deducted
                    </li>
                    <li>No hidden fees – pay only for visibility</li>
                    <li>Buy more anytime from your dashboard</li>
                    <li>
                      Your agency needs credits for trips to be visible to
                      customers in the app
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Credit Packages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white/5 backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPackage === pkg.id
                      ? "border-blue-500 bg-white/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-ot-medium text-white mb-1">
                      {pkg.credits} Credits
                    </div>
                    <div className="text-white/60 mb-4">{pkg.price} MRO</div>
                    <div className="text-sm text-white/40">
                      {Math.round(pkg.price / pkg.credits)} MRO per credit
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-2">
                  Custom Amount
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={customCredits}
                    onChange={handleCustomCreditsChange}
                    placeholder="Enter number of credits"
                    className="flex-1 px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 text-white placeholder-white/40"
                  />
                  {customCredits && (
                    <div className="text-white/60">
                      = {calculateCustomPrice(Number(customCredits))} MRO
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skip Warning */}
            {showSkipWarning && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-yellow-300 text-sm">
                <div className="flex items-start">
                  <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>
                    Your trips won't appear in the app until you have credits.
                    You can purchase credits later from your dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 py-6">
              <button
                onClick={handlePurchase}
                disabled={isLoading || (!selectedPackage && !customCredits)}
                className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {selectedPackage || customCredits
                      ? `Purchase ${
                          selectedPackage
                            ? CREDIT_PACKAGES.find(
                                (p) => p.id === selectedPackage
                              )?.credits
                            : customCredits
                        } Credits`
                      : "Select Credits"}
                  </span>
                )}
              </button>
              <button
                onClick={handleSkip}
                className="px-8 py-3 border border-white/20 text-white/80 rounded-lg font-medium hover:text-white hover:border-white/40 transition-colors"
              >
                Skip & Buy Credits Later
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </OnboardingLayout>
  );
};

export default CreditsPage;
