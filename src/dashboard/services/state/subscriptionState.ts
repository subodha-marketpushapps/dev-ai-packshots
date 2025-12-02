import { atom } from "recoil";
import { SubscriptionResponse } from "../../../interfaces/custom/subscription";

export const subscriptionState = atom<SubscriptionResponse | null | undefined>({
  key: "subscriptionState",
  default: undefined,
});
