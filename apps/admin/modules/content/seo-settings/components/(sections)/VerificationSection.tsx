import { TextField } from '@repo/ui/components/form/fields/TextField';
import type { SeoSettingsFormValues } from '../../types/domain';

export const VerificationSection = () => {
  return (
    <div className="space-y-4">
      <TextField<SeoSettingsFormValues>
        name="googleSiteVerification"
        label="Google Search Console verification code"
      />
      <TextField<SeoSettingsFormValues>
        name="bingSiteVerification"
        label="Bing Webmaster verification code"
      />
      <TextField<SeoSettingsFormValues>
        name="googleAnalyticsId"
        label="Google Analytics measurement ID"
        placeholder="G-XXXXXXXXXX"
      />
    </div>
  );
};

VerificationSection.displayName = 'VerificationSection';
