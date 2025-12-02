import React from "react";
import { Box } from "@wix/design-system";

import classes from "./IFrameGuideJar.module.scss";

interface IFrameGuideJarProps {
  src: string;
  title: string;
}

const IFrameGuideJar: React.FC<IFrameGuideJarProps> = ({ src, title }) => {
  return (
    <Box className={classes["iframe-container"]}>
      <iframe
        src={src}
        title={title}
        width="100%"
        height="100%"
        className={classes["iframe-inner-wrapper"]}
        style={{ border: "none" }}
        allowFullScreen
      />
    </Box>
  );
};

export default IFrameGuideJar;
