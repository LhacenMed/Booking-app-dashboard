import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import { PageTransition } from "@/components/ui/PageTransition";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <OnboardingLayout>
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md mx-auto space-y-6">
            {/* Logo */}
            <div className="mb-8">
              <h1 className="text-4xl font-ot-bold text-white">SupNum</h1>
            </div>

            {/* Welcome Text */}
            <div className="space-y-4">
              <h2 className="text-2xl font-ot-medium text-white">
                Welcome to SupNum
              </h2>
              <p className="text-lg text-white/60 font-ot-regular">
                Your complete transportation management solution with powerful
                tools to streamline operations.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button
                onClick={() => navigate("/onboarding/select-company")}
                className="w-full bg-white text-black py-3 px-6 rounded-lg font-ot-medium hover:bg-white/90 transition-colors"
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </OnboardingLayout>
  );
}
