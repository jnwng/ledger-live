// @flow
import React from "react";
import { Trans, withTranslation } from "react-i18next";
import MemoValueField from "./MemoValueField";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";

const Root = (props: *) => {
  return (
    <Box flow={1}>
      <Box mb={10}>
        <Label>
          <LabelInfoTooltip text={<Trans i18nKey="families.stacks.memoWarningText" />}>
            <span>
              <Trans i18nKey="families.stacks.memo" />
            </span>
          </LabelInfoTooltip>
        </Label>
      </Box>
      <Box mb={10} horizontal grow alignItems="center" justifyContent="space-between">
        <Box ml={0} grow={1}>
          <MemoValueField {...props} />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: withTranslation()(Root),
  // Transaction is used here to prevent user to forward
  // If he format a memo incorrectly
  fields: ["memo", "transaction"],
};
