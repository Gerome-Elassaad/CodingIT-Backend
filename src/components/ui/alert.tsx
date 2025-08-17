import React from 'react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-background text-foreground',
      destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
    }

    const classes = `relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${variants[variant]} ${className}`

    return (
      <div
        ref={ref}
        role="alert"
        className={classes}
        {...props}
      />
    )
  }
)

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => {
    const classes = `text-sm [&_p]:leading-relaxed ${className}`

    return (
      <div ref={ref} className={classes} {...props} />
    )
  }
)

Alert.displayName = 'Alert'
AlertDescription.displayName = 'AlertDescription'