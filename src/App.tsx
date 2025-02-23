import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Form from './pages/Form';
import Login from './pages/Login';
import supabase, { Session } from './supabase';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 font-roboto antialiased">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-800">
                  GEOTRANOTE
                </Link>
              </div>
              <div className="flex space-x-4">
                {session ? (
                  <>
                    <Link
                      to="/form"
                      className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Formulário
                    </Link>
                    <Link
                      to="/dashboard"
                      className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/dashboard"
            element={session ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/form"
            element={session ? <Form /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
