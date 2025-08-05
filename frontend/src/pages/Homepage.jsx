import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import ProfileAvatar from '../components/ProfileAvatar';
import Pagination from '../components/Pagination';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({ difficulty: 'all', tag: 'all', status: 'all' });
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 12; // Fixed to 12 problems per page


  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.querySelector("html").setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);  // Clear solved problems on logout
  };

  const filteredProblems = problems.filter(problem => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch = filters.status === 'all' || solvedProblems.some(sp => sp._id === problem._id);
    return difficultyMatch && tagMatch && statusMatch;
  });

  // Pagination calculations
  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentProblems = filteredProblems.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  

  return (
    <div className="min-h-screen bg-base-200 transition-colors">
      <nav className="navbar bg-base-100 shadow-md px-4 sticky top-0 z-50">
        <div className="flex-1">
          <NavLink to="/" className="btn btn-ghost text-2xl font-bold text-primary">CodeNexus</NavLink>
        </div>
        <div className="flex-none gap-4 items-center">
          <button onClick={handleToggle} className="btn btn-ghost mx-4 text-3xl">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" />
                ) : (
                  <div className="bg-gray-300 border rounded-full w-10 h-10 flex items-center justify-center text-gray-500">👤</div>
                )}
              </div>
            </div>
            <div tabIndex={1} className="btn btn-ghost normal-case text-md font-semibold">
              {user?.firstName || 'User'}
            </div>
            <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><button onClick={handleLogout}>Logout</button></li>
              {user?.role === 'admin' && <li><NavLink to="/admin">Admin</NavLink></li>}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <select className="select select-primary" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="all">All Problems</option>
            <option value="solved">Solved Problems</option>
          </select>
          <select className="select select-primary" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select className="select select-primary" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}>
            <option value="all">All Tags</option>
            <option value="array">Array</option>
            <option value="linkedList">Linked List</option>
            <option value="graph">Graph</option>
            <option value="dp">DP</option>
            <option value="string">String</option>
            <option value="tree">Tree</option>
            <option value="recursion">Recursion</option>
            <option value="stack">Stack</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProblems.length > 0 ? (
            currentProblems.map(problem => (
              <div key={problem._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <h2 className="card-title text-lg font-semibold text-primary">
                      <NavLink to={`/problem/${problem._id}`}>
                        {problem.title}
                      </NavLink>
                    </h2>
                    {solvedProblems.some(sp => sp._id === problem._id) && (
                      <div className="badge badge-success">Solved</div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>{problem.difficulty}</div>
                    <div className="badge badge-info">{problem.tags}</div>
                  </div>
                </div>
              </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-xl text-gray-500">No problems found matching your filters</p>
              </div>
          )}
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          itemsPerPage={problemsPerPage}
          totalItems={filteredProblems.length}
        />
      </div>
    </div>
  );
}

const getDifficultyBadgeColor = (difficulty) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'hard': return 'badge-error';
    default: return 'badge-neutral';
  }
};

export default Homepage;

