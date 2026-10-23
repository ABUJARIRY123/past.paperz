// MobileTeacherCard.jsx
import React from 'react';
import { HiPencilAlt } from "react-icons/hi";

const MobileTeacherCard = ({ user, onEdit }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-2">
        <img
          src={user.profile_picture}
          alt={user.username}
          className="w-12 h-12 bg-sky-200 dark:bg-sky-950 rounded-full mr-4"
        />
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white">{user.username}</h3>
          <p className="text-gray-600 dark:text-gray-300">Staff No: {user.staff_no}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-gray-700 dark:text-gray-300">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Designation:</span> {user.designation}
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Department:</span> {user.department}
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Gender:</span> {user.gender}
        </div>
        <div className="col-span-3">
          <span className="text-gray-500 dark:text-gray-400">Mobile:</span> {user.phone}
        </div>
      </div>
      <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onEdit(user)}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <HiPencilAlt className="mr-1" /> Edit
        </button>
      </div>
    </div>
  );
};

export default MobileTeacherCard;