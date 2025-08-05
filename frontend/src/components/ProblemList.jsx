import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';
import Pagination from '../components/Pagination'; // Import the reusable component

function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 7; // Fixed to 7 problems per page

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get('/problem/getAllProblem');
        setProblems(response.data);
      } catch (error) {
        alert(`Failed to fetch problems: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-4 text-lg">Loading problems...</span>
      </div>
    );
  }

  // Pagination calculations
  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentProblems = problems.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalPages = Math.ceil(problems.length / problemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">All Problems</h1>
      <ul className="space-y-4 mb-8">
        {currentProblems.length > 0 ? (
          currentProblems.map((problem) => (
            <li
              key={problem._id}
              className="p-4 bg-base-200 rounded-lg shadow cursor-pointer hover:bg-base-300 transition-colors"
              onClick={() => navigate(`/admin/update/${problem._id}`)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{problem.title}</h2>
                  <p className="text-sm text-gray-500">{problem.difficulty} - {problem.tags}</p>
                </div>
                <div className="badge badge-neutral">
                  {new Date(problem.updatedAt).toLocaleString()}
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="text-center py-8 text-lg text-gray-500">
            No problems found
          </li>
        )}
      </ul>

      {/* Pagination Component */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={paginate}
        itemsPerPage={problemsPerPage}
        totalItems={problems.length}
      />
    </div>
  );
}

export default ProblemList;
