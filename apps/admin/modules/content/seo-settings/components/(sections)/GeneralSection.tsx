import { TextField } from '@repo/ui/components/form/fields/TextField';
import { TextareaField } from '@repo/ui/components/form/fields/TextareaField';
import type { SeoSettingsFormValues } from '../../types/domain';

export const GeneralSection = () => {
  return (
    <div className="space-y-4">
      <TextField<SeoSettingsFormValues>
        name="titleTemplate"
        label="Title template"
        placeholder="%s | My Site"
      />
      <TextareaField<SeoSettingsFormValues>
        name="metaDescription"
        label="Meta description"
        placeholder="A short description shown in search results"
        showCount
        maxLength={300}
      />
      <TextField<SeoSettingsFormValues>
        name="metaKeywords"
        label="Meta keywords"
        placeholder="comma, separated, keywords"
      />
      <TextField<SeoSettingsFormValues>
        name="canonicalBaseUrl"
        label="Canonical base URL"
        placeholder="https://example.com"
      />
    </div>
  );
};

GeneralSection.displayName = 'GeneralSection';
