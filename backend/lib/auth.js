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
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};

const adminOnly = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    await protect(req, res, async () => {
      const user = await getUserById(req.user.uid);
      
      // Check if user has admin role (you'll need to add this field in Firebase)
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      next();
    });
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(403).json({ error: "Admin verification failed" });
  }
};

module.exports = {
  protect,
  adminOnly,
};
