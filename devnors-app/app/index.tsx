import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth';

export default function Index() {
  const { isLoggedIn, userRole, needsRoleSelection } = useAuthStore();

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (needsRoleSelection) {
    return <Redirect href="/(auth)/select-role" />;
  }

  if (userRole === 'employer') {
    return <Redirect href="/(employer)/ai" />;
  }

  return <Redirect href="/(candidate)/ai" />;
}
