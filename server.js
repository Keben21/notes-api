require(`dotenv`).config();
const express = require(`express`);
const mongoose = require(`mongoose`);
const authRoutes = require(`./routes/authRoutes`);
const noteRoutes = require(`./routes/noteRoutes`);

const app = express();

app.use(express.json());
app.use(`/api/auth`, authRoutes);
app.use(`/api/notes`, noteRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
