export const isMacOS = (): boolean => {
    return navigator.userAgent.includes("Macintosh") || navigator.userAgent.includes("Mac OS");
  };