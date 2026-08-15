const express = require(`express`);
const Note = require(`../models/note`);
const protect = require(`../middleware/authMiddleware`);

const router = express.Router();

router.post(`/`, protect, async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.create({
      title,
      content,
      user: req.userId,
    });

    res.status(201).json({ note });
  } catch (err) {
    res.status(500).json({ message: `Server Error`, err: err.message });
  }
});

router.get(`/`, protect, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.userId });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
});

router.get(`/:id`, protect, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
});

router.put(`/:id`, protect, async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, content },
      { new: true },
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
});

router.delete(`/:id`, protect, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
});

module.exports = router;
