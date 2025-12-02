export const encodeBase64 = (str: string): string => {
  return encodeURIComponent(btoa(str));
};

export const decodeBase64 = (str: string) => {
  return atob(str);
};
