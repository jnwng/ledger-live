import {
  ElrondAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Operation } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";
import { Step } from "~/renderer/components/Stepper";
import { DelegationType } from "~/renderer/families/elrond/types";

export type StepId = "amount" | "device" | "confirmation";
export type StepProps = {
  t: TFunction;
  transitionTo: (param: string) => void;
  device?: Device;
  account?: ElrondAccount;
  parentAccount?: ElrondAccount;
  onRetry: () => void;
  onClose: () => void;
  openModal: (key: string, config?: any) => void;
  optimisticOperation: any;
  error: any;
  signed: boolean;
  transaction?: Transaction;
  status: TransactionStatus;
  onChangeTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: (_: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: Operation) => void;
  setSigned: (assigned: boolean) => void;
  bridgePending: boolean;
  validatorAddress: string;
  contract: string;
  amount: string;
  delegations: Array<DelegationType>;
};
export type St = Step<StepId, StepProps>;
