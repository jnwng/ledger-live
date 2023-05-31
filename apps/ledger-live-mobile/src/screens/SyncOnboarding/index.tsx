import React, { useCallback, useEffect, useState } from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { InfiniteLoader, Flex } from "@ledgerhq/native-ui";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import { ScreenName } from "../../const";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { RootStackParamList } from "../../components/RootNavigator/types/RootNavigator";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/types/SyncOnboardingNavigator";
import { SyncOnboardingCompanion } from "./SyncOnboardingCompanion";
import { EarlySecurityCheck } from "./EarlySecurityCheck";

export type SyncOnboardingScreenProps = CompositeScreenProps<
  StackScreenProps<
    SyncOnboardingStackParamList,
    ScreenName.SyncOnboardingCompanion
  >,
  CompositeScreenProps<
    StackScreenProps<BaseNavigatorStackParamList>,
    StackScreenProps<RootStackParamList>
  >
>;

const POLLING_PERIOD_MS = 1000;

/**
 * Synchronous onboarding screen composed of the "early security/onboarding checks" step and the "synchronous companion" step
 *
 * This screen polls the state of the device to:
 * - toggle the onboarding early checks (enter/exit) on the device if needed
 * - know which steps it should display
 */
export const SyncOnboarding = ({
  navigation,
  route,
}: SyncOnboardingScreenProps) => {
  const { device } = route.params;
  const [currentStep, setCurrentStep] = useState<
    "loading" | "early-security-check" | "companion"
  >("loading");
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);
  const [toggleOnboardingEarlyCheckType, setToggleOnboardingEarlyCheckType] =
    useState<null | "enter" | "exit">(null);

  const { onboardingState, allowedError, fatalError } =
    useOnboardingStatePolling({
      device,
      pollingPeriodMs: POLLING_PERIOD_MS,
      stopPolling: !isPollingOn,
    });

  const { state: toggleOnboardingEarlyCheckState } =
    useToggleOnboardingEarlyCheck({
      deviceId: device.deviceId,
      toggleType: toggleOnboardingEarlyCheckType,
    });

  const notifyOnboardingEarlyCheckEnded = useCallback(() => {
    setToggleOnboardingEarlyCheckType("exit");
  }, []);

  // Called when the companion component thinks the device is not in a correct state anymore
  const notifySyncOnboardingShouldReset = useCallback(() => {
    setIsPollingOn(true);
  }, []);

  // Handles current step and toggling onboarding early check logics
  useEffect(() => {
    if (!onboardingState) {
      return;
    }
    const { currentOnboardingStep } = onboardingState;

    if (
      [
        OnboardingStep.WelcomeScreen1,
        OnboardingStep.WelcomeScreen2,
        OnboardingStep.WelcomeScreen3,
        OnboardingStep.WelcomeScreen4,
        OnboardingStep.WelcomeScreenReminder,
      ].includes(currentOnboardingStep)
    ) {
      setIsPollingOn(false);
      setToggleOnboardingEarlyCheckType("enter");
    } else if (currentOnboardingStep === OnboardingStep.OnboardingEarlyCheck) {
      setIsPollingOn(false);
      // Resets the `useToggleOnboardingEarlyCheck` hook. Avoids having a case where for ex
      // check type == "exit" and toggle status still being == "success" from the previous toggle
      setToggleOnboardingEarlyCheckType(null);
      setCurrentStep("early-security-check");
    } else {
      setIsPollingOn(false);
      setCurrentStep("companion");
    }
  }, [onboardingState]);

  // TODO: need to maybe handle fatalError and allowedError like SyncOnboardingCompanion
  useEffect(() => {
    if (allowedError) {
      console.error(
        `SyncOnboarding allowed error: ${JSON.stringify(allowedError)}`,
      );
    }
    if (fatalError) {
      console.error(
        `SyncOnboarding fatal error: ${JSON.stringify(fatalError)}`,
      );
    }
  }, [allowedError, fatalError]);

  useEffect(() => {
    if (toggleOnboardingEarlyCheckState.toggleStatus === "none") return;

    console.log(
      `🥦 useEffect: toggle type and state = ${JSON.stringify({
        toggleOnboardingEarlyCheckType,
        toggleOnboardingEarlyCheckState,
      })}`,
    );

    if (toggleOnboardingEarlyCheckState.toggleStatus === "failure") {
      console.log(
        `ToggleOnboardingEarlyCheck error: ${JSON.stringify(
          toggleOnboardingEarlyCheckState.error,
        )}`,
      );

      // If an error occurred during the toggling the safe backup is to bring the device to the "companion" step
      setToggleOnboardingEarlyCheckType(null);
      setCurrentStep("companion");
    }

    // After a successful "enter" or "exit", the polling is restarted to know the device state
    if (
      toggleOnboardingEarlyCheckType !== null &&
      toggleOnboardingEarlyCheckState.toggleStatus === "success"
    ) {
      // Resets the toggle hook
      setToggleOnboardingEarlyCheckType(null);
      setIsPollingOn(true);
      // Not setting the `currentStep` to "loading" here to avoid UI flash
    }
  }, [toggleOnboardingEarlyCheckState, toggleOnboardingEarlyCheckType]);

  console.log(
    `🧠 currentStep: ${currentStep} | toggleOnboardingEarlyCheckType: ${toggleOnboardingEarlyCheckType}`,
  );

  if (currentStep === "early-security-check") {
    return (
      <EarlySecurityCheck
        device={device}
        notifyOnboardingEarlyCheckEnded={notifyOnboardingEarlyCheckEnded}
      />
    );
  }

  if (currentStep === "companion") {
    return (
      <SyncOnboardingCompanion
        navigation={navigation}
        device={device}
        notifySyncOnboardingShouldReset={notifySyncOnboardingShouldReset}
      />
    );
  }

  return (
    <Flex
      height="100%"
      width="100%"
      justifyContent="center"
      alignItems="center"
    >
      <InfiniteLoader />
    </Flex>
  );
};
