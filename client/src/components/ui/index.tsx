import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-black dark:bg-white text-white dark:text-black font-semibold ' +
    'shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(255,255,255,0.15)] ' +
    'hover:opacity-90 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.20)] dark:hover:shadow-[0_8px_24px_rgba(255,255,255,0.20)] ' +
    'active:opacity-100 active:scale-[0.97] active:shadow-none ' +
    'transition-[transform,box-shadow,opacity] duration-[250ms] ease-bouncy will-change-transform ' +
    'disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-[rgba(242,242,247,0.8)] dark:bg-[rgba(255,255,255,0.10)] backdrop-blur-[20px] ' +
    'border border-[rgba(0,0,0,0.09)] dark:border-[rgba(255,255,255,0.12)] text-label-primary ' +
    'hover:bg-white dark:hover:bg-[rgba(255,255,255,0.16)] hover:border-[rgba(0,0,0,0.14)] hover:-translate-y-px hover:shadow-level-2 ' +
    'active:scale-[0.97] active:-translate-y-0 ' +
    'transition-all duration-fast ease-apple will-change-transform ' +
    'disabled:opacity-50 disabled:pointer-events-none',
  ghost:
    'bg-transparent text-apple-blue ' +
    'hover:bg-apple-blue/10 ' +
    'active:bg-apple-blue/15 active:scale-[0.97] ' +
    'transition-all duration-fast ease-apple ' +
    'disabled:opacity-50 disabled:pointer-events-none',
  danger:
    'bg-gradient-to-r from-apple-red to-apple-pink text-white font-semibold ' +
    'shadow-[0_4px_14px_rgba(255,59,48,0.25)] ' +
    'hover:brightness-110 hover:shadow-[0_8px_24px_rgba(255,59,48,0.40)] hover:-translate-y-0.5 hover:scale-[1.02] ' +
    'active:brightness-95 active:scale-[0.97] ' +
    'transition-all duration-[250ms] ease-bouncy will-change-transform ' +
    'disabled:opacity-50 disabled:pointer-events-none',
  outline:
    'border border-[rgba(0,0,0,0.10)] dark:border-[rgba(255,255,255,0.12)] bg-transparent text-label-primary ' +
    'hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(0,0,0,0.16)] hover:-translate-y-px ' +
    'active:bg-[rgba(0,0,0,0.06)] dark:active:bg-[rgba(255,255,255,0.09)] active:scale-[0.97] ' +
    'transition-all duration-fast ease-apple ' +
    'disabled:opacity-50 disabled:pointer-events-none',
};

const sizes: Record<ButtonSize, string> = {
  sm:   'h-8  px-3   text-sm   rounded-[10px]',
  md:   'h-10 px-4   text-sm   rounded-btn',
  lg:   'h-12 px-6   text-base rounded-btn',
  icon: 'h-10 w-10  rounded-[12px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/30 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <ThreeDotSpinner />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─────────────────────────────────────────────────────────────
// Three-dot spinner (replaces circular spinner)
// ─────────────────────────────────────────────────────────────
export function ThreeDotSpinner({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-1', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-dot-bounce-1" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-dot-bounce-2" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-dot-bounce-3" />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Input / Textarea / Label / Select
// ─────────────────────────────────────────────────────────────

const inputBase = [
  'w-full rounded-[14px]',
  'border border-[rgba(0,0,0,0.09)]',
  'bg-[rgba(242,242,247,0.7)] dark:bg-[rgba(255,255,255,0.06)]',
  'backdrop-blur-[20px]',
  'px-4 text-[15px] text-label-primary dark:text-white',
  'placeholder:text-label-quaternary dark:placeholder:text-[rgba(235,235,245,0.3)]',
  'transition-all duration-[280ms] ease-apple',
  'outline-none',
  'focus:border-apple-blue focus:bg-white dark:focus:bg-[rgba(255,255,255,0.10)]',
  'focus:ring-4 focus:ring-apple-blue/[0.15] dark:focus:ring-apple-blue/[0.25]',
  'focus:shadow-[0_0_0_4px_rgba(0,122,255,0.12)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputBase, 'h-11', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, 'py-3 min-h-[100px] resize-y', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export function Label({ children, className, htmlFor }: { children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-[13px] font-semibold tracking-[0.01em] text-label-secondary uppercase', className)}
    >
      {children}
    </label>
  );
}

// Apple-style Select
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        inputBase,
        'h-11 appearance-none pr-10 cursor-pointer',
        // Custom arrow via background
        'bg-[image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%236E6E73\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")]',
        'bg-[position:right_16px_center] bg-no-repeat',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// Card / CardHeader / CardBody
