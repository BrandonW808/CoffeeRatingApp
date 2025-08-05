const fs = require("fs");
const Papa = require("papaparse");

// Read and parse CSV file
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) return reject(err);
            const parsed = Papa.parse(data, { header: true });
            resolve(parsed.data);
        });
    });
}

// Write array of objects to CSV
function writeCSV(filePath, data) {
    return new Promise((resolve, reject) => {
        const csv = Papa.unparse(data);
        fs.writeFile(filePath, csv, "utf8", (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = { parseCSV, writeCSV };
