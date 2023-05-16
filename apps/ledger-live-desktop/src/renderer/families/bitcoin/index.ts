import "./live-common-setup";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/celo/types";
import { LLDCoinFamily } from "../types";
import modals, { ModalsData } from "./modals";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, ModalsData> = {
  modals,
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
};

export default family;
