import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'glass' | 'gradient';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      hoverable = false,
      padding = 'md',
      elevation = 'md',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      rounded-xl
      transition-all duration-[var(--duration-base)] ease-[var(--ease-out)]
      overflow-hidden
    `;

    const variantStyles = {
      elevated: `
        bg-white
        border border-[var(--color-border-subtle)]
      `,
      outlined: `
        bg-white
        border border-[var(--color-border)]
      `,
      glass: `
        glass
        backdrop-blur-xl
      `,
      gradient: `
        bg-gradient-to-br from-[var(--color-primary-light)] to-white
        border border-[var(--color-primary-light)]
      `,
    };

    const elevationStyles = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    };

    const hoverElevationStyles = {
      sm: 'hover:shadow-md',
      md: 'hover:shadow-lg',
      lg: 'hover:shadow-xl',
      xl: 'hover:shadow-2xl',
    };

    const hoverStyles = hoverable
      ? `
        cursor-pointer
        hover:-translate-y-2
        hover:scale-[1.02]
        active:scale-[0.99]
        ${hoverElevationStyles[elevation]}
      `
      : '';

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    // glass variant 不需要阴影
    const showElevation = variant !== 'glass';

    return (
      <div
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${showElevation ? elevationStyles[elevation] : ''}
          ${hoverStyles}
          ${paddingStyles[padding]}
          ${className}
        `
          .trim()
          .replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
