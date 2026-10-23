import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../firebase';


export const deleteFileFromFirebase = async (fileUrl) => {
  try {
    if (!fileUrl) {
      console.warn('No file URL provided for deletion');
      return;
    }
    
    const fileRef = ref(storage, decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]));
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};


export const uploadFileToFirebase = async (file, formData, currentUser, onProgress) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}-${file.name}`;

      // Construct the full path
      const path = `resources/${formData.term}/${formData.class_and_section}/${formData.resource_type}/${formData.subject}/${currentUser.username}/${fileName}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('Error in upload setup:', error);
      reject(error);
    }
  });
};