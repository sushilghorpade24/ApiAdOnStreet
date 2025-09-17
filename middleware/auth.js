const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).send({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send({ message: "Invalid or expired token" });
  }
}


// function auth(req, res, next) {
//   const authHeader = req.headers["authorization"];
//   if (!authHeader) {
//     return res.status(403).send({ message: "No token provided" });
//   }

//   const token = authHeader.split(" ")[1]; // Bearer <token>
//   console.log("Received Token:", token);

//   try {
//     // ✅ verify with the same secret used in jwt.sign()
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("✅ Decoded Payload:", decoded);

//     req.user = decoded; // attach user info to request
//     next();
//   } catch (err) {
//     console.error("❌ JWT Verification Error:", err.message);
//     return res.status(401).send({ message: "Invalid or expired token" });
//   }
// }



module.exports = auth;
