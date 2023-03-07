import CosmosBase from "./cosmosBase";

class Axelar extends CosmosBase {
  lcd: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator: string;
  validatorOperatorAddressPrefix: string;
  constructor() {
    super();
    this.lcd = "https://lcd-axelar.whispernode.com:443";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.defaultGas = 100000;
    this.unbondingPeriod = 21;
    this.validatorOperatorAddressPrefix = "axelarvaloper";
    this.ledgerValidator = "";
    this.gas = {
      delegate: 190000,
      send: 87500,
      undelegate: 250000,
      redelegate: 300000,

      claimReward: 300000,
      claimRewardCompound: 400000,
    };
  }
}

export default Axelar;
