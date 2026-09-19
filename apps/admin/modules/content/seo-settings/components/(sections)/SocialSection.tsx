import { TextField } from '@repo/ui/components/form/fields/TextField';
import { TextareaField } from '@repo/ui/components/form/fields/TextareaField';
import { SelectField } from '@repo/ui/components/form/fields/SelectField';
import { OgImageUploadField } from '@/components/seo/OgImageUploadField';
import type { SeoSettingsFormValues } from '../../types/domain';

const OG_TYPE_OPTIONS = [
  { value: 'website', text: 'Website' },
  { value: 'article', text: 'Article' },
  { value: 'product', text: 'Product' },
];

const TWITTER_CARD_OPTIONS = [
  { value: 'summary', text: 'Summary' },
  { value: 'summary_large_image', text: 'Summary with large image' },
];

export const SocialSection = () => {
  return (
    <div className="space-y-4">
      <OgImageUploadField<SeoSettingsFormValues>
        name="ogImageUrl"
        label="Default Open Graph image"
        folder="content/seo/og-images"
      />
      <TextField<SeoSettingsFormValues> name="ogTitle" label="Open Graph title" />
      <TextareaField<SeoSettingsFormValues> name="ogDescription" label="Open Graph description" />
      <SelectField<SeoSettingsFormValues>
        name="ogType"
        label="Open Graph type"
        options={OG_TYPE_OPTIONS}
      />
      <SelectField<SeoSettingsFormValues>
        name="twitterCard"
        label="Twitter card type"
        options={TWITTER_CARD_OPTIONS}
      />
      <TextField<SeoSettingsFormValues>
        name="twitterHandle"
        label="Twitter handle"
        placeholder="@yourbrand"
      />
      <OgImageUploadField<SeoSettingsFormValues>
        name="faviconUrl"
        label="Favicon"
        folder="content/seo/favicons"
      />
    </div>
  );
};

SocialSection.displayName = 'SocialSection';
