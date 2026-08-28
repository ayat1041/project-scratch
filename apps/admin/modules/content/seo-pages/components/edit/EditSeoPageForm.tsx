'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericForm } from '@repo/ui/components/form/GenericForm';
import { TextField } from '@repo/ui/components/form/fields/TextField';
import { TextareaField } from '@repo/ui/components/form/fields/TextareaField';
import { SwitchField } from '@repo/ui/components/form/fields/SwitchField';
import { SubmitButton } from '@repo/ui/components/form/fields/SubmitButton';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Separator } from '@repo/ui/components/ui/separator';
import { OgImageUploadField } from '@/components/seo/OgImageUploadField';
import type { SeoPageDetailResponseType } from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';
import { SeoPageFormSchema, SeoPageFormValues, toFormValues, toPayload } from '../../types/domain';
import { handlePublishSeoPage, handleSaveSeoPageDraft } from '../../handlers';

interface EditSeoPageFormProps {
  page: SeoPageDetailResponseType;
}

export const EditSeoPageForm = ({ page }: EditSeoPageFormProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const onSaveDraft = async (values: SeoPageFormValues) => {
    setIsSaving(true);
    try {
      await handleSaveSeoPageDraft(page.id, toPayload(values));
      router.refresh();
    } catch {
      // handler already surfaced a toast
    } finally {
      setIsSaving(false);
    }
  };

  const onPublish = async () => {
    setIsPublishing(true);
    try {
      await handlePublishSeoPage(page.id);
      router.refresh();
    } catch {
      // handler already surfaced a toast
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 text-sm">{page.path}</code>
        {page.published && <Badge>Published — v{page.published.versionNumber}</Badge>}
        {page.draft && <Badge variant="outline">Unpublished draft</Badge>}
      </div>

      <GenericForm
        schema={SeoPageFormSchema}
        initialValues={toFormValues(page.draft ?? page.published)}
        onSubmit={onSaveDraft}
        className="space-y-6"
      >
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Meta</h3>
              <TextField<SeoPageFormValues> name="title" label="Title" />
              <TextareaField<SeoPageFormValues>
                name="metaDescription"
                label="Meta description"
                showCount
                maxLength={300}
              />
              <TextField<SeoPageFormValues> name="metaKeywords" label="Meta keywords" />
              <TextField<SeoPageFormValues> name="canonicalUrl" label="Canonical URL" />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Social</h3>
              <TextField<SeoPageFormValues> name="ogTitle" label="Open Graph title" />
              <TextareaField<SeoPageFormValues> name="ogDescription" label="Open Graph description" />
              <OgImageUploadField<SeoPageFormValues>
                name="ogImageUrl"
                label="Open Graph image"
                folder="content/seo/pages"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Indexing</h3>
              <div className="flex flex-wrap gap-6">
                <SwitchField<SeoPageFormValues> name="noindex" label="No-index this page" />
                <SwitchField<SeoPageFormValues> name="nofollow" label="No-follow links on this page" />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Structured data (JSON-LD)</h3>
              <TextField<SeoPageFormValues>
                name="jsonLdType"
                label="Type (schema.org @type)"
                placeholder="Article"
              />
              <TextareaField<SeoPageFormValues>
                name="jsonLdDataJson"
                label="Data (JSON)"
                resizable
                inputClassName="min-h-32 font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 border-t pt-6">
          <SubmitButton width="auto" label="Save draft" loadingLabel="Saving..." isLoading={isSaving} />
          <Button type="button" onClick={onPublish} disabled={isPublishing || !page.draft}>
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </GenericForm>
    </div>
  );
};

EditSeoPageForm.displayName = 'EditSeoPageForm';
