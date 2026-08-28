import { getAllRolesForUserForm, getUserDetail } from '../../services/users-service';
import EditUserForm from './EditUserForm';

interface UserDetailPresenterProps {
  id: string;
}

export default async function UserDetailPresenter({ id }: UserDetailPresenterProps) {
  const [user, allRoles] = await Promise.all([getUserDetail(id), getAllRolesForUserForm()]);
  return <EditUserForm user={user} allRoles={allRoles} />;
}
