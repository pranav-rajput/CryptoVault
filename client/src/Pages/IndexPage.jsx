// Import necessary modules
import React, { useState } from 'react';
import Header from '../Header';

export default function IndexPage() {
  const [uploadedFile, setUploadedFile] = useState(null);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      alert(`File uploaded: ${file.name}`);
    }
  };

  // Handle file download
  const handleFileDownload = () => {
    if (!uploadedFile) {
      alert('No file to download. Please upload a file first!');
      return;
    }

    // Create a URL for the file and trigger download
    const fileURL = URL.createObjectURL(uploadedFile);
    const link = document.createElement('a');
    link.href = fileURL;
    link.download = uploadedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold text-center text-gray-800 mb-4">
          File Upload and Download
        </h1>
        <div className="mb-4">
          <label
            htmlFor="fileInput"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Upload File
          </label>
          <input
            id="fileInput"
            type="file"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleFileDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Download File
          </button>
          {uploadedFile && (
            <span className="text-sm text-gray-500">{uploadedFile.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}


// import React, { useState } from 'react';
// import AWS from 'aws-sdk';
// import Header from '../Header';

// export default function IndexPage() {
//   const [file, setFile] = useState(null);
//   const [downloadUrl, setDownloadUrl] = useState('');

//   // AWS S3 Configuration
//   const s3 = new AWS.S3({
//     accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
//     region: process.env.REACT_APP_BUCKET_REGION,
//   });

//   const bucketName = 'CryptoVaultFiles';

//   // Handle file selection
//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   // Upload file to S3
//   const handleUpload = async () => {
//     if (!file) {
//       alert('Please select a file first.');
//       return;
//     }

//     const params = {
//       Bucket: bucketName,
//       Key: file.name,
//       Body: file,
//     };

//     try {
//       const uploadResult = await s3.upload(params).promise();
//       alert('File uploaded successfully!');
//       console.log(uploadResult);
//     } catch (error) {
//       console.error('Error uploading file:', error);
//       alert('Error uploading file.');
//     }
//   };

//   // Generate download URL
//   const handleDownload = async () => {
//     const params = {
//       Bucket: bucketName,
//       Key: file.name, // Assuming you want to download the same file
//     };

//     try {
//       const url = s3.getSignedUrl('getObject', params);
//       setDownloadUrl(url);
//     } catch (error) {
//       console.error('Error generating download URL:', error);
//       alert('Error generating download URL.');
//     }
//   };

//   return (
//     <div>
//       <Header />
//       <h1>This is the Index Page!!</h1>
//       <div>
//         <input type="file" onChange={handleFileChange} />
//         <button onClick={handleUpload}>Upload</button>
//         <button onClick={handleDownload}>Get Download Link</button>
//         {downloadUrl && (
//           <div>
//             <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
//               Download File
//             </a>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
