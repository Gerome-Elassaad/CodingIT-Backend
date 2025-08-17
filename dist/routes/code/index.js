"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeRouter = void 0;
const express_1 = require("express");
const codeInterpreter_1 = require("@/app/api/chat/codeInterpreter");
const router = (0, express_1.Router)();
// Code execution endpoint - POST /api/code/execute
router.post('/execute', async (req, res) => {
    try {
        const { sessionID, code } = req.body;
        if (!sessionID || !code) {
            return res.status(400).json({
                error: 'sessionID and code are required'
            });
        }
        const result = await (0, codeInterpreter_1.evaluateCode)(sessionID, code);
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || 'An unexpected error occurred'
        });
    }
});
exports.codeRouter = router;
//# sourceMappingURL=index.js.map