import React, { useState, useRef, useEffect } from 'react';
import { RadioTower, Layers, NotebookPen, Upload, FileText, X, Search, GraduationCap, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../subjects/SharedComponent';

const ClassSubjectsForm = ({
  formData,
  handleFilterChange,
  handleDragOver,
  handleDrop,
  handleFileChange,
  handleInputChange,
  removeFile,
  teacherAllocations = [],
  loading = false,
  files,
  uploadProgress,
  previews
}) => {
  const [isLessonDropdownOpen, setIsLessonDropdownOpen] = useState(false);
  const [lessonSearchTerm, setLessonSearchTerm] = useState('');
  const lessonDropdownRef = useRef(null);
  const [linkError, setLinkError] = useState('');
  
  // Comprehensive list of lessons
  const lessonNumbers = [
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
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (lessonDropdownRef.current && !lessonDropdownRef.current.contains(event.target)) {
        setIsLessonDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Derive available classes and subjects
  const availableClasses = teacherAllocations.length
    ? [...new Set(teacherAllocations.flatMap(alloc => alloc.classAndSection))]
    : [];
    
  const availableSubjects = formData.classAndSection
    ? [...new Set(teacherAllocations
        .filter(alloc => alloc.classAndSection.includes(formData.classAndSection))
        .flatMap(alloc => alloc.subject_names)
      )]
    : [];
    
  // Filter lessons based on search term
  const filteredLessons = lessonNumbers.filter(lesson =>
    lesson.toLowerCase().includes(lessonSearchTerm.toLowerCase())
  );
  
  // Handle single lesson selection
  const handleLessonSelect = (lesson) => {
    handleFilterChange({
      target: {
        name: 'lessonNumber',
        value: lesson
      }
    });
    setIsLessonDropdownOpen(false);
  };
  
  // Validate YouTube link
  const validateYouTubeLink = (link) => {
    if (!link) return true; // Empty is valid (will be caught by required check)
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(link);
  };
  
  // Handle video link input with validation
  const handleVideoLinkChange = (e) => {
    const link = e.target.value;
    
    if (link && !validateYouTubeLink(link)) {
      setLinkError('Please enter a valid YouTube link');
      // Allow typing but don't update formData with invalid link
      return;
    }
    
    setLinkError('');
    handleInputChange(e);
  };
  
  // Handle paste event for video link
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    
    if (!validateYouTubeLink(pastedText)) {
      e.preventDefault();
      setLinkError('Only YouTube links are allowed');
    } else {
      setLinkError('');
    }
  };
  
  return (
    <Card className='mt-16 dark:bg-gray-800 bg-white'>
      <CardHeader className='dark:bg-gray-700 bg-gray-50'>
        <CardTitle className="text-center">Select Resource Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 md:grid-cols-${formData.resourceType === 'Power Points' || formData.resourceType === 'Video Links' || formData.resourceType === 'Work Sheets' || formData.resourceType === 'Video' ? '4' : '3'} gap-4 mt-2`}>
          {/* Resource Type Selection */}
          <div className="form-group">
            <label className="flex items-center mb-2">
              <NotebookPen className="mr-2 text-blue-500" size={20} />
              Resource Type
            </label>
            <select
              name="resourceType"
              value={formData.resourceType}
              onChange={handleFilterChange}
              className="w-full px-3 dark:bg-gray-700 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select A Resource Type</option>
              <option value="Schemes of Work">Schemes of Work</option>
              <option value="Curriculum Map">Curriculum Map</option>
              <option value="Video">Video</option>
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
          
          {/* Class Selection */}
          <div className="form-group">
            <label className="flex items-center mb-2">
              <Layers className="mr-2 text-blue-500" size={20} />
              Classes
            </label>
            <select
              name="classAndSection"
              value={formData.classAndSection}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              disabled={loading || teacherAllocations.length === 0}
            >
              {loading ? (
                <option value="">Loading classes...</option>
              ) : teacherAllocations.length === 0 ? (
                <option value="">No classes found</option>
              ) : (
                <>
                  <option value="">Select A Class</option>
                  {availableClasses.map(classSection => (
                    <option key={classSection} value={classSection}>
                      {classSection}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          
          {/* Subject Selection */}
          <div className="form-group">
            <label className="flex items-center mb-2">
              <GraduationCap className="mr-2 text-blue-500" size={20} />
              Subject
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleFilterChange}
              className="w-full px-3 dark:bg-gray-700 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.classAndSection || loading}
            >
              <option value="">
                {!formData.classAndSection ? 'Select a class first' : 'Select a Subject'}
              </option>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          
          {/* Lesson Number Selection for Power Points, Video Links, Work Sheets */}
          {(formData.resourceType === 'Power Points' || formData.resourceType === 'Video Links' || formData.resourceType === 'Work Sheets' || formData.resourceType === 'Video') && (
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
                    {formData.lessonNumber || 'Select a Lesson'}
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
                          ${formData.lessonNumber === lesson ? 'bg-blue-50' : ''}`}
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
        
        {/* Conditionally render Video Link or File Upload */}
        {formData.resourceType === 'Video Links' ? (
          <div className="mt-4 space-y-4">
            <div className="form-group relative">
              <label className="text-center">Video Link</label>
              <textarea
                name="videoLink"
                value={formData.videoLink || ''}
                onChange={handleVideoLinkChange}
                onPaste={handlePaste}
                className={`mt-4 w-full px-3 py-2 border rounded-md dark:bg-gray-800 bg-white h-16 dark:placeholder-gray-400 ${
                  linkError ? 'border-red-500' : ''
                }`}
                placeholder="Paste your YouTube video link here"
                required
              />
              {linkError && (
                <p className="text-red-500 text-sm mt-1">{linkError}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-8">
            {files.length === 0 && (
              <div
                className="border-2 border-dashed dark:bg-gray-700 rounded-lg p-6 text-center relative"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
               <input
  type="file"
  id="file-upload"
  className="hidden"
  onChange={handleFileChange}
  accept=".pdf,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.ogg,.xlsx,.xls,.csv" // Added Excel formats
/>
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <Upload className="h-12 w-12 mx-auto" />
                  <p className="mt-2 text-sm">
                    Drag and drop your files here, or click to browse
                  </p>
                  <p className="text-xs mt-1">
  Supported formats: PDF, PowerPoint, Excel, images (JPEG, PNG, GIF, WebP), and videos (MP4, WebM, OGG)
</p>
                </label>
              </div>
            )}
            {files.length > 0 && (
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-500">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {uploadProgress[file.name] || 0}%
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name] || 0}%` }}
                      />
                    </div>
                    {previews[file.name] && (
                      <div className="mt-4">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={previews[file.name]}
                            alt={`Preview of ${file.name}`}
                            className="max-h-40 rounded-md mx-auto object-contain"
                          />
                        ) : file.type === 'application/pdf' ? (
                          <div className="border rounded-md p-2 bg-white">
                            <embed
                              src={previews[file.name]}
                              type="application/pdf"
                              className="w-full h-40"
                            />
                          </div>
                        ) : file.type.startsWith('video/') ? (
                          <video
                            controls
                            className="w-full max-h-40 rounded-md"
                          >
                            <source src={previews[file.name]} type={file.type} />
                            Your browser does not support the video tag.
                          </video>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassSubjectsForm;