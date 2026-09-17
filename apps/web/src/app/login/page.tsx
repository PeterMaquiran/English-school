import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Use your school email and password.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
