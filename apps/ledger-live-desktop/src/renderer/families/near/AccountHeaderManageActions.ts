import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { canStake } from "@ledgerhq/live-common/families/near/logic";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
type Props = {
  account: NearAccount;
  parentAccount: NearAccount | undefined | null;
  source?: string;
};
const AccountHeaderActions = ({ account, parentAccount, source }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const { nearResources } = mainAccount;
  const stakingEnabled = canStake(mainAccount);
  const hasStakingPositions = nearResources.stakingPositions.length > 0;
  const onClick = useCallback(() => {
    if (!stakingEnabled) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      if (hasStakingPositions) {
        dispatch(
          openModal("MODAL_NEAR_STAKE", {
            account,
            source,
          }),
        );
      } else {
        dispatch(
          openModal("MODAL_NEAR_REWARDS_INFO", {
            account,
          }),
        );
      }
    }
  }, [stakingEnabled, dispatch, account, parentAccount, hasStakingPositions, source]);
  if (parentAccount) return null;
  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label: t("account.stake"),
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};
export default AccountHeaderActions;
