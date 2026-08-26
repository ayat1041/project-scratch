'use client';

import { useReducer, type ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  LucideCheck,
  LucideX,
} from 'lucide-react';

import { Input } from '@repo/ui/components/ui/input';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Button } from '@repo/ui/components/ui/button';
import PasswordGeneratorPanel from '@repo/ui/components/ui/password-generator-panel';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/ui/tooltip';
import { stripHtmlToText } from '@repo/utilities/security/dom-purify';
import {
  getPasswordRequirementStatus,
  isPasswordValid,
} from '@repo/utilities/validation/password-requirements';
import { cn } from '@repo/ui/lib/utils';
import { ROLES } from '@repo/constants';

import PasswordRequirementsChecklist from '@modules/auth/components/PasswordRequirementsChecklist';
import { SignupPayloadValidationSchema } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import {
  PERSONAL_EMAIL_DOMAINS,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@modules/auth/validations/schemas';
import { useUniquenessCheck } from '@modules/auth/hooks/useUniquenessCheck';
import {
  handleSignUp,
  handleCheckEmailUniqueness,
} from '@modules/auth/handlers/sign-up.handlers';

const nameSchema = SignupPayloadValidationSchema.shape.name;
const emailSchema = SignupPayloadValidationSchema.shape.email;

type FormState = {
  isSubmitting: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  agreedToTerms: boolean;
  generatorMode: 'hidden' | 'preview' | 'pinned';
  formData: { name: string; email: string; password: string; confirmPassword: string };
  touched: { name: boolean; email: boolean; password: boolean; confirmPassword: boolean };
  errors: { name: string; email: string; password: string; confirmPassword: string; submit: string };
};

type FormAction =
  | { type: 'SET_IS_SUBMITTING'; payload: boolean }
  | { type: 'SET_SHOW_PASSWORD'; payload: boolean }
  | { type: 'SET_SHOW_CONFIRM_PASSWORD'; payload: boolean }
  | { type: 'SET_AGREED_TO_TERMS'; payload: boolean }
  | { type: 'SET_GENERATOR_MODE'; payload: 'hidden' | 'preview' | 'pinned' }
  | { type: 'SET_FORM_DATA'; payload: Partial<FormState['formData']> }
  | { type: 'SET_TOUCHED'; payload: Partial<FormState['touched']> }
  | { type: 'SET_ERRORS'; payload: Partial<FormState['errors']> };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_IS_SUBMITTING': return { ...state, isSubmitting: action.payload };
    case 'SET_SHOW_PASSWORD': return { ...state, showPassword: action.payload };
    case 'SET_SHOW_CONFIRM_PASSWORD': return { ...state, showConfirmPassword: action.payload };
    case 'SET_AGREED_TO_TERMS': return { ...state, agreedToTerms: action.payload };
    case 'SET_GENERATOR_MODE': return { ...state, generatorMode: action.payload };
    case 'SET_FORM_DATA': return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_TOUCHED': return { ...state, touched: { ...state.touched, ...action.payload } };
    case 'SET_ERRORS': return { ...state, errors: { ...state.errors, ...action.payload } };
    default: return state;
  }
}

// -- Sub-components ----------------------------------------------------------

type UniquenessState = {
  isChecking: boolean;
  message: string | undefined;
  isUnique: boolean | null | undefined;
};

function NameInput({
  name,
  nameError,
  onNameChange,
  onNameBlur,
}: {
  name: string;
  nameError: string;
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onNameBlur: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-foreground block text-sm font-medium">
        Full name
      </label>
      <div className="relative">
        <User
          className={`absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 ${
            nameError ? 'text-warning' : 'text-muted-foreground'
          }`}
        />
        <Input
          type="text"
          name="name"
          placeholder="John Doe"
          value={name}
          onChange={onNameChange}
          onBlur={onNameBlur}
          className={cn('pl-12', nameError && 'border-warning focus-visible:ring-warning')}
          maxLength={140}
          required
        />
      </div>
      {nameError && <p className="text-warning text-xs">{nameError}</p>}
    </div>
  );
}

