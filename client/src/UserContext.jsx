// client/src/UserContext.jsx
import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Make sure axios is configured to send cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:4000';

// Create context
export const UserContext = createContext({});

// Context provider component
export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Check if user is logged in on component mount
  useEffect(() => {
    if (!user) {
      // Try to get the token from localStorage as a fallback
      const token = localStorage.getItem('token');
      
      // If we have a stored token, add it to axios headers
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      axios.get('/profile')
        .then(({ data }) => {
          // If we get user data back, we're logged in
          setUser(data);
          
          // If the response includes a token, store it
          if (data && data.token) {
            localStorage.setItem('token', data.token);
          }
        })
        .catch(err => {
          // If there's an error, user is not logged in
          console.log('Not logged in:', err);
        })
        .finally(() => {
          // Whether logged in or not, we're ready
          setReady(true);
        });
    }
  }, []);

  async function login(email, password) {
    try {
      console.log('Login attempt for:', email);
      
      const response = await axios.post('/login', { email, password });
      console.log('Login response:', response.data);
      
      setUser(response.data);
      
      if (response.data && response.data.token) {
        console.log('Token received, storing in localStorage');
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return true;
    } catch (error) {
      console.error('Login error details:', error.response?.data || error.message);
      return false;
    }
  }

  // Logout function
  async function logout() {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    // Remove from axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
  }

  // Register function
  async function register(name, email, password) {
    try {
      const { data } = await axios.post('/register', {
        name,
        email,
        password
      });
      
      // After registration, automatically log in
      await login(email, password);
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }

  // Provide context value to children
  return (
    <UserContext.Provider value={{ user, setUser, ready, login, logout, register }}>
      {children}
    </UserContext.Provider>
  );
}