import Papa from "papaparse";

// Parses a CSV file and returns a Promise with the result
export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

// Converts an array of objects to a CSV string
export const exportToCSV = (data) => {
    return Papa.unparse(data);
};
