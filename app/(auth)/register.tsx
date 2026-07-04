import { Redirect } from "expo-router";

// The login screen now hosts both Login and Register (tabbed), so any old
// /register links just forward there.
export default function Register() {
  return <Redirect href="/login" />;
}
