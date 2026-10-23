import React, { useState } from 'react';
import { X } from 'lucide-react';

const StudentListModal = ({ students, subject, classSection, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student => 
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex bg-gray-900 text-white justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            Students in {subject.join(', ')} - {classSection.join(', ')}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <input 
            type="text"
            placeholder="Search students..."
            className="w-full px-3 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Student List */}
        <div className="overflow-y-auto flex-grow">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No students found
            </div>
          ) : (
            <ul>
              {filteredStudents.map((student) => (
                <li 
                  key={student.id} 
                  className="px-4 py-2 border-b text-black hover:bg-gray-500 flex justify-between items-center"
                >
                  <span>{student.username}</span>
                  <span className="text-sm text-gray-500">ID: {student.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with Student Count */}
        <div className="p-4 border-t text-center">
          <p className="text-gray-600">
            Total Students: {filteredStudents.length} / {students.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentListModal;