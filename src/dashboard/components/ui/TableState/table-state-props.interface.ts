export interface TableStateProps {
  stateType?: "empty" | "error" | "loading" | "noSearchResults";
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  intercomMessage?: string;
  intercomButtonLabel?: string;
  customActions?: React.ReactNode;
  innerActionFunction?: () => void;
}
