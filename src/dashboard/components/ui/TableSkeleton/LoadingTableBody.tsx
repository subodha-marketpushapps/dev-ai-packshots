import React from "react";
import { Box } from "@wix/design-system";
import SkeletonRow from "./SkeletonRow";

interface LoadingTableBodyProps {
  numberOfRows?: number;
}

const LoadingTableBody: React.FC<LoadingTableBodyProps> = ({
  numberOfRows = 7,
}) => {
  return (
    <Box direction="vertical">
      {Array.from({ length: numberOfRows }).map((_, index) => (
        <SkeletonRow
          key={`skeleton-row-${index}`}
          isLastRow={index === numberOfRows - 1}
        />
      ))}
    </Box>
  );
};

export default LoadingTableBody;
