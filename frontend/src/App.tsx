import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch data from Django API
    axios.get('/api/')
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setMessage('Could not connect to Django backend');
      });
  }, []);

  return (
    <div className="App">
      <h1>Customer Management System</h1>
      <p>Frontend: React is running!</p>
      <p>Backend Connection: {message}</p>
    </div>
  );
}

export default App;