import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../../firebase';

export const handleUploadFile = async (files, setUploadProgress, setAlert, formData) => {
  if (files.length === 0) {
    setAlert({ show: true, message: 'Please attach a file.', type: 'failure' });
    return null;
  }

  const storage = getStorage(app);
  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      // Create the nested folder structure
      
      // Construct the full path using formData
      const folderPath = `resources/${formData.term}/${formData.classAndSection}/${formData.resourceType}/${formData.subject}/${formData.created_by}`;
      
      // Create the full file path including the folder structure
      const fileName = `${folderPath}/${new Date().getTime()}-${file.name}`;
      
      // Create reference to this specific path
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        },
        (error) => {
          setAlert({ show: true, message: 'File upload failed.', type: 'failure' });
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          }).catch(reject);
        }
      );
    });
  });

  try {
    const fileUrls = await Promise.all(uploadPromises);
    return fileUrls[0];
  } catch (error) {
    console.error('Upload error:', error);
    setAlert({ show: true, message: 'File upload failed.', type: 'failure' });
    return null;
  }
};