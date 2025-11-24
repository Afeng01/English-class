import { forwardRef, useState } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      className = '',
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      // 触发弹性动画
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 200);

      onClick?.(e);
    };

    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium select-none outline-none
      transition-all ease-[var(--ease-out)]
      disabled:opacity-50 disabled:cursor-not-allowed
      focus-visible:ring-2 focus-visible:ring-offset-2
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary: `
        bg-[var(--color-primary)] text-white
        hover:bg-[var(--color-primary-hover)]
        shadow-md hover:shadow-xl hover:shadow-[var(--shadow-primary)]
        focus-visible:ring-[var(--color-primary)]
        hover:-translate-y-0.5
        ${isPressed ? 'shadow-[var(--shadow-primary)] scale-[0.98]' : ''}
      `,
      secondary: `
        bg-white text-[var(--color-text)]
        border-2 border-[var(--color-border)]
        hover:bg-[var(--color-bg-subtle)]
        hover:border-[var(--color-primary)]
        shadow-sm hover:shadow-lg
        focus-visible:ring-[var(--color-text-secondary)]
        hover:-translate-y-0.5
      `,
      ghost: `
        bg-transparent text-[var(--color-primary)]
        hover:bg-[var(--color-primary-light)]
        hover:shadow-sm
        focus-visible:ring-[var(--color-primary-light)]
      `,
      pill: `
        bg-[var(--color-accent)] text-white
        hover:bg-[var(--color-accent-hover)]
        shadow-md hover:shadow-xl hover:shadow-[var(--shadow-accent)]
        focus-visible:ring-[var(--color-accent)]
        hover:-translate-y-0.5
        ${isPressed ? 'shadow-[var(--shadow-accent)] scale-[0.98]' : ''}
      `,
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-lg h-9',
      md: 'px-6 py-3 text-base rounded-xl h-11',
      lg: 'px-8 py-4 text-lg rounded-2xl h-14',
    };

    // pill variant 使用完全圆角
    const borderRadius = variant === 'pill' ? 'rounded-full' : '';

    const duration =
      size === 'sm'
        ? 'duration-[var(--duration-fast)]'
        : 'duration-[var(--duration-base)]';

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${borderRadius || sizeStyles[size]}
          ${duration}
          ${className}
        `
          .trim()
          .replace(/\s+/g, ' ')}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Left Icon */}
        {icon && iconPosition === 'left' && !loading && (
          <span className="inline-flex">{icon}</span>
        )}

        {/* Children */}
        {children && <span>{children}</span>}

        {/* Right Icon */}
        {icon && iconPosition === 'right' && !loading && (
          <span className="inline-flex">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
