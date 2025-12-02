import React from "react";
import { Box } from "@wix/design-system";

const EmptyTableTitle: React.FC = () => {
  return (
    <Box
      height={40}
      borderTop="1px solid #DFE5EB"
      borderBottom="1px solid #DFE5EB"
      borderRadius={0}
      background={"#F7F8F9"}
    ></Box>
  );
};

export default EmptyTableTitle;
