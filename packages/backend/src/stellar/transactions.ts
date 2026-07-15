import {
  Account,
  Asset,
  BASE_FEE,
  Operation,
  TransactionBuilder,
  type Transaction,
} from "@stellar/stellar-sdk";

import { STELLAR_TESTNET_CONFIG } from "./config.js";

export interface ClassicTransactionInput {
  sourceAccount: string;
  sourceSequence: string;
  minTime: number;
  maxTime: number;
}

function builder(input: ClassicTransactionInput) {
  return new TransactionBuilder(new Account(input.sourceAccount, input.sourceSequence), {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
  }).setTimebounds(input.minTime, input.maxTime);
}

export function buildTrustlineTransaction(
  input: ClassicTransactionInput & {
    assetCode: string;
    issuerAccount: string;
    limit: string;
  },
): Transaction {
  return builder(input)
    .addOperation(
      Operation.changeTrust({
        asset: new Asset(input.assetCode, input.issuerAccount),
        limit: input.limit,
      }),
    )
    .build();
}

export function buildIssuancePaymentTransaction(
  input: ClassicTransactionInput & {
    assetCode: string;
    distributorAccount: string;
    amount: string;
  },
): Transaction {
  return builder(input)
    .addOperation(
      Operation.payment({
        destination: input.distributorAccount,
        asset: new Asset(input.assetCode, input.sourceAccount),
        amount: input.amount,
      }),
    )
    .build();
}

export function precomputedHash(transaction: Transaction): string {
  return transaction.hash().toString("hex");
}
