import React, { useState } from "react";

function AddCoffeeForm({ onAdd }) {
  const [form, setForm] = useState({
    Name: "",
    Origin: "",
    "Roast Level": "",
    Rating: "",
    Notes: ""
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
    setForm({ Name: "", Origin: "", "Roast Level": "", Rating: "", Notes: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(form).map((key) => (
        <input
          key={key}
          name={key}
          value={form[key]}
          onChange={handleChange}
          placeholder={key}
          required
        />
      ))}
      <button type="submit">Add Coffee</button>
    </form>
  );
}

export default AddCoffeeForm;
