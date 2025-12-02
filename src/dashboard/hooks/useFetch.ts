import { useCallback, useEffect, useState } from "react";
import { RecoilState, useRecoilState } from "recoil";

// Define the return type of the hook
interface UseHttpReturn<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  sendRequest: (data?: any) => Promise<void>;
  clearData: () => void;
  setData: (value: T) => void;
}

type FetchOperation = () => Promise<any>; // More generic return type

// Generic fetch hook for both Recoil and local state
function useHttp<T>(
  fetchFn: FetchOperation,
  initialData: T,
  state: T,
  setState: (value: T) => void // Function to set state, passed either from Recoil or useState
): UseHttpReturn<T> {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  function clearData() {
    setState(initialData); // Reset to initial data
  }

  const sendRequest = useCallback(
    async function sendRequest() {
      setIsLoading(true);
      setError(null); // Reset error before sending a new request
      try {
        const resData = await fetchFn();
        setState(resData); // Set the data using the correct state management
      } catch (err) {
        setError((err as Error).message || "Something went wrong!");
      }
      setIsLoading(false);
    },
    [fetchFn, setState]
  );

  useEffect(() => {
    sendRequest(); // Trigger initial fetch
  }, [sendRequest]);

  return {
    data: state, // Return the correct data
    isLoading, // Loading state
    error, // Error state
    sendRequest, // Function to trigger the request
    clearData, // Function to clear/reset data
    setData: setState, // Allow external setting of data
  };
}

// Hook for using Recoil state
export function useFetchRecoil<T>(
  fetchFn: FetchOperation,
  recoilStateAtom: RecoilState<T>
): UseHttpReturn<T> {
  const [data, setData] = useRecoilState<T>(recoilStateAtom); // Recoil state
  return useHttp(fetchFn, data, data, setData); // Use the generic hook
}

// Hook for using local state
export function useFetchLocal<T>(
  fetchFn: FetchOperation,
  initialData: T
): UseHttpReturn<T> {
  const [data, setData] = useState<T>(initialData); // Local state
  return useHttp(fetchFn, initialData, data, setData); // Use the generic hook
}
