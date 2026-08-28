import { listSiteSeoSettingsVersions } from '../services';
import { VersionHistoryList } from './VersionHistoryList';

export default async function SeoSettingsHistoryPresenter() {
  const { data } = await listSiteSeoSettingsVersions(20, 0);
  return <VersionHistoryList initialVersions={data} />;
}
