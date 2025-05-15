import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import FileEncryption from '../utils/FileEncryption';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:4000'; // Adjust this to your API URL

export default function IndexPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useContext(UserContext);

  // Fetch user's files when component mounts
  useEffect(() => {
    if (user) {
      fetchUserFiles();
    }
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Function to fetch user's files from the server
  const fetchUserFiles = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/files', { withCredentials: true });
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setErrorMessage('Failed to fetch files: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection for upload
  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  // Handle encryption key input
  const handleKeyChange = (e) => {
    setEncryptionKey(e.target.value);
  };

  // Handle file upload with encryption
  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!uploadedFiles.length) {
      setErrorMessage("Please select a file to upload");
      return;
    }
    
    if (!encryptionKey) {
      setErrorMessage("Please enter an encryption key");
      return;
    }
    
    try {
      setIsLoading(true);
      
      for (const file of uploadedFiles) {
        // Encrypt file...
        const encryptedBlob = await FileEncryption.encryptFile(file, encryptionKey);
        
        const encryptedFile = new File(
          [encryptedBlob], 
          file.name + '.encrypted', 
          { type: 'text/plain' }
        );
        
        const formData = new FormData();
        formData.append('file', encryptedFile);
        formData.append('originalType', file.type);
        formData.append('originalName', file.name);
        
        // Send using session authentication (cookies)
        await axios.post('/api/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        });
      }
        
      // Refresh the file list
      await fetchUserFiles();
      
      // Clear the encryption key after successful upload
      setEncryptionKey('');
      // Clear the file list
      setUploadedFiles([]);
      document.getElementById('file-upload').value = '';
      // Show success message
      setSuccessMessage("Files encrypted and uploaded successfully!");
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Failed to upload file: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file download with decryption
  const handleDownload = async (fileId, fileName, originalType) => {
    try {
      // Prompt for encryption key
      const key = prompt('Enter decryption key for ' + fileName);
      if (!key) return;
      
      // Show loading indicator
      setIsLoading(true);
      
      // Request encrypted file from server
      const response = await axios.get(`/api/files/download/${fileId}`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      // Get the encrypted content
      const encryptedBlob = response.data;
      
      try {
        // Decrypt the file
        const decryptedBlob = await FileEncryption.decryptFile(
          encryptedBlob, 
          key,
          originalType || 'application/octet-stream'
        );
        
        // Download the decrypted file
        const url = URL.createObjectURL(decryptedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.replace('.encrypted', '');
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setSuccessMessage('File decrypted successfully!');
      } catch (error) {
        // This likely means the decryption key was incorrect
        setErrorMessage('Failed to decrypt file. Please check your decryption key.');
        console.error('Decryption error:', error);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setErrorMessage('Failed to download file: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      setIsLoading(true);
      await axios.delete(`/api/files/${fileId}`, { withCredentials: true });
      
      // Refresh the file list
      await fetchUserFiles();
      setSuccessMessage('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      setErrorMessage('Failed to delete file: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center flex-col min-h-screen">
        <h1 className="text-4xl mb-4">Welcome to CryptoVault</h1>
        <p className="mb-4">Please log in to access your secure files.</p>
        <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Secure Files</h1>
      
      {/* Status Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
          {errorMessage}
        </div>
      )}
      
      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Encrypted File</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Select File</label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="border rounded w-full py-2 px-3"
              multiple
            />
            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {uploadedFiles.length} file(s) selected
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Encryption Key</label>
            <input
              type="password"
              value={encryptionKey}
              onChange={handleKeyChange}
              className="border rounded w-full py-2 px-3"
              placeholder="Enter encryption key"
            />
            <p className="text-sm text-gray-500 mt-1">
              Remember this key! You'll need it to decrypt your files.
            </p>
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
            disabled={isLoading || !uploadedFiles.length || !encryptionKey}
          >
            {isLoading ? 'Encrypting & Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>
      
      {/* File List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Your Files</h2>
        
        {isLoading && files.length === 0 ? (
          <p className="text-gray-500">Loading your files...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-500">You haven't uploaded any files yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {file.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Math.round(file.fileSize / 1024)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(file.uploadDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleDownload(file._id, file.fileName, file.originalType)}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={isLoading}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}