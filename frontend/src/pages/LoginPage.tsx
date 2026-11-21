import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AppleIcon,
  ArrowLeft01Icon,
  Facebook01Icon,
  GoogleIcon,
  Login01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import type { Location } from 'react-router';
import { useAuth } from '@/auth/authContext';
import { hedgieImage } from '@/components/coach/hedgie';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/config/axios';

/** Shown for show only: real sign-in is out of scope for the hackathon. */
const OAUTH_PROVIDERS: ReadonlyArray<{ readonly name: string; readonly icon: IconSvgElement }> = [
  { name: 'Google', icon: GoogleIcon },
  { name: 'Apple', icon: AppleIcon },
  { name: 'Facebook', icon: Facebook01Icon },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  readonly username?: string;
  readonly email?: string;
}

function validate(username: string, email: string): FormErrors {
  return {
    username: username.trim() ? undefined : 'Enter a username.',
    email: EMAIL_PATTERN.test(email.trim()) ? undefined : 'Enter a valid email address.',
  };
}

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: Location } | null)?.from;
  const redirectTo = from ? `${from.pathname}${from.search}${from.hash}` : '/';

  const [showGuestForm, setShowGuestForm] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const nextErrors = validate(username, email);
    setErrors(nextErrors);
    setServerError(null);
    if (nextErrors.username || nextErrors.email) return;

    setPending(true);
    try {
      // On success `user` is set and the redirect above takes over.
      await login({ username, email });
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.status === 400
          ? error.message
          : "We couldn't sign you in. Check that the server is running and try again.",
      );
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) navigate('/', { replace: true }); }}>
      <DialogContent
        overlayClassName="bg-black/50 backdrop-blur-md duration-300 supports-backdrop-filter:backdrop-blur-md"
        className="max-w-[calc(100%-2rem)] gap-6 p-8 duration-300 ease-out data-open:slide-in-from-bottom-6 data-closed:slide-out-to-bottom-4 sm:max-w-sm"
      >
        <DialogHeader className="items-center text-center">
          <img src={hedgieImage('greeting')} alt="" className="mb-2 size-20 animate-in zoom-in-50 duration-500" />
          <DialogTitle>Welcome to HedgeFlex</DialogTitle>
          <DialogDescription>
            Learn investing, practice with virtual money and build confidence with Hedgie.
          </DialogDescription>
        </DialogHeader>

        <div>
          {showGuestForm ? (
            <form noValidate onSubmit={handleSubmit}>
              <FieldGroup>
                <Field data-invalid={!!errors.username || undefined}>
                  <FieldLabel htmlFor="login-username">Username</FieldLabel>
                  <Input
                    id="login-username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    placeholder="e.g. Ada"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    aria-invalid={!!errors.username || undefined}
                    aria-describedby={errors.username ? 'login-username-error' : undefined}
                  />
                  {errors.username && (
                    <FieldError id="login-username-error">{errors.username}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.email || undefined}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ada@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={!!errors.email || undefined}
                    aria-describedby={errors.email ? 'login-email-error' : 'login-email-hint'}
                  />
                  {errors.email ? (
                    <FieldError id="login-email-error">{errors.email}</FieldError>
                  ) : (
                    <FieldDescription id="login-email-hint">
                      Used only to tell learners apart. No password, no emails sent.
                    </FieldDescription>
                  )}
                </Field>

                {serverError && (
                  <Alert variant="destructive">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}

                <Field>
                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <HugeiconsIcon icon={Login01Icon} strokeWidth={2} data-icon="inline-start" />
                    )}
                    {pending ? 'Signing in…' : 'Start learning'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    disabled={pending}
                    onClick={() => {
                      setShowGuestForm(false);
                      setErrors({});
                      setServerError(null);
                    }}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                    Back
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          ) : (
            <FieldGroup className="[&_[data-slot=field-separator-content]]:bg-popover">
              <div className="flex flex-col gap-2">
                {OAUTH_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.name}
                    variant="outline"
                    className="w-full"
                    disabled
                    aria-describedby="login-oauth-note"
                  >
                    <HugeiconsIcon icon={provider.icon} strokeWidth={2} data-icon="inline-start" />
                    Continue with {provider.name}
                  </Button>
                ))}
                <p id="login-oauth-note" className="flex justify-center">
                  <Badge variant="secondary">Coming soon</Badge>
                </p>
              </div>

              <FieldSeparator>or</FieldSeparator>

              <Button className="w-full" onClick={() => setShowGuestForm(true)}>
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} data-icon="inline-start" />
                Continue as guest
              </Button>
            </FieldGroup>
          )}
        </div>

        <DialogFooter className="justify-center sm:justify-center">
          <p className="text-center text-xs text-muted-foreground">
            Demo login, not real authentication. Lessons and markets are fictional; personal planning entries last only for this session.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
