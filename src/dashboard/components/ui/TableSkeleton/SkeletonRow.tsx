import React from "react";
import { Box, SkeletonGroup, SkeletonLine } from "@wix/design-system";

import classes from "./Skeleton.module.scss";

interface SkeletonRowProps {
  numberOfCells?: number;
  isLastRow?: boolean;
  cellHeight?: number;
}

const SkeletonRow: React.FC<SkeletonRowProps> = ({
  numberOfCells = 5,
  isLastRow = false,
  cellHeight = 48,
}) => {
  return (
    <Box
      direction="horizontal"
      borderBottom={!isLastRow ? "1px solid #DFE5EB" : undefined}
      width="calc(100% - 24px)"
      paddingInline="12px"
    >
      {Array.from({ length: numberOfCells }).map((_, index) => (
        <Box
          flex={1}
          height={cellHeight}
          verticalAlign="middle"
          align="center"
          key={index}
          minHeight={cellHeight}
          paddingInline="12px"
        >
          <SkeletonGroup className={classes["group-width"]}>
            <SkeletonLine width="100%" />
          </SkeletonGroup>
        </Box>
      ))}
    </Box>
  );
};

export default SkeletonRow;