function EmailInputSection({
  email,
  emailError,
  emailDomain,
  isPersonalEmail,
  emailUniqueness,
  onEmailChange,
  onEmailBlur,
}: {
  email: string;
  emailError: string;
  emailDomain: string | undefined;
  isPersonalEmail: boolean;
  emailUniqueness: UniquenessState;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onEmailBlur: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-foreground block text-sm font-medium">
        Email
      </label>
      <div className="relative">
        <Mail
          className={`absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 ${
            emailError || isPersonalEmail ? 'text-warning' : 'text-muted-foreground'
          }`}
        />
        <Input
          type="email"
          name="email"
          placeholder="your@email.com"
          value={email}
          onChange={onEmailChange}
          onBlur={onEmailBlur}
          className={cn(
            'pl-12',
            (emailError || isPersonalEmail) && 'border-warning focus-visible:ring-warning'
          )}
          required
        />
      </div>
      {emailError && <p className="text-warning text-xs">{emailError}</p>}
      {!emailError && isPersonalEmail && (
        <p className="text-warning text-xs">
          You&apos;re using {emailDomain} email address. Would you like to use your work email
          instead?
        </p>
      )}
      {!emailError && emailUniqueness.isChecking && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking availability&hellip;
        </p>
      )}
      {!emailError && !emailUniqueness.isChecking && emailUniqueness.message && (
        <p
          className={cn(
            'flex items-center gap-1 text-xs',
            emailUniqueness.isUnique ? 'text-success' : 'text-warning'
          )}
        >
          {emailUniqueness.isUnique ? (
            <LucideCheck className="h-4 w-4" />
          ) : (
            <LucideX className="h-4 w-4" />
          )}
          {emailUniqueness.message}
        </p>
      )}
    </div>
  );
}

function PasswordChecklistDisplay({
  password,
  generatorMode,
  onPasswordGenerated,
  onPanelOpen,
  onPanelClose,
}: {
  password: string;
  generatorMode: 'hidden' | 'preview' | 'pinned';
  onPasswordGenerated: (pw: string) => void;
  onPanelOpen: () => void;
  onPanelClose: () => void;
}) {
  if (generatorMode === 'hidden') return null;
  return (
    <div onMouseDown={e => e.preventDefault()}>
      <PasswordGeneratorPanel
        onPasswordGenerated={onPasswordGenerated}
        inputPassword={password}
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        onPanelOpen={onPanelOpen}
        onPanelClose={onPanelClose}
        preventBlur
      />
      <PasswordRequirementsChecklist status={getPasswordRequirementStatus(password)} />
    </div>
  );
}

function PasswordInputSection({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  allPasswordRequirementsMet,
  generatorMode,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onPasswordFocus,
  onPasswordBlur,
  onPasswordGenerated,
  onPanelOpen,
  onPanelClose,
}: {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  allPasswordRequirementsMet: boolean;
  generatorMode: 'hidden' | 'preview' | 'pinned';
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onConfirmPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onPasswordFocus: () => void;
  onPasswordBlur: () => void;
  onPasswordGenerated: (pw: string) => void;
  onPanelOpen: () => void;
  onPanelClose: () => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="password" className="text-foreground block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={onPasswordChange}
            onFocus={onPasswordFocus}
            onBlur={onPasswordBlur}
            className="pr-12 pl-12"
            required
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showPassword ? 'Hide password' : 'Show password'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <PasswordChecklistDisplay
          password={password}
          generatorMode={generatorMode}
          onPasswordGenerated={onPasswordGenerated}
          onPanelOpen={onPanelOpen}
          onPanelClose={onPanelClose}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className={cn(
            'block text-sm font-medium',
            !allPasswordRequirementsMet && 'text-muted-foreground/50'
          )}
        >
          Confirm password
        </label>
        <div className="relative">
          <Lock
            className={`absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 ${
              !allPasswordRequirementsMet
                ? 'text-muted-foreground/50'
                : confirmPassword && password !== confirmPassword
                  ? 'text-warning'
                  : 'text-muted-foreground'
            }`}
          />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            disabled={!allPasswordRequirementsMet}
            className={cn(
              'pr-12 pl-12',
              confirmPassword && password !== confirmPassword
                ? 'border-warning focus-visible:ring-warning'
                : ''
            )}
            required
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleConfirmPassword}
                  disabled={!allPasswordRequirementsMet}
                  className={cn(
                    'absolute top-1/2 right-4 -translate-y-1/2 transition-colors',
                    !allPasswordRequirementsMet
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showConfirmPassword ? 'Hide password' : 'Show password'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-warning text-xs">*Passwords do not match</p>
        )}
      </div>
    </>
  );
}

