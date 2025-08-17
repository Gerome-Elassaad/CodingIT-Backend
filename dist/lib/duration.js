"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDuration = parseDuration;
function parseDuration(duration) {
    const units = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000
    };
    const match = duration.match(/^(\d+)([smhdw])$/);
    if (!match) {
        throw new Error(`Invalid duration format: ${duration}`);
    }
    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
}
//# sourceMappingURL=duration.js.map