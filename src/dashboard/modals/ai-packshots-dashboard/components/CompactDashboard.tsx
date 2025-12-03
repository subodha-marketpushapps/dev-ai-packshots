import React, { useState, useEffect, useCallback } from "react";

import { useRecoilState } from "recoil";
import LogRocket from "logrocket";
import { useTranslation } from "react-i18next";

import { Box, Button, Tooltip, Page, IconButton } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";


import {
    useWixData,
    WixDataProvider,
} from "../../../services/providers/WixDataProvider";

import {
    APP_NAME,
    APP_ID,
    LOGROCKET_APP_ID,
    HELP_CENTER_URL,
    _DEV,
} from ".././../../../constants";

import { useIntercom } from "react-use-intercom";
import { useBaseModal } from "../../../services/providers/BaseModalProvider";
import { UserInstanceProvider } from "../../../services/providers/UserInstanceProvider";
import { dashboard } from '@wix/dashboard';

import { settingsState, activeRouteIdState } from "../../../services/state";
import { useSettings } from "../../../hooks/useSettings";
import AppRouter from "../../../routes";
import PageLayout from "../../../components/common/PageLayout";
import TabNavigator from "../../../components/common/TabNavigator";
import { ProductModalSelector } from "../../../components/dev";

import {
    EmptyStateError,
    EmptyStateLoading,
} from "../../../components/ui/PageLoadingStatus";

import "../../../styles/global.scss";
import FullScreenLoader from "../../../components/common/PageLayout/ModalFSLoader";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { useSubscription } from "../../../hooks/useSubscription";
import SubscriptionInfo from "../../../components/common/SubscriptionInfo/SubscriptionInfo";

function PageContent() {
    // Fetch subscription data on first load
    useSubscription();
    const { t } = useTranslation();

    // console.log("Main Page");

    const { boot } = useIntercom();
    const [, setActiveRouteId] = useRecoilState(activeRouteIdState);
    const wixSiteData = useWixData().wixSiteData;

    const [_, setLocalSettings] = useRecoilState(settingsState);
    const { getSettings } = useSettings();
    const {
        data: settings,
        isLoading: isSettingsFetching,
        error: settingsFetchError,
        refetch: refreshFetchSettings,
    } = getSettings();

    // Sync fetched settings to local Recoil state
    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings, setLocalSettings]);

    const [isPageReady, setIsPageReady] = useState(false);

    const isDataLoaded = !isSettingsFetching;
    const isDataError = settingsFetchError;

    useEffect(() => {
        if (isDataLoaded && !isDataError) {
            initialIntercomBoot();
            logRocketIdentify();
            checkAndSwitchTab();
        }
    }, [isSettingsFetching, settingsFetchError]);

    useEffect(() => {
        if (isDataError && wixSiteData) {
            initialIntercomBoot();
            logRocketIdentify();
        }
    }, [settingsFetchError, wixSiteData]);

    const initialIntercomBoot = useCallback(() => {
        if (_DEV) return;
        boot({
            name:
                wixSiteData?.siteDisplayName ??
                settings?.businessName ??
                t('modals.aiPackshotsDashboard.unknownUser', {defaultValue: "AI Product Images(Unknown user)"}),
            email: settings?.email || wixSiteData?.email,
            verticalPadding: 52,
            customAttributes: {
                app: APP_NAME,
                user_id: wixSiteData?.instanceId,
                instance_id: wixSiteData?.instanceId,
                business_name: settings?.businessName ?? wixSiteData?.siteDisplayName,
                website_url: wixSiteData?.siteUrl,
                subscription_plan: wixSiteData?.subscriptionPlan ?? "Basic",
            },
        });
    }, [boot, settings, wixSiteData]);

    const logRocketIdentify = useCallback(() => {
        if (_DEV) return;
        LogRocket.init(LOGROCKET_APP_ID);
        const isUserInstanceAvailable = wixSiteData?.instanceId;
        if (isUserInstanceAvailable) {
            LogRocket.identify(APP_ID, {
                name: wixSiteData?.siteDisplayName ?? settings?.businessName,
                email: settings?.email || wixSiteData?.email,
                app: APP_NAME,
                user_id: wixSiteData?.instanceId,
                instance_id: wixSiteData?.instanceId,
                business_name: settings?.businessName ?? wixSiteData?.siteDisplayName,
                website_url: wixSiteData?.siteUrl,
                subscription_plan: wixSiteData?.subscriptionPlan ?? "Basic",
            });
        } else {
            console.error(`${APP_NAME} - User Instance ID not available`);
        }
    }, [wixSiteData, settings]);

    function checkAndSwitchTab() {
        // const { discountTemplatesAvailable } = settings || {};
        const isFirstTime = true;
        setActiveRouteId(isFirstTime ? 2 : 1);
        setIsPageReady(true);
    }

    return (
        <>
            {!isDataLoaded && <EmptyStateLoading loadingText="" />}
            {isDataLoaded && isDataError && (
                <EmptyStateError
                    title={t('errors.settingsLoadError.title', {defaultValue: "We couldn't load the Settings data"})}
                    subtitle={t('errors.settingsLoadError.subtitle', {defaultValue: "Looks like there was a technical issue on our end. Wait a few minutes and try again."})}
                    refreshActions={refreshFetchSettings}
                />
            )}
            {isDataLoaded && !isDataError && isPageReady && <AppRouter />}
        </>
    );
}

function MainPage() {
    // console.log("Main Page");

    const baseModals = useBaseModal();
    const photoStudio = usePhotoStudio();

    function openHelpCenter() {
        window.open(HELP_CENTER_URL, "_blank", "noopener");
    }

    function openDashboardModal() {
        dashboard.openModal('ec9ae22f-52e5-4964-b99c-e144cfd80df2');
    }

    return (
        <PageLayout
            // title="AI Product Images"
            // subtitle="Elevate Your Product Visuals Using AI-Driven Image Enhancement."
            //     actionBar={
            //         <Box gap={2}>
            //             <SubscriptionInfo />
            //             {/* <Tooltip content="Open support center">
            //     <IconButton skin="inverted" onClick={openHelpCenter}>
            //       <Icons.Help />
            //     </IconButton>
            //   </Tooltip> */}
            //             {/* <Button
            //     prefixIcon={<Icons.Sparkles />}
            //     onClick={() => photoStudio.openPhotoStudio("general")}
            //     skin="ai"
            //   >
            //     Photo Studio
            //   </Button> */}
            //         </Box>
            //     }
            showMiniLogo={false}
            pageTail={<TabNavigator />}
        >
            <Page.Content>
                <WixDataProvider>
                    <UserInstanceProvider>
                        <PageContent />
                        <FullScreenLoader />
                    </UserInstanceProvider>
                </WixDataProvider>
            </Page.Content>
        </PageLayout>
    );
}

export default MainPage;
