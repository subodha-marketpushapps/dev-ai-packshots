import React from "react";
import { useTranslation } from "react-i18next";
import { SkeletonLine, Tabs, Box } from "@wix/design-system";
import { ROUTES } from "../../../routes";

import { activeRouteIdState } from "../../../services/state";
import { useRecoilState } from "recoil";

type TabNavigatorProps = {
  size?: "small" | "medium";
};

const TabNavigator: React.FC<TabNavigatorProps> = ({ size = "medium" }) => {
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] = useRecoilState(activeRouteIdState);

  const filteredTabs = ROUTES.filter((tab) => tab.id !== 0);
  const items = filteredTabs.map((item) => {
    return { id: item.id, title: t(item.titleKey, {defaultValue: item.titleKey}) };
  });

  const onTabChange = (tabId: number) => {
    setActiveTabId(tabId); // Update the activeRouteIdState here
  };

  const isLoading = activeTabId == 0;
  if (isLoading) {
    const menuItemCount = items.length ?? 0;
    return (
      <Box
        gap={4}
        height={60}
        verticalAlign="middle"
        borderBottom="1px solid #DFE5EB"
      >
        {Array.from({ length: menuItemCount }).map((_, index) => (
          <SkeletonLine key={index} width={80} />
        ))}
      </Box>
    );
  }
  return (
    <Tabs
      hasDivider={true}
      alignment="start"
      size={size}
      items={items}
      type="compactSide"
      activeId={activeTabId}
      onClick={(tab) => {
        onTabChange(Number(tab.id)); // On tab change, update the Recoil state
      }}
    />
  );
};

export default TabNavigator;
