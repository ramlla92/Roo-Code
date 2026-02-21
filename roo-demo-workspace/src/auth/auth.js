const express = require("express")
const authMiddleware = require("./middleware")
const config = require("./config")

const app = express()
app.use(express.json())

// JWT token generation endpoint
app.post("/api/login", (req, res) => {
	const { username, password } = req.body

	if (authMiddleware.validateCredentials(username, password)) {
		const token = authMiddleware.generateToken(username)
		return res.json({ token, expiresIn: config.JWT_EXPIRES_IN })
	}

	return res.status(401).json({ error: "Invalid credentials" })
})

// Protected route using the new middleware
app.get("/api/protected", (req, res, next) => {
	authMiddleware.authenticate(req, res, () => {
		res.json({ message: "Access granted", user: req.user })
	})
})

app.listen(config.PORT, () => {
	console.log(`Server running on port ${config.PORT}`)
})

// Export for backward compatibility
module.exports = {
	basicAuth: authMiddleware.basicAuth.bind(authMiddleware),
	jwtAuth: authMiddleware.jwtAuth.bind(authMiddleware),
	app,
}
