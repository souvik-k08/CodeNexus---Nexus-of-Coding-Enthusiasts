import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems
}) => {
  return (
    totalPages > 1 && (
      <div className="flex flex-col items-center mt-8 gap-2">
        <div className="join bg-base-100 rounded-box border border-base-300 shadow-md hover:shadow-lg transition-shadow">
          <button
            className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : 'btn-primary'}`}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button 
            className="join-item btn bg-base-100 border-base-300 text-base-content"
          >
            Page {currentPage} of {totalPages}
          </button>
          <button
            className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : 'btn-primary'}`}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>
        <div className="text-sm text-base-content opacity-75">
          Showing {(currentPage - 1) * itemsPerPage + 1} - 
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
      </div>
    )
  );
};

export default Pagination;