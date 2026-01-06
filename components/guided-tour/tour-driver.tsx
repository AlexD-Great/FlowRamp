"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTour } from "@/lib/contexts/tour-context";
import { tourSteps, getPageForStep } from "@/lib/constants/tour-steps";

export function TourDriver() {
  const { isTourActive, currentStep, setStep, endTour, startTour, shouldStartTour } = useTour();
  const pathname = usePathname();
  const router = useRouter();
  const driverRef = useRef<Driver | null>(null);
  const isNavigatingRef = useRef(false);

  const totalSteps = tourSteps.length;

  // Auto-start tour after signup
  useEffect(() => {
    if (shouldStartTour && pathname === "/") {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldStartTour, pathname, startTour]);

  // Start/resume tour when active and on correct page
  useEffect(() => {
    if (!isTourActive) {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      return;
    }

    const currentStepData = tourSteps[currentStep];
    if (!currentStepData) {
      endTour();
      return;
    }

    // Check if we're on the correct page for this step
    if (currentStepData.page !== pathname) {
      isNavigatingRef.current = true;
      router.push(currentStepData.page);
      return;
    }

    // Reset navigation flag
    isNavigatingRef.current = false;

    // Wait for elements to be rendered
    const timer = setTimeout(() => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }

      const isLastStep = currentStep === totalSteps - 1;
      const isFirstStep = currentStep === 0;

      driverRef.current = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "rgba(0, 0, 0, 0.7)",
        stagePadding: 10,
        stageRadius: 8,
        popoverClass: "flowramp-tour-popover",
        // Custom progress text showing global step count
        progressText: `${currentStep + 1} of ${totalSteps}`,
        nextBtnText: isLastStep ? "Finish Tour" : "Next",
        prevBtnText: "Previous",
        doneBtnText: "Finish Tour",
        showButtons: ["next", ...(isFirstStep ? [] : ["previous"] as const), "close"],
        onDestroyStarted: () => {
          if (!isNavigatingRef.current) {
            endTour();
          }
        },
        onNextClick: () => {
          const nextStepIndex = currentStep + 1;

          if (nextStepIndex >= totalSteps) {
            endTour();
            driverRef.current?.destroy();
            return;
          }

          const nextPage = getPageForStep(nextStepIndex);

          if (nextPage !== pathname) {
            isNavigatingRef.current = true;
            setStep(nextStepIndex);
            driverRef.current?.destroy();
            router.push(nextPage);
          } else {
            setStep(nextStepIndex);
          }
        },
        onPrevClick: () => {
          const prevStepIndex = currentStep - 1;

          if (prevStepIndex < 0) {
            return;
          }

          const prevPage = getPageForStep(prevStepIndex);

          if (prevPage !== pathname) {
            isNavigatingRef.current = true;
            setStep(prevStepIndex);
            driverRef.current?.destroy();
            router.push(prevPage);
          } else {
            setStep(prevStepIndex);
          }
        },
      });

      // Only highlight the current step
      const stepConfig = {
        element: currentStepData.element,
        popover: {
          ...currentStepData.popover,
          showButtons: ["next", ...(isFirstStep ? [] : ["previous"] as const), "close"],
          nextBtnText: isLastStep ? "Finish Tour" : "Next",
          prevBtnText: "Previous",
          showProgress: true,
          progressText: `${currentStep + 1} of ${totalSteps}`,
        },
      };

      driverRef.current.highlight(stepConfig);
    }, 300);

    return () => clearTimeout(timer);
  }, [isTourActive, currentStep, pathname, router, setStep, endTour, totalSteps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  return null;
}
