import React, { createContext, useContext, useState, ReactNode } from "react";

export type OnboardingData = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  skill_level?: string;
  interests?: string[]; // interest IDs
  imageUrl?: string[]; // cloudinary
   location?: {
    lat: number;
    lng: number;
  };
};

type OnboardingContextType = {
  onboardingData: OnboardingData;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboardingData: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const resetOnboardingData = () => {
    setOnboardingData({});
  };

  return (
    <OnboardingContext.Provider value={{ onboardingData, updateOnboardingData, resetOnboardingData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
