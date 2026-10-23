import React from 'react';
import { HiOutlineCog, HiBriefcase,  HiOutlineSparkles, HiOutlineTrendingUp, HiCubeTransparent } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function MaterialsEntryPage() {
  return (
    <div className="container mx-auto px-4 mt-20">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
    <Link to="/teacherdashboard?tab=midterm/phse" className="bg-gray-800 flex flex-col p-4 rounded-lg shadow-md">
    <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-white text-lg   uppercase">Home Work</h3>
          </div>
          <div>
            <HiOutlineCog className="bg-gray-600 text-white rounded-full text-5xl p-3 shadow-lg" />
          </div>
        </div>
        <div className="mt-auto text-center">
          <p className="text-white mb-2">Give out homework</p>
          <HiOutlineTrendingUp className="mx-auto bg-gray-700 text-white rounded-full text-5xl p-3 shadow-lg" />
        </div>
      </Link>
      <Link to="/teacherdashboard?tab=midterm/marks" className="bg-gray-800 flex flex-col p-4 rounded-lg shadow-md">

      <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-white text-lg   uppercase">Lesson Plans and Schemes of work</h3>
          </div>
          <div>
            <HiOutlineSparkles className="bg-gray-600 text-white rounded-full text-5xl p-3 shadow-lg" />
          </div>
        </div>
        <div className="mt-auto text-center">
          <p className="text-white mb-2">Submit Lesson Plans and Schemes of work</p>
          <HiOutlineTrendingUp className="mx-auto bg-gray-700 text-white rounded-full text-5xl p-3 shadow-lg" />
        </div>
      </Link>
      <Link to="/teacherdashboard?tab=endterm/marks" className="bg-gray-800 flex flex-col p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-white text-lg   uppercase">Assignments</h3>
          </div>
          <div>
            <HiBriefcase className="bg-gray-600 text-white rounded-full text-5xl p-3 shadow-lg" />
          </div>
        </div>
        <div className="mt-auto text-center">
          <p className="text-white mb-2">Issue an assignment</p>
          <HiOutlineTrendingUp className="mx-auto bg-gray-700 text-white rounded-full text-5xl p-3 shadow-lg" />
        </div>
      </Link>
      <Link to="/teacherdashboard?tab=attendance" className="bg-gray-800 flex flex-col p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-white text-lg   uppercase">Learning Resorces</h3>
          </div>
          <div>
            <HiCubeTransparent className="bg-gray-600 text-white rounded-full text-5xl p-3 shadow-lg" />
          </div>
        </div>
        <div className="mt-auto text-center">
          <p className="text-white mb-2">Submit Learning resorces</p>
          <HiOutlineTrendingUp className="mx-auto bg-gray-700 text-white rounded-full text-5xl p-3 shadow-lg" />
        </div>
      </Link>
     </div>
  </div>
  );
}