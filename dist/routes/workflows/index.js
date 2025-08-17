"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
// Placeholder for workflows routes
router.get('/', (req, res) => {
    res.json({ message: 'Workflows API - TODO: Convert from Next.js' });
});
router.get('/:id', (req, res) => {
    res.json({ message: `Workflow ${req.params.id} - TODO: Convert from Next.js` });
});
router.post('/:id/execute', (req, res) => {
    res.json({ message: `Execute workflow ${req.params.id} - TODO: Convert from Next.js` });
});
exports.workflowsRouter = router;
//# sourceMappingURL=index.js.map