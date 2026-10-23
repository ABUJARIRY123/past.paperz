// TeacherTable.jsx
import React from 'react';
import { HiPencilAlt } from "react-icons/hi";
import CustomTable from '../../components/CustomTable';

const TeacherTable = ({ currentUsers, openEditModal }) => {
  const tableHeaders = [
    'Name',
    'Staff No.',
    'Designation',
    'Department',
    'Gender',
    'Mobile',
    'Actions'
  ];

  return (
    <div className="overflow-x-auto">
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
        <CustomTable headers={tableHeaders}>
          {currentUsers.map((user) => (
            <CustomTable.Row key={user.id}>
              <CustomTable.Cell>{user.username}</CustomTable.Cell>
              <CustomTable.Cell>{user.staff_no}</CustomTable.Cell>
              <CustomTable.Cell>{user.designation}</CustomTable.Cell>
              <CustomTable.Cell>{user.department}</CustomTable.Cell>
              <CustomTable.Cell>{user.gender}</CustomTable.Cell>
              <CustomTable.Cell>{user.phone}</CustomTable.Cell>
              <CustomTable.Cell>
                <span
                  onClick={() => openEditModal(user)}
                  className="font-medium text-blue-600 dark:text-white hover:underline cursor-pointer"
                >
                  <HiPencilAlt className="inline-block mr-1" /> Edit
                </span>
              </CustomTable.Cell>
            </CustomTable.Row>
          ))}
        </CustomTable>
      </div>
    </div>
  );
};

export default TeacherTable;