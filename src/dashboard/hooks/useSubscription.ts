import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { SubscriptionResponse } from "../../interfaces/custom/subscription";
import * as subscriptionApi from "../services/api/subscription";
import { subscriptionState } from "../services/state/subscriptionState";

export const QUERY_SUBSCRIPTION = "querySubscription";

export const useSubscription = () => {
  const setSubscription = useSetRecoilState(subscriptionState);
  const subscription = useRecoilValue(subscriptionState);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch and update Recoil state
  const { data, isLoading, error, refetch } = useQuery<SubscriptionResponse>({
    queryKey: [QUERY_SUBSCRIPTION],
    queryFn: () => subscriptionApi.getSubscription(),
    onSuccess: (data: SubscriptionResponse) => {
      if (isMounted.current) setSubscription(data);
    },
    onError: () => {
      if (isMounted.current) setSubscription(null);
    },
  });

  return {
    subscription: data || subscription,
    isLoading,
    error,
    refetch,
  };
};