function TermsCheckboxSection({
  agreedToTerms,
  onCheckedChange,
}: {
  agreedToTerms: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 pt-2">
      <Checkbox
        id="terms"
        checked={agreedToTerms}
        onCheckedChange={checked => onCheckedChange(checked === true)}
        className={agreedToTerms ? '' : 'border-primary'}
      />
      <label
        htmlFor="terms"
        className="text-muted-foreground cursor-pointer text-sm leading-tight"
      >
        I agree to the{' '}
        <Link
          href="https://www.example.com/legal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href="https://www.example.com/legal#privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </label>
    </div>
  );
}

// -- Component ---------------------------------------------------------------

export default function SignUpForm() {
  const router = useRouter();

  const [state, dispatch] = useReducer(formReducer, {
    isSubmitting: false,
    showPassword: false,
    showConfirmPassword: false,
    agreedToTerms: false,
    generatorMode: 'hidden',
    formData: { name: '', email: '', password: '', confirmPassword: '' },
    touched: { name: false, email: false, password: false, confirmPassword: false },
    errors: { name: '', email: '', password: '', confirmPassword: '', submit: '' },
  });

  const { isSubmitting, showPassword, showConfirmPassword, agreedToTerms, generatorMode, formData, touched, errors } = state;

  const validateEmail = useCallback(
    (v: string) => emailSchema.safeParse(v).success,
    []
  );

  const emailUniqueness = useUniquenessCheck(formData.email, {
    checkFn: handleCheckEmailUniqueness,
    validateFn: validateEmail,
  });

  const emailDomain = formData.email.split('@')[1]?.toLowerCase();
  const isPersonalEmail =
    emailDomain &&
    (PERSONAL_EMAIL_DOMAINS as readonly string[]).includes(emailDomain);

  const passwordLengthValid =
    formData.password.length >= PASSWORD_MIN_LENGTH &&
    formData.password.length <= PASSWORD_MAX_LENGTH;
  const allPasswordRequirementsMet = isPasswordValid(formData.password);
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword.length > 0;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = name === 'name' ? stripHtmlToText(value) : value;
    if (name === 'password' || name === 'confirmPassword') {
      sanitizedValue = sanitizedValue.replace(/\s/g, '');
    }

    dispatch({ type: 'SET_FORM_DATA', payload: { [name]: sanitizedValue } });

    if (name === 'name' && sanitizedValue.trim().length > 0) {
      const result = nameSchema.safeParse(sanitizedValue);
      dispatch({ type: 'SET_ERRORS', payload: {
        name: result.success ? '' : (result.error.issues[0]?.message ?? 'Invalid name'),
      }});
    } else if (name === 'name') {
      dispatch({ type: 'SET_ERRORS', payload: { name: '' } });
    }

    if (name === 'email' && sanitizedValue.trim().length > 0) {
      const result = emailSchema.safeParse(sanitizedValue);
      dispatch({ type: 'SET_ERRORS', payload: {
        email: result.success ? '' : (result.error.issues[0]?.message ?? 'Invalid email'),
      }});
    } else if (name === 'email') {
      dispatch({ type: 'SET_ERRORS', payload: { email: '' } });
    }
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\s/g, '');
    dispatch({ type: 'SET_FORM_DATA', payload: { confirmPassword: sanitized } });
    if (touched.confirmPassword && sanitized !== formData.password) {
      dispatch({ type: 'SET_ERRORS', payload: { confirmPassword: 'Passwords do not match' } });
    } else {
      dispatch({ type: 'SET_ERRORS', payload: { confirmPassword: '' } });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameResult = nameSchema.safeParse(formData.name);
    const emailResult = emailSchema.safeParse(formData.email);
    const nameError = nameResult.success
      ? ''
      : (nameResult.error.issues[0]?.message ?? 'Invalid name');
    const emailError = emailResult.success
      ? ''
      : (emailResult.error.issues[0]?.message ?? 'Invalid email');

    if (
      nameError ||
      emailError ||
      !passwordLengthValid ||
      !passwordsMatch ||
      !agreedToTerms
    ) {
      dispatch({ type: 'SET_ERRORS', payload: {
        name: nameError,
        email: emailError,
        submit: 'Please fix all errors before submitting',
      }});
      return;
    }

    dispatch({ type: 'SET_IS_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERRORS', payload: { submit: '' } });

    try {
      const result = await handleSignUp({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: ROLES.USER,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      let url = `/auth/please-verify?email=${encodeURIComponent(formData.email)}`;
      if (result.success && result.data?.verificationLink) {
        url += `&verificationLink=${encodeURIComponent(result.data.verificationLink)}`;
      }
      router.push(url);
    } catch (error) {
      const err = error as Error;
      let errorMessage = err.message || 'An error occurred during sign up';
      // Flatten structured backend validation messages: "field: msg, field: msg"
      if (errorMessage.includes(':') && errorMessage.includes(',')) {
        errorMessage = errorMessage
          .split(',')
          .map(s => s.split(':').slice(1).join(':').trim())
          .join(', ');
      }
      dispatch({ type: 'SET_ERRORS', payload: { submit: errorMessage } });
    } finally {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: false });
    }
  };

  return (
    <div className="mx-auto">
      <form
        onSubmit={handleSubmit}
        className="animate-slide-up space-y-4"
        style={{ animationDelay: '0.4s' }}
      >
        <NameInput
          name={formData.name}
          nameError={errors.name}
          onNameChange={handleInputChange}
          onNameBlur={() => dispatch({ type: 'SET_TOUCHED', payload: { name: true } })}
        />
        <EmailInputSection
          email={formData.email}
          emailError={errors.email}
          emailDomain={emailDomain}
          isPersonalEmail={!!isPersonalEmail}
          emailUniqueness={emailUniqueness}
          onEmailChange={handleInputChange}
          onEmailBlur={() => dispatch({ type: 'SET_TOUCHED', payload: { email: true } })}
        />
        <PasswordInputSection
          password={formData.password}
          confirmPassword={formData.confirmPassword}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          allPasswordRequirementsMet={allPasswordRequirementsMet}
          generatorMode={generatorMode}
          onPasswordChange={handleInputChange}
          onConfirmPasswordChange={handleConfirmPasswordChange}
          onTogglePassword={() => dispatch({ type: 'SET_SHOW_PASSWORD', payload: !showPassword })}
          onToggleConfirmPassword={() =>
            dispatch({ type: 'SET_SHOW_CONFIRM_PASSWORD', payload: !showConfirmPassword })
          }
          onPasswordFocus={() => {
            if (generatorMode === 'hidden')
              dispatch({ type: 'SET_GENERATOR_MODE', payload: 'preview' });
          }}
          onPasswordBlur={() => {
            dispatch({ type: 'SET_TOUCHED', payload: { password: true } });
            if (generatorMode === 'preview')
              dispatch({ type: 'SET_GENERATOR_MODE', payload: 'hidden' });
          }}
          onPasswordGenerated={pw =>
            dispatch({ type: 'SET_FORM_DATA', payload: { password: pw, confirmPassword: pw } })
          }
          onPanelOpen={() => dispatch({ type: 'SET_GENERATOR_MODE', payload: 'pinned' })}
          onPanelClose={() => dispatch({ type: 'SET_GENERATOR_MODE', payload: 'hidden' })}
        />
        <TermsCheckboxSection
          agreedToTerms={agreedToTerms}
          onCheckedChange={checked => dispatch({ type: 'SET_AGREED_TO_TERMS', payload: checked })}
        />

        {errors.submit && (
          <div className="border-warning bg-warning/10 rounded-lg border p-3">
            <p className="text-warning text-sm">{errors.submit}</p>
          </div>
        )}

        <Button
          type="submit"
          className="group w-full"
          disabled={
            isSubmitting ||
            !agreedToTerms ||
            !allPasswordRequirementsMet ||
            !passwordsMatch ||
            !!errors.name ||
            !!errors.email ||
            emailUniqueness.isUnique === false
          }
        >
          {isSubmitting ? (
            <div className="border-primary-foreground/30 border-t-primary-foreground h-5 w-5 animate-spin rounded-full border-2" />
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
