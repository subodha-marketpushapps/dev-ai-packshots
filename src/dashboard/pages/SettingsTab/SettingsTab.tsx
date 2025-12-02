import React, { useState, useCallback, useEffect } from "react";
import { useRecoilState } from "recoil";
import { useTranslation } from "react-i18next";
import { dashboard } from "@wix/dashboard";
import {
  Page,
  Box,
  Cell,
  Layout,
  Card,
  FormField,
  Input,
  Radio,
  Button,
  Loader,
} from "@wix/design-system";

import * as Yup from "yup";

import { settingsState } from "../../services/state";

import RecommendedApps from "./RecommendedApps";
import { MkpSettings } from "../../../interfaces";

import usePost from "../../hooks/usePost";
import { updateSettings } from "../../services/api";

export default function SettingsTab() {
  const { t } = useTranslation();
  const [settings, setSettings] = useRecoilState(settingsState);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [statsEmailEnabled, setStatsEmailEnabled] = useState(
    settings.statsEmailEnabled === undefined ? true : settings.statsEmailEnabled
  );
  const [email, setEmail] = useState(settings.email ?? "");
  const [errors, setErrors] = useState<{
    email?: string;
  }>({});

  let userSchema = Yup.object({
    statsEmailEnabled: Yup.boolean(),
    email: Yup.string()
      .email(t('settingsTab.invalidEmailFormat', {defaultValue: "Invalid email format"}))
      .required(t('settingsTab.emailRequired', {defaultValue: "Email is required"})),
  });

  const {
    isLoading: isSettingsUpdating,
    error: settingsUpdateError,
    sendRequest: onUpdateSettings,
  } = usePost<Partial<MkpSettings>>(updateSettings);

  async function onSaveSettings() {
    try {
      await userSchema.validate(
        { email, statsEmailEnabled },
        { abortEarly: false }
      );
      setErrors({}); // Clear previous errors if validation passes
      setSettings({ ...settings, statsEmailEnabled, email });
      await onUpdateSettings({ statsEmailEnabled, email });

      dashboard.showToast({
        message: t('settingsTab.settingsSaved', {defaultValue: "Settings saved successfully!"}),
        type: "success",
      });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const validationErrors: { [key: string]: string } = {};
        err.inner.forEach((error) => {
          if (error.path) validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      }
    }
  }

  function clearUnsavedChanges() {
    setErrors({});
    setStatsEmailEnabled(
      settings.statsEmailEnabled === undefined
        ? true
        : settings.statsEmailEnabled
    );
    setEmail(settings.email ?? "");
    setUnsavedChanges(false);
  }

  const checkAndUpdateUnsavedChanges = useCallback(() => {
    const isSettingsChanged =
      email !== (settings.email ?? "") ||
      statsEmailEnabled !==
        (settings.statsEmailEnabled === undefined
          ? true
          : settings.statsEmailEnabled);
    setUnsavedChanges(isSettingsChanged);
  }, [settings, statsEmailEnabled, email]);

  useEffect(() => {
    checkAndUpdateUnsavedChanges();
  }, [settings, statsEmailEnabled, email, checkAndUpdateUnsavedChanges]);

  useEffect(() => {
    if (settingsUpdateError) {
      dashboard.showToast({
        message: t('settingsTab.settingsSaveFailed', {defaultValue: "Failed to save settings. Please try again."}),
        type: "error",
      });
    }
  }, [settingsUpdateError, t]);

  // Clear error when user starts typing
  useEffect(() => {
    if (errors.email && email) {
      setErrors({ ...errors, email: undefined });
    }
  }, [email]);

  return (
    <Cell>
      <Layout>
        <Cell>
          <Page.Section
            title={t('settingsTab.title', {defaultValue: "Settings"})}
            subtitle={t('settingsTab.subtitle', {defaultValue: "Add or change details registered in Quantity and Volume Discount app."})}
            actionsBar={
              <Box gap="12px">
                <Button
                  skin="inverted"
                  onClick={clearUnsavedChanges}
                  disabled={isSettingsUpdating || !unsavedChanges}
                >
                  {t('settingsTab.cancel', {defaultValue: "Cancel"})}
                </Button>
                <Button
                  onClick={() => onSaveSettings()}
                  disabled={isSettingsUpdating || !unsavedChanges}
                >
                  {isSettingsUpdating ? (
                    <Loader size="tiny" />
                  ) : (
                    t('settingsTab.saveSettings', {defaultValue: "Save Settings"})
                  )}
                </Button>
              </Box>
            }
          />
        </Cell>

        <Cell span={8}>
          <Layout>
            <Cell>
              <Card>
                <Card.Header title={t('settingsTab.notifications', {defaultValue: "Notifications"})}></Card.Header>
                <Card.Divider />
                <Card.Content>
                  <Layout>
                    <Cell span={8}>
                      <FormField label={t('settingsTab.receiveStatsEmails', {defaultValue: "Receive Stats and Conversion Emails"})}>
                        <Radio
                          checked={statsEmailEnabled}
                          onChange={() => setStatsEmailEnabled(true)}
                          label={t('settingsTab.onWeeklyBasis', {defaultValue: "On a Weekly Basis"})}
                        />
                        <Radio
                          checked={!statsEmailEnabled}
                          onChange={() => setStatsEmailEnabled(false)}
                          label={t('settingsTab.never', {defaultValue: "Never"})}
                        />
                      </FormField>
                    </Cell>
                    <Cell span={12}>
                      <Card.Divider />
                    </Cell>
                    <Cell span={8}>
                      <FormField
                        label={t('settingsTab.notificationEmail', {defaultValue: "Notification Email"})}
                        status={errors.email ? "error" : undefined}
                        statusMessage={errors.email}
                        required
                      >
                        <Input
                          placeholder={t('settingsTab.emailPlaceholder', {defaultValue: "sample@mail.com"})}
                          value={email}
                          onChange={(val) => setEmail(val.target.value)}
                        />
                      </FormField>
                    </Cell>
                  </Layout>
                </Card.Content>
              </Card>
            </Cell>
            <Cell>
              <RecommendedApps />
            </Cell>
          </Layout>
        </Cell>
      </Layout>
    </Cell>
  );
}
