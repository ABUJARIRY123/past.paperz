import React, { useState } from 'react';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { AlertDescription, Alert } from '../SharedComponent';


const FileUpload = ({ onFileChange, existingFile }) => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previews, setPreviews] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileChange = (e) => {
    handleFiles(Array.from(e.target.files));
  };

  const handleFiles = (selectedFiles) => {
    const validFiles = selectedFiles.filter(file => 
      [  'application/pdf', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // For .xlsx
        'application/vnd.ms-excel', // For .xls
        'text/csv', // For .csv files
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'image/webp',
        'video/mp4', 
        'video/webm', 
        'video/ogg'].includes(file.type)
    );
    
    if (validFiles.length === 0) {
      setAlert({
        show: true,
        message: 'Invalid file type. The document should either be a PDF or Power Point.',
        type: 'destructive'
      });
      return;
    }
    
    setFiles(validFiles);
    setAlert({ show: false, message: '', type: '' });
    
    // Initialize progress for each file
    const initialProgress = {};
    validFiles.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);
    
    // Pass both the file and a progress callback
    if (validFiles[0]) {
      onFileChange(validFiles[0], (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [validFiles[0].name]: progress
        }));
      });
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({...prev, [file.name]: reader.result}));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    const removedFile = newFiles[index];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[removedFile.name];
      return updated;
    });
    onFileChange(null);
  };

  return (
    <div className="space-y-4">
      {alert.show && (
        <Alert className="mt-2 flex items-center gap-2" variant={alert.type}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="m-0">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {files.length === 0 && (
        <div 
          className="border-2 border-dashed dark:bg-gray-700 bg-gray-300 rounded-lg p-6 text-center"
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
                <span className="text-sm text-gray-500">
                  {Math.round(uploadProgress[file.name] || 0)}%
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress[file.name] || 0}%` }}
                />
              </div>

              {previews[file.name] && (
                <div className="mt-2">
                  {file.type === 'application/pdf' ? (
                    <embed
                      src={previews[file.name]}
                      type="application/pdf"
                      className="w-full h-48 border rounded"
                      title={`Preview of ${file.name}`}
                    />
                  ) : (
                    <div className="text-sm text-black text-center py-2">
                      Preview not available for this file type
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;