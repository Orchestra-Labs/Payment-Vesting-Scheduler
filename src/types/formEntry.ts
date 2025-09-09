export interface VestingEntry {
  amount: string | number;
  denom: string;
  category: string;
}

export interface VestingRecipient {
  recipient: string;
  discord_id: string;
  entries: VestingEntry[];
}
