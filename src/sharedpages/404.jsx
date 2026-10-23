import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">403</h1>
      <p className="text-2xl text-gray-600 mb-8">Oops! Page not found or access denied.</p>
      <p className="text-lg text-gray-500 mb-8">
        The page you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
      >
        Go back to Home
      </Link>
    </div>
  );
}