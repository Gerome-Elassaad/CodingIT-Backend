"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDescription = exports.Alert = void 0;
const react_1 = __importDefault(require("react"));
exports.Alert = react_1.default.forwardRef(({ className = '', variant = 'default', ...props }, ref) => {
    const variants = {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
    };
    const classes = `relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${variants[variant]} ${className}`;
    return (<div ref={ref} role="alert" className={classes} {...props}/>);
});
exports.AlertDescription = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `text-sm [&_p]:leading-relaxed ${className}`;
    return (<div ref={ref} className={classes} {...props}/>);
});
exports.Alert.displayName = 'Alert';
exports.AlertDescription.displayName = 'AlertDescription';
//# sourceMappingURL=alert.js.map