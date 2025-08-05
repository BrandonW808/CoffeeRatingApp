import React, { useState } from "react";
import Papa from "papaparse";
import CoffeeTable from "./components/CoffeeTable";
import AddCoffeeForm from "./components/AddCoffeeForm";

function App() {
    const [coffees, setCoffees] = useState([]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        Papa.parse(file, {
            header: true,
            complete: (results) => setCoffees(results.data),
        });
    };

    const exportCSV = () => {
        const csv = Papa.unparse(coffees);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "coffee_ratings.csv";
        a.click();
    };

    return (
        <div className="p-4">
            <h1>Coffee Bean Rating App</h1>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
            <AddCoffeeForm onAdd={(coffee) => setCoffees([...coffees, coffee])} />
            <CoffeeTable coffees={coffees} setCoffees={setCoffees} />
            <button onClick={exportCSV}>Download CSV</button>
        </div>
    );
}

export default App;
