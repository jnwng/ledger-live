import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import {
  ToggleOnboardingEarlyCheckActionArgs,
  ToggleOnboardingEarlyCheckActionState,
  toggleOnboardingEarlyCheckAction as defaultToggleOnboardingEarlyCheckAction,
  initialState,
} from "../actions/toggleOnboardingEarlyCheck";

export type UseToggleOnboardingEarlyCheckArgs = {
  toggleOnboardingEarlyCheckAction?: typeof defaultToggleOnboardingEarlyCheckAction;
  deviceId: string;
  toggleType: ToggleOnboardingEarlyCheckActionArgs["toggleType"];
};

/**
 * Hook making the device enter or exit the early security check steps, during the onboarding
 *
 * This hook only puts (or moves out) the device to the state/step of the early security check.
 * It does not starts any "security checks".
 *
 * If the device is not in the WELCOME or WELCOME_STEP2 onboarding state, this hook will update
 * its `toggleStatus` to `failure`.
 * @param deviceId The id of the targeted device that can be
 * @param toggleType either "enter" or "exit"
 * @param toggleOnboardingEarlyCheckAction dependency injected action. A default implementation is provided.
 * @returns an object containing the state of the onboarding early check toggling with possible error.
 */
export const useToggleOnboardingEarlyCheck = ({
  toggleOnboardingEarlyCheckAction = defaultToggleOnboardingEarlyCheckAction,
  deviceId,
  toggleType,
}: UseToggleOnboardingEarlyCheckArgs): {
  toggleOnboardingEarlyCheckState: ToggleOnboardingEarlyCheckActionState;
} => {
  const [state, setState] =
    useState<ToggleOnboardingEarlyCheckActionState>(initialState);

  useEffect(() => {
    toggleOnboardingEarlyCheckAction({ deviceId, toggleType }).subscribe({
      next: setState,
      error: (error: unknown) => {
        log("useToggleOnboardingEarlyCheck", "Unknown error", error);
      },
    });
  }, [deviceId, toggleOnboardingEarlyCheckAction, toggleType]);

  return { toggleOnboardingEarlyCheckState: state };
};
