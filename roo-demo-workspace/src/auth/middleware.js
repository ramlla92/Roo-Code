/**
 * AuthMiddleware class provides a modular authentication system
 * supporting multiple authentication strategies with a strategy pattern.
 * @class
 */
const jwt = require("jsonwebtoken")
const config = require("./config")

class AuthMiddleware {
	/**
	 * Creates an instance of AuthMiddleware.
	 * @constructor
	 */
	constructor() {
		this.strategies = new Map()
		this.registerStrategy("Basic", this.basicAuth)
		this.registerStrategy("Bearer", this.jwtAuth)
	}

	/**
	 * Registers a new authentication strategy.
	 * @param {string} type - Authentication type (e.g., 'Basic', 'Bearer')
	 * @param {function} handler - Strategy handler function
	 */
	registerStrategy(type, handler) {
		this.strategies.set(type, handler)
	}

	/**
	 * Main authentication middleware that routes to the appropriate strategy.
	 * @param {object} req - Express request object
	 * @param {object} res - Express response object
	 * @param {function} next - Express next middleware function
	 */
	authenticate(req, res, next) {
		const authHeader = req.headers.authorization

		if (!authHeader) {
			return this.sendError(res, "Missing Authorization header", 401)
		}

		const [type] = authHeader.split(" ")
		const strategy = this.strategies.get(type)

		if (!strategy) {
			return this.sendError(res, "Unsupported authentication type", 401)
		}

		return strategy.call(this, req, res, next)
	}

	/**
	 * Basic authentication strategy.
	 * @param {object} req - Express request object
	 * @param {object} res - Express response object
	 * @param {function} next - Express next middleware function
	 */
	basicAuth(req, res, next) {
		const authHeader = req.headers.authorization
		const [type, credentials] = authHeader.split(" ")

		if (type !== "Basic") {
			return this.sendError(res, "Unsupported authentication type", 401)
		}

		const decoded = Buffer.from(credentials, "base64").toString("utf8")
		const [username, password] = decoded.split(":")

		if (this.validateCredentials(username, password)) {
			req.user = { username }
			return next()
		}

		return this.sendError(res, "Invalid credentials", 401)
	}

	/**
	 * JWT authentication strategy.
	 * @param {object} req - Express request object
	 * @param {object} res - Express response object
	 * @param {function} next - Express next middleware function
	 */
	jwtAuth(req, res, next) {
		const authHeader = req.headers.authorization
		const [type, token] = authHeader.split(" ")

		if (type !== "Bearer") {
			return this.sendError(res, "Unsupported authentication type", 401)
		}

		try {
			const decoded = jwt.verify(token, config.JWT_SECRET)
			req.user = decoded
			return next()
		} catch (error) {
			return this.sendError(res, "Invalid or expired token", 401)
		}
	}

	/**
	 * Validates user credentials.
	 * @param {string} username - Username to validate
	 * @param {string} password - Password to validate
	 * @returns {boolean} True if credentials are valid, false otherwise
	 */
	validateCredentials(username, password) {
		return config.VALID_CREDENTIALS[username] === password
	}

	/**
	 * Sends a formatted error response.
	 * @param {object} res - Express response object
	 * @param {string} message - Error message
	 * @param {number} statusCode - HTTP status code
	 */
	sendError(res, message, statusCode) {
		res.status(statusCode).json({ error: message })
	}

	/**
	 * Generates a JWT token for a user.
	 * @param {string} username - Username to generate token for
	 * @returns {string} JWT token
	 */
	generateToken(username) {
		return jwt.sign({ username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN })
	}
}

module.exports = new AuthMiddleware()
