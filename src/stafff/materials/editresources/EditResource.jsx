import React, { useState, useEffect } from 'react';
import { Save, Download, AlertTriangle, Link } from 'lucide-react';
import { Alert, AlertDescription } from '../SharedComponent';
import ClassSubjectDropdowns from './ClassSubjectDropdowns';
import FileUpload from './DragAndDrop';
import { deleteFileFromFirebase, uploadFileToFirebase } from './deleteFileFromFirebase';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signoutSuccess } from '../../../redux/user/userSlice';

const EditResource = ({ resource, onUpdate, availableClasses, availableSubjects }) => {
  const { currentUser } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    resource_type: resource.resource_type || '',
    class_and_section: resource.class_and_section || '',
    subject: resource.subject || '',
    term: resource.term || '',
    lesson_number: resource.lesson_number || '',
    file_url: resource.file_url || '',
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [linkError, setLinkError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    dispatch(signoutSuccess());
    navigate('/sign-in');
  };
  
  useEffect(() => {
    const isChanged =
      formData.resource_type !== (resource.resource_type || '') ||
      formData.class_and_section !== (resource.class_and_section || '') ||
      formData.subject !== (resource.subject || '') ||
      formData.term !== (resource.term || '') ||
      // Updated to use lesson_number property
      formData.lesson_number !== (resource.lesson_number || '') ||
      (formData.resource_type === 'Video Links' ?
        formData.file_url !== resource.file_url :
        file !== null);
    
    setHasChanges(isChanged);
  }, [formData, file, resource]);
  
  const handleFileChange = (newFile, progressCallback) => {
    setFile(newFile);
    setUploadProgress(() => progressCallback);
  };
  
  // Validate YouTube link
  const validateYouTubeLink = (link) => {
    if (!link) return true; // Empty is valid (will be caught by required check)
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(link);
  };
  
  // Handle video link input with validation
  const handlefile_urlChange = (e) => {
    const link = e.target.value;
    setFormData(prev => ({...prev, file_url: link}));
    
    if (link && !validateYouTubeLink(link)) {
      setLinkError('Please enter a valid YouTube link');
      return;
    }
    setLinkError('');
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validate required fields
    const requiredFields = ['resource_type', 'class_and_section', 'subject', 'term'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }
    
    // Validate video link for Video Links resource type
    if (formData.resource_type === 'Video Links') {
      if (!formData.file_url) {
        setError('Please enter a YouTube video link');
        setLoading(false);
        return;
      }
      
      if (!validateYouTubeLink(formData.file_url)) {
        setError('Please enter a valid YouTube link');
        setLoading(false);
        return;
      }
    }
    
    try {
      let updatedFileUrl = formData.file_url;
      
      // For Video Links, use the file_url as the file_url
      if (formData.resource_type === 'Video Links') {
        updatedFileUrl = formData.file_url;
      }
      // For other resource types, handle file upload if there's a new file
      else if (file) {
        try {
          // Upload new file with the correct parameters
          updatedFileUrl = await uploadFileToFirebase(
            file,
            formData,
            currentUser,
            (progress) => {
              if (uploadProgress) {
                uploadProgress(progress);
              }
            }
          );
          
          // Delete old file if it exists
          if (resource.file_url && resource.resource_type !== 'Video Links') {
            try {
              await deleteFileFromFirebase(resource.file_url);
              console.log('Old file deleted successfully');
            } catch (deleteError) {
              console.error('Failed to delete old file:', deleteError);
              // Don't block the update process if deletion fails
            }
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setError('Failed to upload new file. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // Prepare the updated data
      const updatedData = {
        ...formData,
        file_url: updatedFileUrl,
        // Map lesson_number to lesson_number for API consistency
        updated_by: currentUser.username,
      };
      
      // Send update request to backend
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/staff/updateResource/${resource.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(updatedData)
        }
      );
      
      const data = await response.json();
      
      // Handle session expiry
      if (data.logout) {
        handleLogout();
        return;
      }
      
      // Check for other error responses
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update resource');
      }
      
      // Success handling
      setSuccess('Resource updated successfully');
      setHasChanges(false); // Reset the changes flag
      
      // Clear file selection
      setFile(null);
      
      // Update parent component after short delay
      setTimeout(() => {
        if (onUpdate) {
          onUpdate(updatedData);
        }
      }, 1000);
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'An unexpected error occurred while updating the resource');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 shadow-xl dark:bg-gray-800 rounded-lg">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-500">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <ClassSubjectDropdowns
          formData={formData}
          setFormData={setFormData}
          availableClasses={availableClasses}
          availableSubjects={availableSubjects}
          resource={resource}
          initialSubject={resource.subject}
        />
        
        {/* Conditional rendering based on resource type */}
        {formData.resource_type === 'Video Links' ? (
          <div className="space-y-4">
            <div className="form-group">
              <label className="flex items-center mb-2">
                <Link className="mr-2 text-blue-500" size={20} />
                YouTube Video Link
              </label>
              <textarea
                value={formData.file_url || ''}
                onChange={handlefile_urlChange}
                onPaste={handlePaste}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 h-24 ${
                  linkError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Paste your YouTube video link here"
              />
              {linkError && (
                <p className="text-red-500 text-sm mt-1">{linkError}</p>
              )}
            </div>
            
            {/* Preview for video links */}
            {formData.file_url && validateYouTubeLink(formData.file_url) && (
              <div className="p-4 dark:bg-gray-700 shadow-xl rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Video Preview</h3>
                  <a
                    href={formData.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Open in new tab
                  </a>
                </div>
                <div className="aspect-video w-full">
                  <iframe
                    src={formData.file_url.replace('youtube.com/watch?v=', 'youtube.com/embed/')}
                    className="w-full h-full rounded"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {resource.file_url && (
              <div className="p-4 dark:bg-gray-700 shadow-xl rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <span>
                      Check if the current file is the correct one, if not kindly update it using the <b>Drag and Drop</b> area below.
                    </span>
                  </div>
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            )}
            
            <FileUpload
              onFileChange={handleFileChange}
              existingFile={formData.file}
            />
          </>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Updating Resource...' : hasChanges ? 'Update Resource' : 'No Changes Made Yet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditResource;