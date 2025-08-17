"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardFooter = exports.CardContent = exports.CardDescription = exports.CardTitle = exports.CardHeader = exports.Card = void 0;
const react_1 = __importDefault(require("react"));
exports.Card = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `rounded-lg border bg-card text-card-foreground shadow-sm ${className}`;
    return (<div ref={ref} className={classes} {...props}/>);
});
exports.CardHeader = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `flex flex-col space-y-1.5 p-6 ${className}`;
    return (<div ref={ref} className={classes} {...props}/>);
});
exports.CardTitle = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `text-2xl font-semibold leading-none tracking-tight ${className}`;
    return (<h3 ref={ref} className={classes} {...props}/>);
});
exports.CardDescription = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `text-sm text-muted-foreground ${className}`;
    return (<p ref={ref} className={classes} {...props}/>);
});
exports.CardContent = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `p-6 pt-0 ${className}`;
    return (<div ref={ref} className={classes} {...props}/>);
});
exports.CardFooter = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `flex items-center p-6 pt-0 ${className}`;
    return (<div ref={ref} className={classes} {...props}/>);
});
exports.Card.displayName = 'Card';
exports.CardHeader.displayName = 'CardHeader';
exports.CardTitle.displayName = 'CardTitle';
exports.CardDescription.displayName = 'CardDescription';
exports.CardContent.displayName = 'CardContent';
exports.CardFooter.displayName = 'CardFooter';
//# sourceMappingURL=card.js.map