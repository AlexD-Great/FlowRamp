"use client";

import { useEffect, useRef, useCallback } from "react";
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

  // Initialize driver.js
  const initDriver = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.7)",
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: "flowramp-tour-popover",
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Previous",
      doneBtnText: "Finish Tour",
      onDestroyStarted: () => {
        if (!isNavigatingRef.current) {
          endTour();
        }
      },
      onNextClick: () => {
        const nextStepIndex = currentStep + 1;

        if (nextStepIndex >= tourSteps.length) {
          endTour();
          driverRef.current?.destroy();
          return;
        }

        const nextPage = getPageForStep(nextStepIndex);
        const currentPage = pathname;

        if (nextPage !== currentPage) {
          // Need to navigate to next page
          isNavigatingRef.current = true;
          setStep(nextStepIndex);
          driverRef.current?.destroy();
          router.push(nextPage);
        } else {
          // Same page, just move to next step
          setStep(nextStepIndex);
          driverRef.current?.moveNext();
        }
      },
      onPrevClick: () => {
        const prevStepIndex = currentStep - 1;

        if (prevStepIndex < 0) {
          return;
        }

        const prevPage = getPageForStep(prevStepIndex);
        const currentPage = pathname;

        if (prevPage !== currentPage) {
          // Need to navigate to previous page
          isNavigatingRef.current = true;
          setStep(prevStepIndex);
          driverRef.current?.destroy();
          router.push(prevPage);
        } else {
          // Same page, just move to previous step
          setStep(prevStepIndex);
          driverRef.current?.movePrevious();
        }
      },
    });
  }, [currentStep, pathname, router, setStep, endTour]);

  // Auto-start tour after signup
  useEffect(() => {
    if (shouldStartTour && pathname === "/") {
      // Small delay to ensure page is rendered
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
      // Navigate to correct page
      isNavigatingRef.current = true;
      router.push(currentStepData.page);
      return;
    }

    // Reset navigation flag
    isNavigatingRef.current = false;

    // Wait for elements to be rendered
    const timer = setTimeout(() => {
      initDriver();

      // Get steps for current page starting from current step
      const stepsForCurrentPage = tourSteps
        .slice(currentStep)
        .filter((step) => step.page === pathname)
        .map((step) => ({
          element: step.element,
          popover: step.popover,
        }));

      if (stepsForCurrentPage.length > 0 && driverRef.current) {
        driverRef.current.setSteps(stepsForCurrentPage);
        driverRef.current.drive();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isTourActive, currentStep, pathname, router, initDriver, endTour]);

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
