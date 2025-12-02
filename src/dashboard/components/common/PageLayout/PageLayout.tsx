import React, { useState } from "react";
import { Page } from "@wix/design-system";
import SectionFooter from "../SectionFooter/SectionFooter";

import MiniLogo from "./MiniLogo";

interface PageLayoutProps {
  title?: string | undefined;
  subtitle?: string;
  children: React.ReactNode;
  actionBar?: React.ReactNode;
  pageTail?: React.ReactNode;
  showMiniLogo?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  children,
  actionBar,
  pageTail,
  showMiniLogo = true,
}) => {
  const pageRef = React.createRef<Page>();
  const [isMiniHeader, setIsMiniHeader] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onScroll = (htmlElement: any) => {
    // Only handle scroll effect if we're showing MiniLogo
    if (!showMiniLogo) return;

    let scrollY = htmlElement?.target?.scrollTop;
    if (scrollY == undefined || scrollY == null) scrollY = 79;
    setIsMiniHeader(scrollY > 78);
  };

  return (
    <>
      <Page
        ref={pageRef}
        height="100vh"
        className="mkp-page"
        scrollProps={showMiniLogo ? { onScrollChanged: onScroll } : undefined}
      >
        <Page.Header
          title={title}
          subtitle={subtitle}
          actionsBar={actionBar}
          breadcrumbs={showMiniLogo && !isMiniHeader ? <MiniLogo /> : ""}
        />
        {pageTail && React.isValidElement(pageTail) && (
          <Page.Tail>{pageTail}</Page.Tail>
        )}
        <Page.Content>{children}</Page.Content>
      </Page>
      <SectionFooter />
    </>
  );
};

export default PageLayout;
