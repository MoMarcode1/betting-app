'use client';

import React, { useState, useEffect } from 'react';

// Predefined users
const USERS = {
  user1: { password: 'pass1', name: 'John' },
  user2: { password: 'pass2', name: 'Emma' },
  user3: { password: 'pass3', name: 'Mike' },
  user4: { password: 'pass4', name: 'Sarah' },
  user5: { password: 'pass5', name: 'David' }
};

const getLocalStorage = (key) => {
  if (typeof window === 'undefined') return null;
  const item = window.localStorage.getItem(key);
  try {
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const BettingApp = () => {
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    user: null
  });
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    betTitle: '',
    betPoints: 1
  });
  const [bets, setBets] = useState([]);
  const [showNewBet, setShowNewBet] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const user = getLocalStorage('user');
    const savedBets = getLocalStorage('bets') || [];
    if (user) {
      setAuth({ isLoggedIn: true, user });
    }
    setBets(savedBets);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = () => {
    const { username, password } = formData;
    const user = USERS[username];
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    if (user && user.password === password) {
      const userData = { username, name: user.name };
      setAuth({ isLoggedIn: true, user: userData });
      localStorage.setItem('user', JSON.stringify(userData));
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, user: null });
    localStorage.removeItem('user');
    setFormData({ username: '', password: '', betTitle: '', betPoints: 1 });
  };

  const handleCreateBet = () => {
    if (!formData.betTitle || formData.betPoints < 1 || formData.betPoints > 50) {
      setError('Please enter a valid bet title and points (1-50)');
      return;
    }

    const newBet = {
      id: Date.now(),
      title: formData.betTitle,
      points: formData.betPoints,
      creator: auth.user.name,
      creatorId: auth.user.username,
      votes: [],
      resolved: false,
      timestamp: new Date().toISOString()
    };

    const updatedBets = [...bets, newBet];
    setBets(updatedBets);
    localStorage.setItem('bets', JSON.stringify(updatedBets));
    setFormData({ ...formData, betTitle: '', betPoints: 1 });
    setShowNewBet(false);
    setNotification('Bet created successfully!');
  };

  const handleVote = (betId, vote) => {
    const updatedBets = bets.map(bet => {
      if (bet.id === betId) {
        if (bet.votes.some(v => v.userId === auth.user.username)) {
          setError('You have already voted on this bet');
          return bet;
        }
        return {
          ...bet,
          votes: [...bet.votes, {
            userId: auth.user.username,
            userName: auth.user.name,
            vote,
            points: bet.points
          }]
        };
      }
      return bet;
    });

    setBets(updatedBets);
    localStorage.setItem('bets', JSON.stringify(updatedBets));
    setNotification('Vote recorded successfully!');
  };

  const handleResolveBet = (betId, result) => {
    const updatedBets = bets.map(bet => {
      if (bet.id === betId && bet.creatorId === auth.user.username) {
        const winners = bet.votes.filter(v => v.vote === result);
        const losers = bet.votes.filter(v => v.vote !== result);
        const totalLostPoints = losers.reduce((sum, v) => sum + v.points, 0);
        const pointsPerWinner = winners.length ? totalLostPoints / winners.length : 0;

        return {
          ...bet,
          resolved: true,
          result,
          winners: winners.map(w => ({
            userId: w.userId,
            userName: w.userName,
            points: w.points + pointsPerWinner
          }))
        };
      }
      return bet;
    });

    setBets(updatedBets);
    localStorage.setItem('bets', JSON.stringify(updatedBets));
    setNotification('Bet resolved successfully!');
  };

  if (!auth.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto mt-8 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-blue-900">M&W Wetten</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <button 
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
              onClick={handleLogin}
            >
              Login
            </button>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900">M&W Wetten</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {auth.user.name}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-blue-900 text-blue-900 rounded hover:bg-blue-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex justify-end">
          <button 
            onClick={() => setShowNewBet(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            New Bet
          </button>
        </div>

        {notification && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {notification}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {showNewBet && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Create New Bet</h2>
            <div className="space-y-4">
              <input
                placeholder="What's your bet?"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.betTitle}
                onChange={e => setFormData({ ...formData, betTitle: e.target.value })}
              />
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="w-24 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.betPoints}
                  onChange={e => setFormData({ ...formData, betPoints: parseInt(e.target.value) || 1 })}
                />
                <span>points</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCreateBet}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Create Bet
                </button>
                <button 
                  onClick={() => setShowNewBet(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {bets.map(bet => (
            <div 
              key={bet.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                bet.resolved ? (bet.result ? 'border-2 border-green-500' : 'border-2 border-red-500') : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{bet.title}</h3>
                  <p className="text-sm text-gray-500">By: {bet.creator}</p>
                  <p className="text-sm text-gray-500">Points: {bet.points}</p>
                </div>
                {!bet.resolved ? (
                  <div className="space-x-2">
                    {bet.creatorId === auth.user.username && (
                      <>
                        <button 
                          onClick={() => handleResolveBet(bet.id, true)}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                        >
                          Resolve Yes
                        </button>
                        <button 
                          onClick={() => handleResolveBet(bet.id, false)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                          Resolve No
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleVote(bet.id, true)}
                      disabled={bet.votes.some(v => v.userId === auth.user.username)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Vote Yes
                    </button>
                    <button
                      onClick={() => handleVote(bet.id, false)}
                      disabled={bet.votes.some(v => v.userId === auth.user.username)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Vote No
                    </button>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className={bet.result ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Result: {bet.result ? 'Yes' : 'No'}
                    </p>
                    {bet.winners?.map(winner => (
                      <p key={winner.userId} className="text-sm text-gray-500">
                        {winner.userName} won {winner.points.toFixed(1)} points
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Votes: {bet.votes.length} | 
                Yes: {bet.votes.filter(v => v.vote).length} | 
                No: {bet.votes.filter(v => !v.vote).length}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default BettingApp;