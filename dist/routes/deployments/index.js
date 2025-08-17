"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploymentsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
// Placeholder for deployments routes
// TODO: Convert from Next.js API routes
router.get('/', (req, res) => {
    res.json({ message: 'Deployments API - TODO: Convert from Next.js' });
});
router.get('/:id', (req, res) => {
    res.json({ message: `Deployment ${req.params.id} - TODO: Convert from Next.js` });
});
router.post('/:id/rollback', (req, res) => {
    res.json({ message: `Rollback deployment ${req.params.id} - TODO: Convert from Next.js` });
});
exports.deploymentsRouter = router;
//# sourceMappingURL=index.js.map