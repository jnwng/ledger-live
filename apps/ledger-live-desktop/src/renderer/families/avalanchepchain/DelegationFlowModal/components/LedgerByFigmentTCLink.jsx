// @flow

import React from "react";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";

const LedgerByFigmentTC = () => {
  const { t } = useTranslation();
  const openLedgerByFigmentTC = () => openURL(urls.avalanche.ledgerByFigmentTC);

  return (
    <LinkWithExternalIcon
      label={t("avalanchepchain.delegation.flow.steps.validator.ledgerByFigmentTC")}
      onClick={openLedgerByFigmentTC}
    />
  );
};

export default LedgerByFigmentTC;
