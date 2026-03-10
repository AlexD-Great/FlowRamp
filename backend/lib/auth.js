const { verifyIdToken, getUserById } = require("./firebase-admin");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decodedToken = await verifyIdToken(token);

      if (!decodedToken) {
        return res.status(401).json({ error: "Not authorized, token failed" });
      }

      req.user = decodedToken;
      return next();
    } catch (error) {
      console.error("Error verifying token:", error);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ error: "Not authorized, no token" });
};

const adminOnly = async (req, res, next) => {
  try {
    await protect(req, res, async () => {
      if (req.user.role === "admin") {
        return next();
      }

      const user = await getUserById(req.user.uid);

      if (!user || user.customClaims?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      return next();
    });
  } catch (error) {
    console.error("Admin verification error:", error);
    return res.status(403).json({ error: "Admin verification failed" });
  }
};

module.exports = {
  protect,
  adminOnly,
};
