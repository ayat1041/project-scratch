'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericForm, GenericFormRef } from '@repo/ui/components/form/GenericForm';
import { SubmitButton } from '@repo/ui/components/form/fields/SubmitButton';
import { Button } from '@repo/ui/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Badge } from '@repo/ui/components/ui/badge';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import type { SiteSeoSettingsVersionResponseType } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/response.schema';
import {
  SeoSettingsFormSchema,
  SeoSettingsFormValues,
  toFormValues,
  toPayload,
} from '../types/domain';
import { handlePublishSiteSeoSettings, handleSaveSiteSeoSettingsDraft } from '../handlers';
import { GeneralSection } from './(sections)/GeneralSection';
import { SocialSection } from './(sections)/SocialSection';
import { RobotsSitemapSection } from './(sections)/RobotsSitemapSection';
import { VerificationSection } from './(sections)/VerificationSection';
import { OrganizationSection } from './(sections)/OrganizationSection';

interface SeoSettingsFormProps {
  initialData: SiteSeoSettingsVersionResponseType | null;
  hasUnsavedDraft: boolean;
}

export const SeoSettingsForm = ({ initialData, hasUnsavedDraft }: SeoSettingsFormProps) => {
  const router = useRouter();
  const formRef = useRef<GenericFormRef<SeoSettingsFormValues>>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const onSaveDraft = async (values: SeoSettingsFormValues) => {
    setIsSaving(true);
    try {
      await handleSaveSiteSeoSettingsDraft(toPayload(values));
      router.refresh();
    } catch {
      // handler already surfaced a toast
    } finally {
      setIsSaving(false);
    }
  };

  const onPublish = async () => {
    const values = formRef.current?.getValues();
    if (!values) return;

    setIsPublishing(true);
    try {
      await handleSaveSiteSeoSettingsDraft(toPayload(values));
      await handlePublishSiteSeoSettings();
      router.refresh();
    } catch {
      // handler already surfaced a toast
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {initialData?.status === 'published' && !hasUnsavedDraft && (
            <Badge variant="secondary">Live — version {initialData.versionNumber}</Badge>
          )}
          {hasUnsavedDraft && <Badge variant="outline">Unpublished draft</Badge>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/content/seo-settings/history')}
        >
          Version history
        </Button>
      </div>

      <GenericForm
        ref={formRef}
        schema={SeoSettingsFormSchema}
        initialValues={toFormValues(initialData)}
        onSubmit={onSaveDraft}
        className="space-y-6"
      >
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="robots-sitemap">Robots &amp; Sitemap</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="p-6">
              <TabsContent value="general" className="mt-0">
                <GeneralSection />
              </TabsContent>
              <TabsContent value="social" className="mt-0">
                <SocialSection />
              </TabsContent>
              <TabsContent value="robots-sitemap" className="mt-0">
                <RobotsSitemapSection />
              </TabsContent>
              <TabsContent value="verification" className="mt-0">
                <VerificationSection />
              </TabsContent>
              <TabsContent value="organization" className="mt-0">
                <OrganizationSection />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        <div className="flex items-center gap-3 border-t pt-6">
          <SubmitButton
            width="auto"
            label="Save draft"
            loadingLabel="Saving..."
            isLoading={isSaving}
          />
          <Button type="button" onClick={onPublish} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </GenericForm>
    </div>
  );
};

SeoSettingsForm.displayName = 'SeoSettingsForm';
