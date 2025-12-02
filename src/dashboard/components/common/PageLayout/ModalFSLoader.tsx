import React from "react";
import { Box, Loader, Modal } from "@wix/design-system";
import { useRecoilValue } from "recoil";

import { fullLoaderState } from "../../../services/state";

function FullScreenLoader() {
  const visibility = useRecoilValue(fullLoaderState) as boolean;
  // console.log("🚀 ~ FullScreenLoader ~ visibility:", visibility);
  return (
    <Modal
      screen={"full"}
      isOpen={visibility}
      onRequestClose={() => {}}
      zIndex={100000}
    >
      <Box align="center" padding="30px">
        <Loader size="medium" />
      </Box>
    </Modal>
  );
}

export default FullScreenLoader;