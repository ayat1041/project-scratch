'use client';

import { useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { SelectField } from '@repo/ui/components/form/fields/SelectField';
import { TextField } from '@repo/ui/components/form/fields/TextField';
import { TextareaField } from '@repo/ui/components/form/fields/TextareaField';
import { FieldArray } from '@repo/ui/components/form/FieldArray';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import type { SeoSettingsFormValues } from '../../types/domain';

const MODE_OPTIONS = [
  { value: 'structured', text: 'Structured (rule builder)' },
  { value: 'raw', text: 'Raw text' },
];

const CHANGE_FREQUENCY_OPTIONS = [
  { value: '', text: 'Not set' },
  { value: 'always', text: 'Always' },
  { value: 'hourly', text: 'Hourly' },
  { value: 'daily', text: 'Daily' },
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
  { value: 'yearly', text: 'Yearly' },
  { value: 'never', text: 'Never' },
];

export const RobotsSitemapSection = () => {
  const { watch } = useFormContext<SeoSettingsFormValues>();
  const robotsMode = watch('robotsMode');
  const sitemapMode = watch('sitemapMode');

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">robots.txt</h3>
        <SelectField<SeoSettingsFormValues>
          name="robotsMode"
          label="Mode"
          options={MODE_OPTIONS}
        />

        {robotsMode === 'raw' ? (
          <TextareaField<SeoSettingsFormValues>
            name="robotsRawContent"
            label="Raw robots.txt content"
            resizable
            inputClassName="min-h-40 font-mono text-xs"
          />
        ) : (
          <FieldArray<SeoSettingsFormValues> name="robotsRules">
            {({ fields, append, remove }) => (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2">
                      <TextField<SeoSettingsFormValues>
                        name={`robotsRules.${index}.userAgent`}
                        label="User agent"
                        placeholder="*"
                      />
                      <TextField<SeoSettingsFormValues>
                        name={`robotsRules.${index}.crawlDelay`}
                        label="Crawl delay (seconds)"
                        type="number"
                      />
                      <TextField<SeoSettingsFormValues>
                        name={`robotsRules.${index}.allow`}
                        label="Allow (comma-separated paths)"
                        placeholder="/"
                      />
                      <TextField<SeoSettingsFormValues>
                        name={`robotsRules.${index}.disallow`}
                        label="Disallow (comma-separated paths)"
                        placeholder="/admin, /dashboard"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove rule
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ userAgent: '*', allow: '', disallow: '', crawlDelay: '' })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add rule
                </Button>
              </div>
            )}
          </FieldArray>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">sitemap.xml</h3>
        <SelectField<SeoSettingsFormValues>
          name="sitemapMode"
          label="Mode"
          options={MODE_OPTIONS}
        />

        {sitemapMode === 'raw' ? (
          <TextareaField<SeoSettingsFormValues>
            name="sitemapRawContent"
            label="Raw sitemap.xml content"
            resizable
            inputClassName="min-h-40 font-mono text-xs"
          />
        ) : (
          <FieldArray<SeoSettingsFormValues> name="sitemapCustomUrls">
            {({ fields, append, remove }) => (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-3">
                      <TextField<SeoSettingsFormValues>
                        name={`sitemapCustomUrls.${index}.path`}
                        label="Path"
                        placeholder="/pricing"
                      />
                      <SelectField<SeoSettingsFormValues>
                        name={`sitemapCustomUrls.${index}.changeFrequency`}
                        label="Change frequency"
                        options={CHANGE_FREQUENCY_OPTIONS}
                      />
                      <TextField<SeoSettingsFormValues>
                        name={`sitemapCustomUrls.${index}.priority`}
                        label="Priority (0-1)"
                        type="number"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit text-destructive md:col-span-3"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove URL
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ path: '', changeFrequency: '', priority: '' })}
                >
                  <Plus className="h-4 w-4" />
                  Add URL
                </Button>
              </div>
            )}
          </FieldArray>
        )}
      </section>
    </div>
  );
};

RobotsSitemapSection.displayName = 'RobotsSitemapSection';
