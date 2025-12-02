import { useCallback, useState } from "react";

// Define the return type of the hook
interface UseHttpReturn<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  sendRequest: (data?: any) => Promise<void>;
  clearData?: () => void;
  setData: (value: T) => void;
}

// Hook for making POST requests
export default function usePost<T>(
  postFn: (data: any) => Promise<T>,
  initialData: any = null,
  initialLoading: boolean = false
): UseHttpReturn<T> {
  const [data, setData] = useState<T>(initialData); // Local state
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = useCallback(
    async function sendRequest(postData: any) {
      setIsLoading(true);
      setError(null); // Reset error before sending a new request
      try {
        const resData = await postFn(postData);
        setData(resData); // Set the data using the correct state management
      } catch (err) {
        setError((err as Error).message || "Something went wrong!");
        setIsLoading(false);
        throw err;
      }
      setIsLoading(false);
    },
    [postFn]
  );

  function clearData() {
    setData(initialData); // Reset to initial data
  }

  return {
    data, // Return the correct data
    isLoading, // Loading state
    error, // Error state
    sendRequest, // Function to trigger the request
    clearData, // Function to clear/reset data
    setData, // Allow external setting of data
  };
}
