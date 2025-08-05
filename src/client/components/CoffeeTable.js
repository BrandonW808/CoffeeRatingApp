import React from "react";

function CoffeeTable({ coffees, setCoffees }) {
    const updateRating = (index, newRating) => {
        const updated = [...coffees];
        updated[index].Rating = newRating;
        setCoffees(updated);
    };

    return (
        <table>
            <thead>
                <tr>
                    {Object.keys(coffees[0] || {}).map((header) => (
                        <th key={header}>{header}</th>
                    ))}
                    <th>Update Rating</th>
                </tr>
            </thead>
            <tbody>
                {coffees.map((coffee, idx) => (
                    <tr key={idx}>
                        {Object.values(coffee).map((val, i) => (
                            <td key={i}>{val}</td>
                        ))}
                        <td>
                            <input
                                type="number"
                                value={coffee.Rating}
                                step="0.1"
                                onChange={(e) => updateRating(idx, e.target.value)}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default CoffeeTable;
