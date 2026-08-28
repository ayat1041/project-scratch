'use client';

import { Plus, Trash2 } from 'lucide-react';
import { TextField } from '@repo/ui/components/form/fields/TextField';
import { FieldArray } from '@repo/ui/components/form/FieldArray';
import { Button } from '@repo/ui/components/ui/button';
import { OgImageUploadField } from '@/components/seo/OgImageUploadField';
import type { SeoSettingsFormValues } from '../../types/domain';

export const OrganizationSection = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Rendered as organization structured data (JSON-LD) on every public page.
      </p>
      <TextField<SeoSettingsFormValues> name="orgName" label="Organization name" />
      <OgImageUploadField<SeoSettingsFormValues>
        name="orgLogoUrl"
        label="Organization logo"
        folder="content/seo/org"
      />

      <FieldArray<SeoSettingsFormValues> name="orgSameAs">
        {({ fields, append, remove }) => (
          <div className="space-y-2">
            <span className="text-sm font-medium">Social profile URLs (sameAs)</span>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <TextField<SeoSettingsFormValues>
                  name={`orgSameAs.${index}.url`}
                  placeholder="https://twitter.com/yourbrand"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ url: '' })}
            >
              <Plus className="h-4 w-4" />
              Add profile URL
            </Button>
          </div>
        )}
      </FieldArray>
    </div>
  );
};

OrganizationSection.displayName = 'OrganizationSection';
