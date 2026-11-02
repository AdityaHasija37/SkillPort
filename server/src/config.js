const isTest = process.env.NODE_ENV === "test";

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable ${name}. See server/.env.example.`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: isTest ? process.env.MONGODB_URI : required("MONGODB_URI", "mongodb://127.0.0.1:27017/skillport"),
  jwtSecret: required("JWT_SECRET", isTest ? "test-secret" : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientOrigin: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173").split(","),
  isTest,
};
