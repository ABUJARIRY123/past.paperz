import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Search, Plus, RotateCcw, BookOpen, Users, RefreshCcw, Calendar} from 'lucide-react';
import { Button } from './SharedComponent';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {signoutSuccess} from '../../redux/user/userSlice';
// Utility Components
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
    <BookOpen className="w-16 h-16 text-gray-200 mb-4" />
    <h2 className="text-xl font-semibold text-1ray-700 mb-2">
        Subject Allocations Not Found
    </h2>
    <p className="text-gray-200 mb-4">
      You have not been assigned any subjects yet.
    </p>
  </div>
);

const SubjectCard = ({ allocation }) => (
  <div className="bg-blue-500 border rounded-lg p-4 shadow-sm hover:shadow-md transition-all space-y-3">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold text-black">
        {allocation.subject.join(', ')}
      </h3>
      <Link to='/teacherdashboard?tab=teacher/activity/submission'className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-green-800 hover:bg-yellow-200 transition-colors">
        <Plus className="h-4 w-4 mr-1" /> Add Subject Activity
      </Link>
    </div>
    
    <div className="flex items-center text-gray-100 space-x-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span>{allocation.total_students} Students</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>{new Date(allocation.created_at).toLocaleDateString()}</span>
      </div>
    </div>
    
    <div className="text-sm text-gray-200">
      Classes: {allocation.classAndSection.join(', ')}
    </div>
  </div>
);

const StudyMaterials = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(signoutSuccess());
    navigate('/sign-in');
  };
  const fetchAllocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/subjects/getTeacherstAllocations`, 
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );
      
      const data = await res.json();
      if (data.logout) {
        handleLogout();
        return;
      }
      if (res.ok) {
        setAllocations(data.allocations || []);
      } else {
        throw new Error(data.message || 'Failed to fetch allocations');
      }
    } catch (err) {
      setError(err.message || 'Error fetching allocations');
      setAllocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role) {
      fetchAllocations();
    }
  }, [currentUser?.id]);

  const filteredAllocations = useMemo(() => {
    if (!searchTerm) return allocations;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return allocations.filter(allocation => 
      allocation.subject.some(sub => 
        sub.toLowerCase().includes(lowercaseSearch)
      ) ||
      allocation.classAndSection.some(cls => 
        cls.toLowerCase().includes(lowercaseSearch)
      )
    );
  }, [allocations, searchTerm]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10">
        <RefreshCcw className="mx-auto mb-4 animate-spin" size={32} />
        Loading my subjects allocations...
      </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 p-4 rounded-lg text-red-800 flex justify-between items-center">
          <span>{error}</span>
          <Button onClick={fetchAllocations} variant="destructive">
            Retry
          </Button>
        </div>
      );
    }

    if (filteredAllocations.length === 0) {
      return <EmptyState role={currentUser.role} />;
    }

    return (
      <div className='grid md:grid-cols-3 grid-cols-1 gap-6'>
        {filteredAllocations.map(allocation => (
          <SubjectCard 
            key={allocation.id} 
            allocation={allocation} 
          />
        ))}
      </div>
    );
  };

  if (!['Admin', 'Teacher'].includes(currentUser?.role)) {
    return <div>Unauthorized Access</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 mt-20">
     <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
  <h1 className="text-xl md:text-2xl font-bold w-full text-center md:text-left">
    My Subject Allocations
  </h1>
  <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 w-full">
    <div className="relative w-full max-w-full md:max-w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
      <input
        type="text"
        placeholder="Search subjects..."
        className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 text-black"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
    <Button 
      variant="secondary" 
      onClick={fetchAllocations}
      className="flex items-center gap-2 bg-blue-500 w-full md:w-auto justify-center"
    >
      <RotateCcw className="h-4 w-4" />
      <span className="md:block">Refresh</span>
    </Button>
    <Link to='/teacherdashboard?tab=resources' className="w-full md:w-auto">
  <Button 
    variant="secondary" 
    className="flex items-center gap-2 bg-blue-500 w-full md:w-auto justify-center"
  >
    <Plus className="h-4 w-4" />
    <span className="md:block">Resources</span>
  </Button>
</Link>
  </div>
</div>
      {renderContent()}
    </div>
  );
};

export default StudyMaterials;