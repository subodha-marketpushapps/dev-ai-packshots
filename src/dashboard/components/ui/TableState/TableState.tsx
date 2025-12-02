import React, { useCallback } from "react";
import { Image, Table, TextButton } from "@wix/design-system";
import { useIntercom } from "react-use-intercom";
import classes from "./TableState.module.scss";

import imageStateError from "../../../../assets/images/image_state-error.svg";
import imageStateNoData from "../../../../assets/images/image_state-no-data.svg";
import imageStateNoSearchResults from "../../../../assets/images/image_state-no-search-result.svg";
import { TableStateProps } from "./table-state-props.interface";

import LoadingTableBody from "../TableSkeleton/LoadingTableBody";

const TableState: React.FC<TableStateProps> = ({
  stateType,
  title,
  subtitle,
  imageSrc,
  intercomMessage,
  intercomButtonLabel,
  customActions,
  innerActionFunction,
}) => {
  const { showNewMessage } = useIntercom();
  const openIntercomWithContent = useCallback(
    (message: string | undefined) => showNewMessage(message),
    [showNewMessage]
  );

  if (stateType === "loading") {
    return <LoadingTableBody />;
  }

  if (stateType === "error") {
    return (
      <Table.EmptyState
        title={title}
        subtitle={subtitle}
        className={classes["empty-state"]}
        image={
          <Image
            height={120}
            width={120}
            src={imageSrc ?? imageStateError}
            transparent
          />
        }
      >
        <TextButton onClick={() => openIntercomWithContent(intercomMessage)}>
          {intercomButtonLabel}
        </TextButton>
      </Table.EmptyState>
    );
  }

  if (stateType === "empty") {
    return (
      <Table.EmptyState
        title={title}
        subtitle={subtitle}
        image={
          <Image
            height={120}
            width={120}
            src={imageSrc ?? imageStateNoData}
            transparent
          />
        }
        className={classes["empty-state"]}
      >
        {customActions}
      </Table.EmptyState>
    );
  }

  if (stateType === "noSearchResults") {
    return (
      <Table.EmptyState
        title={title ?? "No search results"}
        subtitle={
          subtitle ??
          "No items match your search criteria. Try to search by another keyword"
        }
        image={
          <Image
            height={120}
            width={120}
            src={imageSrc ?? imageStateNoSearchResults}
            transparent
          />
        }
        className={classes["empty-state"]}
      >
        {customActions}
        <TextButton onClick={innerActionFunction}>Clear Search</TextButton>
      </Table.EmptyState>
    );
  }

  return null;
};

export default TableState;
