import React from "react";

import { Box, Text, TextButton } from "@wix/design-system";
import { Youtube, Languages, GetStarted } from "@wix/wix-ui-icons-common";

import classes from "./SectionFooter.module.scss";

const MKP_LINKS = [
  {
    label: "MKP Youtube Channel",
    url: "https://www.youtube.com/@marketpushapps/videos",
    icon: <Youtube />,
  },
  {
    label: "MKP Website",
    url: "https://www.marketpushapps.com/",
    icon: <Languages />,
  },
  {
    label: "More MKP Apps",
    url: "https://www.wix.com/app-market/developer/marketpushapps",
    icon: <GetStarted />,
  },
];

const SectionFooter = () => {
  const openExternalWebPage = (url: string) => {
    window.open(url, "_blank", "noopener");
  };
  return (
    <footer className={classes["footer"] + " flex-center-between gap-12"} style={{ zIndex: 9 }}>
      <Box gap="24px" className={classes["footer-content"]}>
        <Box gap="24px">
          {MKP_LINKS.map((link) => (
            <TextButton
              prefixIcon={link.icon}
              size="small"
              onClick={() => openExternalWebPage(link.url)}
              key={link.label}
            >
              {link.label}
            </TextButton>
          ))}
        </Box>
        <div className="container">
          <div className="footer__content">
            <Text className={classes["disabled-text"]}>
              © {new Date().getFullYear()} MarketPush Apps
            </Text>
          </div>
        </div>
      </Box>
    </footer>
  );
};

export default SectionFooter;
