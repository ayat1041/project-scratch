import { getDraftSiteSeoSettings } from '../services';
import { SeoSettingsForm } from './SeoSettingsForm';

export default async function SeoSettingsPresenter() {
  const { data, hasUnsavedDraft } = await getDraftSiteSeoSettings();
  return <SeoSettingsForm initialData={data} hasUnsavedDraft={hasUnsavedDraft} />;
}
