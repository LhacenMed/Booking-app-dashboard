import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  DocumentData,
  getDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@heroui/react";
import { FiGlobe } from "react-icons/fi";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import CustomDropdown from "@/components/ui/dropdown";

interface Company extends DocumentData {
  id: string;
  name: string;
  logo: {
    publicId: string;
    uploadedAt: string;
    url: string;
  };
  email: string;
  location: [number, number];
  phoneNumber: string;
  status: string;
  updatedAt: string;
}

export default function SelectCompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loadingStates, setLoadingStates] = useState({
    fetchLoading: true, // For fetching companies
    updateLoading: false, // For updating company selection
    agencyLoading: true, // For fetching current agency data
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "informative" | "success" | "warning" | "danger";
    id: number;
  } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch current agency data to get companyId
  useEffect(() => {
    const fetchAgencyData = async () => {
      if (!user) return;

      try {
        setLoadingStates((prev) => ({ ...prev, agencyLoading: true }));
        const agencyDoc = await getDoc(doc(db, "agencies", user.uid));

        if (agencyDoc.exists() && agencyDoc.data().companyId) {
          setSelectedCompany(agencyDoc.data().companyId);
        }
      } catch (error) {
        console.error("Error fetching agency data:", error);
        showNotification("Failed to fetch agency data", "danger");
      } finally {
        setLoadingStates((prev) => ({ ...prev, agencyLoading: false }));
      }
    };

    fetchAgencyData();
  }, [user]);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user) return; // Don't fetch if not authenticated

      try {
        setLoadingStates((prev) => ({ ...prev, fetchLoading: true }));
        const snapshot = await getDocs(
          collection(db, "transportation_companies")
        );
        const validCompanies = snapshot.docs
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as Company
          )
          .filter(
            (company) =>
              company.name && company.logo?.url && company.status === "approved"
          );
        setCompanies(validCompanies);
      } catch (error) {
        console.error("Error fetching companies:", error);
        showNotification("Failed to fetch companies", "danger");
      } finally {
        setLoadingStates((prev) => ({ ...prev, fetchLoading: false }));
      }
    };

    fetchCompanies();
  }, [user]);

  const handleContinue = async () => {
    if (!selectedCompany || !user?.uid) return;

    try {
      setLoadingStates((prev) => ({ ...prev, updateLoading: true }));
      await updateDoc(doc(db, "agencies", user.uid), {
        companyId: selectedCompany,
        updatedAt: new Date(),
      });
      showNotification("Successfully updated company", "success");
      navigate("/onboarding/agency-details");
    } catch (error) {
      console.error("Error updating agency:", error);
      showNotification(`Failed to update company: ${error}`, "danger");
    } finally {
      setLoadingStates((prev) => ({ ...prev, updateLoading: false }));
    }
  };

  const showNotification = (
    message: string,
    type: "informative" | "success" | "warning" | "danger"
  ) => {
    // Using timestamp as unique ID
    const id = Date.now();
    setNotification({
      message,
      type,
      id: id,
    });
  };

  return (
    <OnboardingLayout notification={notification}>
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <FiGlobe className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-ot-medium text-white">
                Select Your Company
              </h1>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                Read our guide for best practices
              </a>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-white/60">Company</label>
                <div className="relative">
                  {loadingStates.fetchLoading || loadingStates.agencyLoading ? (
                    <div className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-white/10 flex items-center gap-2 h-[55px]">
                      <Spinner size="sm" className="text-white/40" />
                      <span className="text-[15px] text-white/40">
                        {loadingStates.agencyLoading
                          ? "Loading your company data..."
                          : "Loading companies..."}
                      </span>
                    </div>
                  ) : companies.length > 0 ? (
                    <CustomDropdown
                      value={selectedCompany}
                      onChange={setSelectedCompany}
                      options={companies.map((company) => ({
                        id: company.id,
                        name: company.name,
                        logoUrl: company.logo.url,
                      }))}
                      placeholder="Select a company..."
                    />
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                      <p className="font-medium">No companies available</p>
                      <p className="text-sm mt-1 text-red-300">
                        Your transportation company must contact us to be added
                        to the platform.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={
                  !selectedCompany ||
                  loadingStates.updateLoading ||
                  loadingStates.fetchLoading
                }
                className={`w-full bg-white text-black py-3 rounded-lg font-medium disabled:opacity-50 hover:bg-white/90 transition-colors ${
                  !selectedCompany ||
                  loadingStates.updateLoading ||
                  loadingStates.fetchLoading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {loadingStates.updateLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Continue"
                )}
              </button>

              <div className="flex justify-center">
                <button
                  onClick={() => navigate("/onboarding/agency-details")}
                  className="text-white/60 hover:text-white/80 hover:underline transition-colors text-sm"
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </OnboardingLayout>
  );
}
