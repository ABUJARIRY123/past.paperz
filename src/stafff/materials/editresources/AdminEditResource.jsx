import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSelector } from 'react-redux';
const AdminEditResource = ({ resource, isOpen, onClose, onUpdate }) => {
  const [status, setStatus] = useState(resource.status);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChanged, setIsChanged] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const updated_by = currentUser.username;

  // Track if any changes have been made
  useEffect(() => {
    if (status !== resource.status || comment !== '') {
      setIsChanged(true);
    } else {
      setIsChanged(false);
    }
  }, [status, comment, resource.status]);

  // In AdminEditResource.jsx, modify the handleSubmit function:

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check if resource ID exists
    if (!resource.id) {
      setError('Resource ID is missing');
      setLoading(false);
      return;
    }
    
    // Validate: require comment when status is Rejected
    if (status === 'Rejected' && (!comment || comment.trim() === '')) {
      setError('Please provide a comment explaining why this resource was rejected');
      setLoading(false);
      return;
    }
    
    try {
      // Log the resource ID to debug
      console.log('Updating resource with ID:', resource.id);
      
      // Make the API call to the new endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/staff/resources/${resource.id}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment, updated_by })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update resource status');
      }
      
      const result = await response.json();
      onUpdate(resource.id, { status, comment });
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while updating the resource');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Update Resource Status</h2>
        <div className="mb-4">
          <div className="flex flex-wrap gap-x-4">
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Teacher:</span> {resource.teacher}</p>
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Subject:</span> {resource.subject}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 mt-2">
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Class:</span> {resource.class_and_section}</p>
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Resource Type:</span> {resource.resource_type}</p>
          </div>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 bg-white dark:text-white text-gray-700"
              required
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
            </select>
          </div>
          
          {/* Only show comment box when status is Rejected */}
          {status === 'Rejected' && (
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 bg-white dark:text-white text-gray-700 h-32"
                placeholder="Please explain why this resource is being rejected..."
                required={status === 'Rejected'}
              ></textarea>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !isChanged || (status === 'Rejected' && (!comment || comment.trim() === ''))}
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditResource;