"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
// Placeholder for integrations routes
router.get('/github/repos', (req, res) => {
    res.json({ message: 'GitHub repos API - TODO: Convert from Next.js' });
});
router.get('/github/repos/:owner/:repo', (req, res) => {
    res.json({ message: `GitHub repo ${req.params.owner}/${req.params.repo} - TODO: Convert from Next.js` });
});
router.post('/github/import', (req, res) => {
    res.json({ message: 'GitHub import API - TODO: Convert from Next.js' });
});
exports.integrationsRouter = router;
//# sourceMappingURL=index.js.map