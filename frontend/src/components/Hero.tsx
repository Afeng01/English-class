import type { HTMLAttributes, ReactNode } from 'react';

export interface HeroProps extends HTMLAttributes<HTMLElement> {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  cta?: ReactNode;
  background?: 'gradient' | 'solid' | 'mesh';
  size?: 'sm' | 'md' | 'lg';
}

export function Hero({
  title,
  subtitle,
  cta,
  background = 'solid',
  size = 'lg',
  className = '',
  ...props
}: HeroProps) {
  const sizeStyles = {
    sm: 'py-16 md:py-24',
    md: 'py-24 md:py-32',
    lg: 'py-32 md:py-40',
  };

  const backgroundStyles = {
    solid: 'bg-[var(--color-bg-subtle)]',
    gradient: `
      bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-primary-light)] to-[var(--color-bg-subtle)]
      background-size-200
      animate-gradientShift
    `,
    mesh: `
      bg-[var(--color-bg-subtle)]
      relative
      before:absolute before:inset-0
      before:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]
      before:opacity-40
    `,
  };

  return (
    <section
      className={`
        relative overflow-hidden
        ${sizeStyles[size]}
        ${backgroundStyles[background]}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
      {...props}
    >
      <div className="container-wide relative z-10">
        <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
          {/* Title */}
          {typeof title === 'string' ? (
            <h1
              className="
                text-[length:var(--text-hero)]
                font-[var(--font-black)]
                leading-[var(--leading-tight)]
                tracking-tight
                text-[var(--color-text)]
                animate-fade-in-up
              "
            >
              {title}
            </h1>
          ) : (
            <div className="animate-fade-in-up">{title}</div>
          )}

          {/* Subtitle */}
          {subtitle && (
            typeof subtitle === 'string' ? (
              <p
                className="
                  text-[length:var(--text-heading)]
                  text-[var(--color-text-secondary)]
                  max-w-2xl mx-auto
                  leading-[var(--leading-normal)]
                  animate-fade-in-up
                  reveal-delay-1
                "
              >
                {subtitle}
              </p>
            ) : (
              <div className="animate-fade-in-up reveal-delay-1">{subtitle}</div>
            )
          )}

          {/* CTA */}
          {cta && (
            <div className="pt-4 animate-fade-in-up reveal-delay-2">
              {cta}
            </div>
          )}
        </div>
      </div>

      {/* 装饰性渐变光斑（苹果风格） */}
      {background === 'gradient' && (
        <>
          <div
            className="
              absolute top-0 left-1/4 w-96 h-96
              bg-[var(--color-primary)]
              rounded-full blur-3xl opacity-10
              animate-pulse
            "
          />
          <div
            className="
              absolute bottom-0 right-1/4 w-96 h-96
              bg-[var(--color-accent)]
              rounded-full blur-3xl opacity-10
              animate-pulse
              animation-delay-1000
            "
          />
        </>
      )}
    </section>
  );
}
