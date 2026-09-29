const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("MySQL database connected successfully.");

    app.listen(PORT, () => {
      console.log(`WISTA API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);

    process.exit(1);
  }
};

startServer();