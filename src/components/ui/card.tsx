import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    const classes = `rounded-lg border bg-card text-card-foreground shadow-sm ${className}`

    return (
      <div ref={ref} className={classes} {...props} />
    )
  }
)

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    const classes = `flex flex-col space-y-1.5 p-6 ${className}`

    return (
      <div ref={ref} className={classes} {...props} />
    )
  }
)

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => {
    const classes = `text-2xl font-semibold leading-none tracking-tight ${className}`

    return (
      <h3 ref={ref} className={classes} {...props} />
    )
  }
)

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => {
    const classes = `text-sm text-muted-foreground ${className}`

    return (
      <p ref={ref} className={classes} {...props} />
    )
  }
)

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    const classes = `p-6 pt-0 ${className}`

    return (
      <div ref={ref} className={classes} {...props} />
    )
  }
)

export const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    const classes = `flex items-center p-6 pt-0 ${className}`

    return (
      <div ref={ref} className={classes} {...props} />
    )
  }
)

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardDescription.displayName = 'CardDescription'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'