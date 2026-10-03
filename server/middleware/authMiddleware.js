const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        const token = authHeader.replace("Bearer ", "");

        const {
            data: { user },
            error
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                message: "Invalid or expired authentication token."
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("AUTH MIDDLEWARE ERROR:", error);

        return res.status(401).json({
            message: "Authentication failed."
        });
    }
}

module.exports = authenticateUser;