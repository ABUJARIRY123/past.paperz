import React, { useRef, useState, useEffect } from 'react';
import { Search, ChevronDown, FileText, RadioTower } from 'lucide-react';

const ClassSubjectDropdowns = ({
  formData,
  setFormData,
  availableClasses,
  availableSubjects,
  resource,
  initialSubject
}) => {
  const [isLessonDropdownOpen, setIsLessonDropdownOpen] = useState(false);
  const [lessonSearchTerm, setLessonSearchTerm] = useState('');
  const lessonDropdownRef = useRef(null);
  
  const lesson_numbers = [
    'Lesson One', 'Lesson Two', 'Lesson Three', 'Lesson Four', 'Lesson Five',
    'Lesson Six', 'Lesson Seven', 'Lesson Eight', 'Lesson Nine', 'Lesson Ten',
    'Lesson Eleven', 'Lesson Twelve', 'Lesson Thirteen', 'Lesson Fourteen',
    'Lesson Fifteen', 'Lesson Sixteen', 'Lesson Seventeen', 'Lesson Eighteen',
    'Lesson Nineteen', 'Lesson Twenty', 'Lesson Twenty One', 'Lesson Twenty Two',
    'Lesson Twenty Three', 'Lesson Twenty Four', 'Lesson Twenty Five',
    'Lesson Twenty Six', 'Lesson Twenty Seven', 'Lesson Twenty Eight',
    'Lesson Twenty Nine', 'Lesson Thirty', 'Lesson Thirty One', 'Lesson Thirty Two',
    'Lesson Thirty Three'
  ];
  
  const filteredLessons = lesson_numbers.filter(lesson =>
    lesson.toLowerCase().includes(lessonSearchTerm.toLowerCase())
  );
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (lessonDropdownRef.current && !lessonDropdownRef.current.contains(event.target)) {
        setIsLessonDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleClassChange = (selectedClass) => {
    setFormData(prev => ({
      ...prev,
      class_and_section: selectedClass,
      subject: selectedClass !== resource.class_and_section ? '' : initialSubject
    }));
  };
  
  // Fixed lesson selection function
  const handleLessonSelect = (lesson) => {
    setFormData(prev => ({
      ...prev,
      lesson_number: lesson // Update lesson_number in formData
    }));
    setIsLessonDropdownOpen(false);
  };
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${formData.resource_type === 'Power Points' || formData.resource_type === 'Video Links' || formData.resource_type === 'Work Sheets' || formData.resource_type === 'Video' ? '4' : '3'} gap-4 mt-2`}>
      <div>
        <label className="flex items-center mb-2">
          <FileText className="mr-2 text-blue-500" size={20} />
          Resource Type
        </label>
        <select
          value={formData.resource_type}
          onChange={(e) => setFormData(prev => ({...prev, resource_type: e.target.value}))}
          className="w-full p-2 rounded border dark:bg-gray-700"
          required
        >
          <option value="Schemes of Work">Schemes of Work</option>
          <option value="">Select A Resource Type</option>
          <option value="Schemes of Work">Schemes of Work</option>
          <option value="Couse Outline">Course Outline</option>
          <option value="Power Points">Power Points</option>
          <option value="Work Sheets">Work Sheets</option>
          <option value="Work Book">Work Book</option>
          <option value="Video Links">Video Links</option>
          <option value="Tracking Forms">Tracking Forms</option>
          <option value="Formative Assessment 1">Formative Assessment 1</option>
          <option value="Formative Assessment 2">Formative Assessment 2</option>
          <option value="Formative Assessment 3">Formative Assessment 3</option>
          <option value="Formative Assessment 4">Formative Assessment 4</option>
          <option value="End Term Exam Paper 1">End Term Exam Paper 1</option>
          <option value="End Term Exam Paper 2">End Term Exam Paper 2</option>
          <option value="End Term Exam Paper 3">End Term Exam Paper 3</option>
          <option value="End Term Exam Paper 4">End Term Exam Paper 4</option>
          <option value="End Term Exam Paper 5">End Term Exam Paper 5</option>
          <option value="End Term Exam Paper 6">End Term Exam Paper 6</option>
          <option value="End Term Exam Paper 12">End Term Exam Paper 12</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center mb-2">
          <FileText className="mr-2 text-blue-500" size={20} />
          Class
        </label>
        <select
          value={formData.class_and_section}
          onChange={(e) => handleClassChange(e.target.value)}
          className="w-full p-2 rounded border dark:bg-gray-700"
          required
        >
          <option value="">Select a Class</option>
          {availableClasses.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="flex items-center mb-2">
          <FileText className="mr-2 text-blue-500" size={20} />
          Subject
        </label>
        <select
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
          className="w-full p-2 rounded border dark:bg-gray-700"
          required
        >
          <option value="">Select Subject</option>
          {initialSubject && !availableSubjects.includes(initialSubject) && (
            <option key={initialSubject} value={initialSubject}>
              {initialSubject}
            </option>
          )}
          {availableSubjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>
      
      {(formData.resource_type === 'Power Points' || formData.resource_type === 'Video Links' || formData.resource_type === 'Work Sheets' || formData.resource_type === 'Video') && (
        <div className="form-group w-full relative" ref={lessonDropdownRef}>
          <label className="flex items-center mb-2">
            <RadioTower className="mr-2 text-blue-500" size={20} />
            Lesson Number
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLessonDropdownOpen(!isLessonDropdownOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-left dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none flex items-center justify-between"
            >
              <span>
                {formData.lesson_number || 'Select a Lesson'}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                  isLessonDropdownOpen ? 'transform rotate-180' : ''
                }`}
              />
            </button>
            
            {isLessonDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search lessons..."
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black placeholder-gray-500"
                      value={lessonSearchTerm}
                      onChange={(e) => setLessonSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {filteredLessons.map((lesson) => (
                    <div
                      key={lesson}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer
                        ${formData.lesson_number === lesson ? 'bg-blue-50' : ''}`}
                      onClick={() => handleLessonSelect(lesson)}
                    >
                      <div className="font-medium text-gray-900">{lesson}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSubjectDropdowns;