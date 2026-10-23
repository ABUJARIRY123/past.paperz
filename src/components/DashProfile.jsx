import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { EyeIcon, EyeOffIcon, CheckCircleIcon, XCircleIcon, CameraIcon } from 'lucide-react';
import { updateStart, updateFailure, updateSuccess, signoutSuccess } from '../redux/user/userSlice';

export default function DashProfile() {
  const { currentUser, error, loading } = useSelector((state) => state.user);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const [imageFileUploadProgress, setImageFileUploadProgress] = useState(null);
  const [imageFileUploadError, setImageFileUploadError] = useState(null);
  const [imageFileUploading, setImageFileUploading] = useState(false);
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const [formData, setFormData] = useState({});
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const filePickerRef = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setImageFileUploadError('Please upload only image files (JPEG, PNG, GIF, WEBP)');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageFileUploadError('File size must be less than 2MB');
      return;
    }

    setImageFile(file);
    setImageFileUrl(URL.createObjectURL(file));
    setImageFileUploadError(null);
  };

  useEffect(() => {
    if (imageFile) {
      uploadImage();
    }
  }, [imageFile]);

  const handleLogout = () => {
    dispatch(signoutSuccess());
    navigate('/sign-in');
  };

  const uploadImage = async () => {
    try {
      setImageFileUploading(true);
      setImageFileUploadError(null);
      const storage = getStorage(app);
      const fileName = new Date().getTime() + imageFile.name;
      const storagePath = `profilepictures/${currentUser.full_name}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImageFileUploadProgress(progress.toFixed(0));
        },
        () => {
          setImageFileUploadError('Could not upload image (File must be less than 2MB)');
          setImageFileUploadProgress(null);
          setImageFile(null);
          setImageFileUrl(null);
          setImageFileUploading(false);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setImageFileUrl(downloadURL);
            setFormData({ ...formData, profile_picture: downloadURL });
            setImageFileUploading(false);
          });
        }
      );
    } catch (error) {
      setImageFileUploadError('Error uploading image: ' + error.message);
      setImageFileUploading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.id === 'password') {
      setPasswordValue(e.target.value);
    }
    setFormData({
      ...formData,
      profile_picture: imageFileUrl ? imageFileUrl : currentUser.profile_picture,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);

    if (Object.keys(formData).length === 0) {
      setUpdateUserError('No changes made');
      return;
    }
    if (imageFileUploading) {
      setUpdateUserError('Please wait for image to upload');
      return;
    }

    try {
      dispatch(updateStart());
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/update/${currentUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.logout) {
        handleLogout();
        return;
      }

      if (res.ok) {
        dispatch(updateSuccess(data));
        setUpdateUserSuccess("Your profile has been updated successfully");
        setPasswordValue('');
        setFormData({});

        setTimeout(() => {
          switch (currentUser.role) {
            case 'Admin':
              navigate('/admindashboard?tab=madrasa/noticeboard');
              break;
            case 'Student':
              navigate('/studentdashboard?tab=studentsdash');
              break;
            case 'Parent':
              navigate('/parentdashboard?tab=madrasa/noticeboard');
              break;
            case 'Library':
              navigate('/librarydashboard?tab=madrasa/noticeboard');
              break;
            case 'Teacher':
              navigate('/teacherdashboard?tab=madrasa/noticeboard');
              break;
            default:
              navigate('/');
          }
        }, 1500);
      } else {
        dispatch(updateFailure(data.message));
        setUpdateUserError(data.message);
      }
    } catch (error) {
      dispatch(updateFailure(error.message));
      setUpdateUserError(error.message);
    }
  };

  useEffect(() => {
    if (updateUserSuccess || updateUserError || error) {
      const timeoutId = setTimeout(() => {
        setUpdateUserSuccess(null);
        setUpdateUserError(null);
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [updateUserSuccess, updateUserError, error]);

  const displayError = updateUserError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">Your Profile</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              ref={filePickerRef}
              hidden
            />

            <div className="flex flex-col items-center gap-2 mb-2">
              <div
                className="relative w-28 h-28 cursor-pointer group"
                onClick={() => filePickerRef.current.click()}
              >
                {imageFileUploadProgress && (
                  <CircularProgressbar
                    value={imageFileUploadProgress || 0}
                    text={`${imageFileUploadProgress}%`}
                    strokeWidth={5}
                    styles={{
                      root: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
                      path: { stroke: `rgba(22, 163, 74, ${imageFileUploadProgress / 100})` },
                      text: { fill: '#15803d', fontSize: '22px' },
                    }}
                  />
                )}
                <img
                  src={imageFileUrl || currentUser.profile_picture}
                  alt="Profile"
                  className={`rounded-full w-full h-full object-cover border-4 border-green-100 shadow-sm transition-opacity ${
                    imageFileUploadProgress && imageFileUploadProgress < 100 ? 'opacity-60' : ''
                  }`}
                />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <CameraIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-xs text-gray-500">Click photo to change</span>
            </div>

            {imageFileUploadError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{imageFileUploadError}</p>
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                User Name
              </label>
              <input
                id="full_name"
                type="text"
                value={currentUser.full_name}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={currentUser.email}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={loading || imageFileUploading}
              className={`mt-2 cursor-pointer w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg transition-all duration-300 ${
                loading || imageFileUploading
                  ? 'text-white bg-gray-400 cursor-not-allowed'
                  : 'text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600'
              }`}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {(updateUserSuccess || displayError) && (
          <div className="fixed top-4 right-4 z-50 w-full max-w-sm px-4 sm:px-0">
            {updateUserSuccess && (
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 shadow-md">
                <CheckCircleIcon className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-900">{updateUserSuccess}</p>
              </div>
            )}
            {displayError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 shadow-md mt-2">
                <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}