"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const react_1 = __importDefault(require("react"));
exports.Label = react_1.default.forwardRef(({ className = '', ...props }, ref) => {
    const classes = `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`;
    return (<label ref={ref} className={classes} {...props}/>);
});
exports.Label.displayName = 'Label';
//# sourceMappingURL=label.js.map