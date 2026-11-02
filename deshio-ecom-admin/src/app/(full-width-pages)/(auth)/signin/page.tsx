import AuthRedirect from "@/components/auth/AuthRedirect";
import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to the admin dashboard.",
};

export default function SignIn() {
  return (
    <>
      <AuthRedirect />
      <SignInForm />
    </>
  );
}
