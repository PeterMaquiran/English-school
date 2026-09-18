import { LoginForm } from './components/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted">
        English School
      </p>
      <h1 className="mt-3 text-[34px] font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-[15px] text-muted">
        Use your school email and password.
      </p>
      <div className="mt-8 rounded-[22px] bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-line">
        <LoginForm />
      </div>
    </main>
  );
}
