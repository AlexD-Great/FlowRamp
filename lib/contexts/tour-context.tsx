"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface TourContextType {
  isTourActive: boolean;
  hasCompletedTour: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  setStep: (step: number) => void;
  shouldStartTour: boolean;
  setShouldStartTour: (value: boolean) => void;
}

const TourContext = createContext<TourContextType>({
  isTourActive: false,
  hasCompletedTour: false,
  currentStep: 0,
  startTour: () => {},
  endTour: () => {},
  nextStep: () => {},
  setStep: () => {},
  shouldStartTour: false,
  setShouldStartTour: () => {},
});

const TOUR_STORAGE_KEY = "flowramp_tour_completed";
const TOUR_STEP_KEY = "flowramp_tour_step";
const SHOULD_START_TOUR_KEY = "flowramp_should_start_tour";

export function TourProvider({ children }: { children: ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shouldStartTour, setShouldStartTourState] = useState(false);

  // Load tour state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY) === "true";
      const savedStep = parseInt(localStorage.getItem(TOUR_STEP_KEY) || "0", 10);
      const shouldStart = localStorage.getItem(SHOULD_START_TOUR_KEY) === "true";

      setHasCompletedTour(completed);
      setCurrentStep(savedStep);
      setShouldStartTourState(shouldStart);
    }
  }, []);

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStep(0);
    localStorage.setItem(TOUR_STEP_KEY, "0");
    // Clear the should start flag
    localStorage.removeItem(SHOULD_START_TOUR_KEY);
    setShouldStartTourState(false);
  };

  const endTour = () => {
    setIsTourActive(false);
    setHasCompletedTour(true);
    setCurrentStep(0);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    localStorage.removeItem(TOUR_STEP_KEY);
  };

  const nextStep = () => {
    const newStep = currentStep + 1;
    setCurrentStep(newStep);
    localStorage.setItem(TOUR_STEP_KEY, newStep.toString());
  };

  const setStep = (step: number) => {
    setCurrentStep(step);
    localStorage.setItem(TOUR_STEP_KEY, step.toString());
  };

  const setShouldStartTour = (value: boolean) => {
    setShouldStartTourState(value);
    if (value) {
      localStorage.setItem(SHOULD_START_TOUR_KEY, "true");
    } else {
      localStorage.removeItem(SHOULD_START_TOUR_KEY);
    }
  };

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        hasCompletedTour,
        currentStep,
        startTour,
        endTour,
        nextStep,
        setStep,
        shouldStartTour,
        setShouldStartTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
