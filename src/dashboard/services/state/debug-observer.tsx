import { useEffect, useRef } from "react";
import { useRecoilSnapshot } from "recoil";
import { echo } from "../../utils/logger";

function DebugObserver() {
  const snapshot = useRecoilSnapshot();
  const previousSnapshotRef = useRef(snapshot);

  useEffect(() => {
    const previousSnapshot = previousSnapshotRef.current;
    for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
      const prevLoadable = previousSnapshot.getLoadable(node);
      const currLoadable = snapshot.getLoadable(node);

      const state = {
        prevState: prevLoadable.contents,
        currentState: currLoadable.contents,
      };
      echo.log(echo.asGreen(`State Changed : ${node.key}`), state);
    }
    previousSnapshotRef.current = snapshot;
  }, [snapshot]);

  return null;
}

export default DebugObserver;
