import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, SubAccount, Operation } from "@ledgerhq/types-live";
import { listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets/tokens";
import { getOptimismAdditionalFees } from "./api/rpc.common";
import {
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "./types";

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const legacyTransactionHasFees = (tx: EvmTransactionLegacy): boolean =>
  Boolean((!tx.type || tx.type < 2) && tx.gasPrice);

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const eip1559TransactionHasFees = (tx: EvmTransactionEIP1559): boolean =>
  Boolean(tx.type === 2 && tx.maxFeePerGas && tx.maxPriorityFeePerGas);

/**
 * Helper to get total fee value for a tx depending on its type
 */
export const getEstimatedFees = (tx: EvmTransaction): BigNumber => {
  if (tx.type !== 2) {
    return tx.gasPrice?.multipliedBy(tx.gasLimit) || new BigNumber(0);
  }
  return tx.maxFeePerGas?.multipliedBy(tx.gasLimit) || new BigNumber(0);
};

/**
 * Helper returning the potential additional fees necessary for layer twos
 * to settle the transaction on layer 1.
 */
export const getAdditionalLayer2Fees = async (
  currency: CryptoCurrency,
  transaction: EvmTransaction
): Promise<BigNumber | undefined> => {
  switch (currency.id) {
    case "optimism":
    case "optimism_goerli": {
      const additionalFees = await getOptimismAdditionalFees(
        currency,
        transaction
      );
      return additionalFees;
    }
    default:
      return;
  }
};

/**
 * List of properties of a sub account that can be updated when 2 "identical" accounts are found
 */
const updatableSubAccountProperties: { name: string; isOps: boolean }[] = [
  { name: "balance", isOps: false },
  { name: "spendableBalance", isOps: false },
  { name: "balanceHistoryCache", isOps: false },
  { name: "swapHistory", isOps: false },
  { name: "operations", isOps: true },
  { name: "pendingOperations", isOps: true },
];

/**
 * In charge of smartly merging sub accounts while maintaining references as much as possible
 */
export const mergeSubAccounts = (
  initialAccount: Account | undefined,
  newSubAccounts: Partial<SubAccount>[]
): Array<Partial<SubAccount> | SubAccount> => {
  const oldSubAccounts: Array<Partial<SubAccount> | SubAccount> | undefined =
    initialAccount?.subAccounts;
  if (!oldSubAccounts) {
    return newSubAccounts;
  }

  // Creating a map of already existing sub accounts by id
  const oldSubAccountsById: { [key: string]: Partial<SubAccount> } = {};
  for (const oldSubAccount of oldSubAccounts) {
    oldSubAccountsById[oldSubAccount.id!] = oldSubAccount;
  }

  // Looping on new sub accounts to compare them with already existing ones
  // Already existing will be updated if necessary (see `updatableSubAccountProperties`)
  // Fresh new sub accounts will be added/pushed after already existing
  const newSubAccountsToAdd: Partial<SubAccount>[] = [];
  for (const newSubAccount of newSubAccounts) {
    const duplicatedAccount: Partial<SubAccount> | undefined =
      oldSubAccountsById[newSubAccount.id!];

    // If this sub account was not already in the initialAccount
    if (!duplicatedAccount) {
      // We'll add it later
      newSubAccountsToAdd.push(newSubAccount);
      continue;
    }

    const updates: Partial<SubAccount> = {};
    for (const { name, isOps } of updatableSubAccountProperties) {
      if (!isOps) {
        if (newSubAccount[name] !== duplicatedAccount[name]) {
          updates[name] = newSubAccount[name];
        }
      } else {
        updates[name] = mergeOps(duplicatedAccount[name], newSubAccount[name]);
      }
    }
    // Updating the operationsCount in case the mergeOps changed it
    updates.operationsCount =
      updates.operations?.length || duplicatedAccount?.operations?.length || 0;

    // Modifying the Map with the updated sub account with a new ref
    oldSubAccountsById[newSubAccount.id!] = {
      ...duplicatedAccount,
      ...updates,
    };
  }
  const updatedSubAccounts = Object.values(oldSubAccountsById);
  return [...updatedSubAccounts, ...newSubAccountsToAdd];
};

/**
 * Method creating a hash that will help triggering or not a full synchronization on an account.
 * As of now, it's checking if a token has been added, removed of changed regarding important properties
 */
export const getSyncHash = (currency: CryptoCurrency): string => {
  const tokens = listTokensForCryptoCurrency(currency);
  const basicTokensListString = tokens
    .map(
      (token) =>
        token.id +
        token.contractAddress +
        token.name +
        token.ticker +
        token.delisted
    )
    .join("");

  return ethers.utils.sha256(Buffer.from(basicTokensListString));
};

/**
 * Helper in charge of linking operations together based on transaction hash.
 * Token operations & NFT operations are the result of a coin operation
 * and if this coin operation is originated by our user we want
 * to link those operations together as main & children ops
 */
export const attachOperations = (
  _coinOperations: Operation[],
  _tokenOperations: Operation[],
  _nftOperations: Operation[]
): {
  coinOperations: Operation[];
  tokenOperations: Operation[];
  nftOperations: Operation[];
} => {
  // Creating deep copies of each Operation[] to prevent mutating the originals
  const coinOperations = _coinOperations.map((op) => ({ ...op }));
  const tokenOperations = _tokenOperations.map((op) => ({ ...op }));
  const nftOperations = _nftOperations.map((op) => ({ ...op }));

  // Create a Map of hash => operation
  const coinOperationsByHash: Record<string, Operation> = {};
  coinOperations.forEach((op) => {
    coinOperationsByHash[op.hash] = op;
  });

  // Looping through token operations to potentially copy them as a sub operation of a coin operation
  // once copied it's removed to avoid dups
  for (let index = 0; index <= tokenOperations.length - 1; index++) {
    const tokenOperation = tokenOperations[index];
    const mainOperation = coinOperationsByHash[tokenOperation.hash];
    if (mainOperation) {
      if (!mainOperation.subOperations) {
        mainOperation.subOperations = [];
      }
      mainOperation.subOperations.push(tokenOperation);
      tokenOperations.splice(index, 1);
      index--;
    }
  }

  // Looping through nft operations to potentially copy them as a sub operation of a coin operation
  // once copied it's removed to avoid dups
  for (let index = 0; index <= nftOperations.length - 1; index++) {
    const nftOperation = nftOperations[index];
    const mainOperation = coinOperationsByHash[nftOperation.hash];
    if (mainOperation) {
      if (!mainOperation.nftOperations) {
        mainOperation.nftOperations = [];
      }
      mainOperation.nftOperations.push(nftOperation);
      nftOperations.splice(index, 1);
      index--;
    }
  }

  return {
    coinOperations,
    tokenOperations,
    nftOperations,
  };
};
