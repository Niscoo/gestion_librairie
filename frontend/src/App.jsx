import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Chargement...')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Appel à l'API Flask au chargement du composant
    fetch('http://localhost:5000/api/hello')
      .then(response => response.json())
      .then(data => {
        setMessage(data.message)
        setStatus(data.status)
      })
      .catch(err => {
        setError('Erreur: Le serveur Flask ne semble pas actif. Assurez-vous qu\'il est lancé sur le port 5000!')
        console.error(err)
      })
  }, [])

  return (
    <div className="card">
      <h1>🎉 Gestion de Librairie</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #61dafb', borderRadius: '8px' }}>
        <h2>{message}</h2>
        <p style={{ fontSize: '18px', color: 'green' }}>{status}</p>
        
        {error && (
          <p style={{ fontSize: '16px', color: 'red', marginTop: '20px' }}>
            ⚠️ {error}
          </p>
        )}
      </div>

      <div style={{ marginTop: '30px', textAlign: 'left', fontSize: '14px' }}>
        <h3>✅ Prochaines étapes:</h3>
        <ul>
          <li>Modifier <code>backend/app.py</code> pour ajouter de nouvelles routes</li>
          <li>Modifier <code>frontend/src/App.jsx</code> pour créer l'interface</li>
          <li>Lire la documentation dans <code>README.md</code></li>
        </ul>
      </div>
    </div>
  )
}

export default App
