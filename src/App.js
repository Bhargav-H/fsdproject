import { useEffect, useState } from 'react';
import supabase from './supabase';
import './style.css';

const CATEGORIES = [
  { name: 'technology', color: '#3b82f6' },
  { name: 'science', color: '#16a34a' },
  { name: 'finance', color: '#ef4444' },
  { name: 'society', color: '#eab308' },
  { name: 'entertainment', color: '#db2777' },
  { name: 'health', color: '#14b8a6' },
  { name: 'history', color: '#f97316' },
  { name: 'news', color: '#8b5cf6' },
];

function App() {
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  // Check for logged-in user on app load and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function getFacts() {
      setIsLoading(true);
      let query = supabase.from('facts').select('*');
      if (currentCategory !== 'all') query = query.eq('category', currentCategory);
      query = query.order('votesInteresting', { ascending: false });
      const { data: facts, error } = await query;
      if (!error) setFacts(facts);
      else alert('There was a problem getting data');
      setIsLoading(false);
    }
    if (user) getFacts();
    else setFacts([]);
  }, [currentCategory, user]);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : '';
  }, [isDarkMode]);

  // Show AuthForm if not logged in
  if (!user)
    return (
      <div className="auth-container">
        <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <AuthForm setUser={setUser} />
      </div>
    );

  return (
    <>
      <Header
        showForm={showForm}
        setShowForm={setShowForm}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        user={user}
        setUser={setUser}
      />
      {showForm && <NewFactForm setFacts={setFacts} setShowForm={setShowForm} user={user} />}
      <main className="main">
        <CategoryFilter setCurrentCategory={setCurrentCategory} />
        {isLoading ? <Loader /> : <FactList facts={facts} setFacts={setFacts} user={user} />}
      </main>
    </>
  );
}

function AuthForm({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    let result;
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }
    setLoading(false);
    if (result.error) setError(result.error.message);
    else if (result.data?.user) setUser(result.data.user);
    else if (result.data?.session?.user) setUser(result.data.session.user);
    else setError('Check your email for confirmation link (if signing up).');
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        autoComplete="username"
        onChange={e => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        autoComplete={isLogin ? "current-password" : "new-password"}
        onChange={e => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
      </button>
      {error && <p className="error">{error}</p>}
      <p>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button type="button" onClick={() => setIsLogin(l => !l)} disabled={loading} style={{textDecoration: 'underline', background: 'none', border: 'none', color: 'blue', cursor: 'pointer'}}>
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </form>
  );
}

function Loader() {
  return <p className="message">Loading...</p>;
}

function Header({ showForm, setShowForm, isDarkMode, setIsDarkMode, user, setUser }) {
  const appTitle = 'Today I learned!';
  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" alt="Today I learned logo" />
        <h1>{appTitle}</h1>
      </div>
      <div className="header-buttons">
        {typeof setShowForm === 'function' && (
          <button className="btn btn-large btn-open" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Close' : 'Share a fact'}
          </button>
        )}
        <button className="btn btn-theme-toggle" onClick={() => setIsDarkMode(d => !d)}>
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        {user && setUser && (
          <button
            className="btn btn-logout"
            onClick={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function NewFactForm({ setFacts, setShowForm, user }) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text || !isValidHttpUrl(source) || !category || textLength > 200) return;
    setIsUploading(true);
    const { data: newFact, error } = await supabase
      .from('facts')
      .insert([{ text, source, category, user_id: user.id }])
      .select();
    setIsUploading(false);
    if (!error) setFacts(facts => [newFact[0], ...facts]);
    setText('');
    setSource('');
    setCategory('');
    if (setShowForm) setShowForm(false);
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={e => e.target.value.length <= 200 && setText(e.target.value)}
        disabled={isUploading}
      />
      <span>{200 - textLength}</span>
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={e => setSource(e.target.value)}
        disabled={isUploading}
      />
      <select value={category} onChange={e => setCategory(e.target.value)} disabled={isUploading}>
        <option value="">Choose category:</option>
        {CATEGORIES.map(cat => (
          <option key={cat.name} value={cat.name}>
            {cat.name[0].toUpperCase() + cat.name.slice(1)}
          </option>
        ))}
      </select>
      <button className="btn btn-large btn-post" disabled={isUploading || !user}>
        Post
      </button>
      {!user && <p style={{ color: 'red' }}>You must be logged in to post a fact.</p>}
    </form>
  );
}

function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside>
      <ul>
        <li className="category">
          <button className="btn btn-all-categories" onClick={() => setCurrentCategory('all')}>
            All
          </button>
        </li>
        {CATEGORIES.map(cat => (
          <li key={cat.name} className="category">
            <button
              className="btn btn-category"
              onClick={() => setCurrentCategory(cat.name)}
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ facts, setFacts, user }) {
  if (facts.length === 0)
    return <p className="message">No facts for this category yet! Create the first one.</p>;
  return (
    <section>
      <ul className="facts-list">
        {facts.map(fact => (
          <Fact key={fact.id} fact={fact} setFacts={setFacts} user={user} />
        ))}
      </ul>
      <p>There are {facts.length} facts in the database. Add your own!</p>
    </section>
  );
}

function Fact({ fact, setFacts, user }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDisputed = fact.votesInteresting + fact.votesMindblowing < fact.votesFalse;

  async function handleVote(columnName) {
    setIsUpdating(true);
    const { data: updatedFact, error } = await supabase
      .from('facts')
      .update({ [columnName]: fact[columnName] + 1 })
      .eq('id', fact.id)
      .select();
    setIsUpdating(false);
    if (!error) setFacts(facts => facts.map(f => (f.id === fact.id ? updatedFact[0] : f)));
  }

  async function handleDelete() {
    const { error } = await supabase.from('facts').delete().eq('id', fact.id);
    if (!error) setFacts(facts => facts.filter(f => f.id !== fact.id));
    else alert('Failed to delete the fact');
  }

  return (
    <li className="fact">
      <p>
        {isDisputed && <span className="disputed">[⛔ DISPUTED]</span>}
        {fact.text}
        <a className="source" href={fact.source} target="_blank" rel="noopener noreferrer">
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find(cat => cat.name === fact.category).color,
        }}
      >
        {fact.category}
      </span>
      <div className="vote-buttons">
        <button onClick={() => handleVote('votesInteresting')} disabled={isUpdating || !user}>
          {fact.votesInteresting} 👍
        </button>
        <button onClick={() => handleVote('votesMindblowing')} disabled={isUpdating || !user}>
          {fact.votesMindblowing} 🤯
        </button>
        <button onClick={() => handleVote('votesFalse')} disabled={isUpdating || !user}>
          {fact.votesFalse} ⛔️
        </button>
        {user && (
          <button onClick={handleDelete} disabled={isUpdating}>
            🗑 Delete
          </button>
        )}
      </div>
    </li>
  );
}

export default App;
