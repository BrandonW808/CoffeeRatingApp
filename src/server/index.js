const express = require("express");
const path = require("path");
const fs = require("fs");
const { parseCSV, writeCSV } = require("./utils/csvHandler");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve static React files
app.use(express.static(path.join(__dirname, "../dist")));

// API: Get coffee ratings from CSV
app.get("/api/ratings", async (req, res) => {
    try {
        const data = await parseCSV(path.join(__dirname, "data/ratings.csv"));
        res.json(data);
    } catch (err) {
        res.status(500).send("Error reading CSV");
    }
});

// API: Post new coffee rating
app.post("/api/ratings", async (req, res) => {
    try {
        const newRating = req.body;
        const filePath = path.join(__dirname, "data/ratings.csv");

        let existing = [];
        try {
            existing = await parseCSV(filePath);
        } catch (e) { }

        existing.push(newRating);
        await writeCSV(filePath, existing);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).send("Error writing to CSV");
    }
});

// ✅ Serve static assets from dist at the project root
app.use(express.static(path.join(__dirname, "../../dist")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