// ─────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={cn(
        'glass-card',
        hover && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('px-6 py-4', className)}
      style={{ borderBottom: '1px solid var(--glass-border-soft)' }}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Badge / Chip
// ─────────────────────────────────────────────────────────────
type BadgeTone = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'purple' | 'teal';

const tones: Record<BadgeTone, string> = {
  default: 'bg-apple-gray-4/60 text-label-secondary',
  brand:   'bg-apple-blue/10 text-apple-blue',
  success: 'bg-apple-green/10 text-apple-green',
  warning: 'bg-apple-orange/10 text-apple-orange',
  danger:  'bg-apple-red/10 text-apple-red',
  purple:  'bg-apple-purple/10 text-apple-purple',
  teal:    'bg-apple-teal/10 text-apple-teal',
};

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'apple-pill',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  children,
  onClick,
  active,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'apple-pill transition-all duration-fast ease-bouncy',
        active
          ? 'bg-apple-blue text-white shadow-accent-blue'
          : 'bg-apple-gray-5/60 text-label-secondary hover:bg-apple-gray-4/60 hover:text-label-primary',
        className
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────
export function Avatar({
  src,
  name,
  size = 40,
  className,
  gradient,
  online,
}: {
  src?:      string | null;
  name?:     string | null;
  size?:     number;
  className?: string;
  gradient?:  string;
  online?:    boolean;
}) {
  const initials = (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const containerStyle = {
    width:  size,
    height: size,
    position: 'relative' as const,
    display: 'inline-block' as const,
  };

  const imgStyle = {
    width:        size,
    height:       size,
    borderRadius: '50%',
    objectFit:    'cover' as const,
    boxShadow:    '0 0 0 2px white, 0 0 0 3px rgba(0,0,0,0.06)',
    transition:   'transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
  };

  const el = src ? (
    <img
      src={src}
      alt={name ?? 'Avatar'}
      width={size}
      height={size}
      loading="lazy"
      className={cn('hover:scale-105 block', className)}
      style={imgStyle}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
        'hover:scale-105 transition-transform duration-[300ms] ease-bouncy',
        'will-change-transform',
        gradient ?? 'from-apple-blue to-apple-teal',
        className
      )}
      style={{
        width:     size,
        height:    size,
        fontSize:  size * 0.38,
        boxShadow: '0 0 0 2px white, 0 0 0 3px rgba(0,0,0,0.06)',
      }}
      aria-label={name ?? 'Avatar'}
    >
      {initials || '?'}
    </div>
  );

  if (!online) return <span style={containerStyle}>{el}</span>;

  return (
    <span style={containerStyle}>
      {el}
      <span
        className="animate-breathe"
        style={{
          position:    'absolute',
          bottom:      size < 32 ? -1 : 0,
          right:       size < 32 ? -1 : 0,
          width:       size < 32 ? 8 : 12,
          height:      size < 32 ? 8 : 12,
          background:  '#34C759',
          borderRadius:'50%',
          border:      '2px solid white',
          boxShadow:   '0 0 0 1px rgba(0,0,0,0.06)',
        }}
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton (shimmer, not pulse)
// ─────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

// ─────────────────────────────────────────────────────────────
// Spinner — three-dot only
// ─────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <ThreeDotSpinner className={className} />;
}

// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title:        string;
  description?: string;
  action?:      ReactNode;
  icon?:        ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
      {icon && (
        <div className="rounded-2xl bg-apple-blue/8 p-4 text-apple-blue">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-label-primary">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-label-secondary leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-2 animate-subtle-pulse">
          {action}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  children: ReactNode;
  footer?:  ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
          className="relative z-10 w-full max-w-[560px] glass-strong rounded-modal shadow-modal animate-modal-in"
          style={{ border: '1px solid var(--glass-border)' }}
        >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--glass-border-soft)' }}
        >
          <h2 className="text-[20px] font-semibold text-label-primary tracking-[-0.01em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-full p-1.5 text-label-tertiary',
              'hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] hover:text-label-primary',
              'transition-all duration-fast ease-apple',
              'active:scale-90'
            )}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div
            className="flex justify-end gap-3 px-6 py-4"
            style={{ borderTop: '1px solid var(--glass-border-soft)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Apple Toggle (settings, etc.)
// ─────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  disabled,
  className,
}: {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'apple-toggle',
        checked && 'active',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Scroll-reveal wrapper
// ─────────────────────────────────────────────────────────────
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?:   number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('reveal', className)}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
