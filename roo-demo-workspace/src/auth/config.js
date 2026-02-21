const config = {
	JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
	PORT: process.env.PORT || 3000,
	VALID_CREDENTIALS: {
		admin: "password", // In production, use database lookup
	},
}

module.exports = config
