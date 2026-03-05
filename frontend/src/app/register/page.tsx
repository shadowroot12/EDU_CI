'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api/auth';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await register({ username, password, nom, prenom });
      // Redirect to login page after successful registration
      router.push('/login?registered=true');
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('already exists')) {
        setError('Ce nom d\'utilisateur existe déjà.');
      } else {
        setError('Une erreur est survenue lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Créer un compte</h2>
        
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              id="nom"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              id="prenom"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Email (ou Matricule)</label>
            <input
              id="username"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        <p className="text-sm text-center text-gray-500">
          Déjà un compte?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
