import React from "react";
import { Image } from "@wix/design-system";

import InlineLogo from "../../../../assets/mkp-logo.svg";

interface LogoProps {
  alt?: string;
  width?: string;
  height?: string;
}

const WIX_MARKET_PUSH_APPS_URL =
  "https://www.wix.com/app-market/developer/marketpushapps";

const MiniLogo: React.FC<LogoProps> = ({
  alt = "MarketPush Apps Inline Logo",
  width = "120px",
  height = "auto",
}) => {
  const visitWixMarketPushApps = () => {
    window.open(WIX_MARKET_PUSH_APPS_URL, "_blank", "noopener");
  };
  return (
    <Image
      src={
        "https://mkp-prod.nyc3.cdn.digitaloceanspaces.com/ai-packshots/mkp-logo.svg"
      }
      alt={alt}
      width={width}
      height={height}
      onClick={visitWixMarketPushApps}
      className="mkp-logo"
      transparent={true}
      borderRadius={0}
    />
  );
};

export default MiniLogo;
