import { getSeoPageDetail } from '../../services';
import { EditSeoPageForm } from './EditSeoPageForm';

interface EditSeoPagePresenterProps {
  id: string;
}

export default async function EditSeoPagePresenter({ id }: EditSeoPagePresenterProps) {
  const page = await getSeoPageDetail(id);
  return <EditSeoPageForm page={page} />;
}
