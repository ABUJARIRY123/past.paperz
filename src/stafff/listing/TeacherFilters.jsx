// TeacherFilters.jsx
import React from 'react';
import { HiSearch, HiUserAdd, HiRefresh } from "react-icons/hi";

const TeacherFilters = ({ filters, filterOptions, handleFilterChange, openAddModal, handleRefresh }) => {
  return (
    <div className="sticky mt-4 z-10 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
        <div className="relative">
          <input
            type="text"
            name="keyword"
            value={filters.keyword}
            onChange={handleFilterChange}
            placeholder="Search..."
            className="p-2 pl-9 w-full border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <HiSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        <select
          name="designation"
          value={filters.designation}
          onChange={handleFilterChange}
          className="cursor-pointer p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">All Designations</option>
          {filterOptions.designations.map(designation => (
            <option key={designation} value={designation}>{designation}</option>
          ))}
        </select>
        <select
          name="department"
          value={filters.department}
          onChange={handleFilterChange}
          className="cursor-pointer p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">All Departments</option>
          {filterOptions.departments.map(department => (
            <option key={department} value={department}>{department}</option>
          ))}
        </select>
        <select
          name="gender"
          value={filters.gender}
          onChange={handleFilterChange}
          className="cursor-pointer p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">Gender</option>
          {filterOptions.genders.map(gender => (
            <option key={gender} value={gender}>{gender}</option>
          ))}
        </select>
        <div className="col-span-1">
          <button
            onClick={openAddModal}
            className="cursor-pointer bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white p-2 rounded flex items-center w-full justify-center transition-colors"
          >
            <HiUserAdd className="mr-1" /> Add Teacher
          </button>
        </div>
        <div className="col-span-1">
          <button
            onClick={handleRefresh}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-2 rounded flex items-center w-full justify-center transition-colors"
          >
            <HiRefresh className="mr-1" /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherFilters;