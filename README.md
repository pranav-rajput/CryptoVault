# 🔐 CryptoVault : Securing Cloud Storage

This is a final-year Computer Science Engineering project that provides a secure cloud-based file storage system. Users can register, log in, and securely upload/download encrypted text files. Files are encrypted using the **NLCA (New Lightweight Cryptographic algorithm)** algorithm on the server side before being uploaded to **Amazon S3**, and decrypted upon download to ensure end-to-end security.

---

## 🚀 Features

- User registration and login with secure password storage
- Upload text files with server-side NLCA encryption
- Download files with server-side NLCA decryption
- Encrypted file storage in AWS S3 bucket
- MongoDB integration for user authentication and logging
- Simple and intuitive frontend interface
- Secure file handling via RESTful APIs

---

## 🧩 Technologies Used

| Component        | Technology            |
|------------------|------------------------|
| Frontend         | HTML5, CSS3, JavaScript |
| Backend          | Node.js, Express.js     |
| Database         | MongoDB (Mongoose)      |
| Cloud Storage    | AWS S3                  |
| Encryption       | NLCA Cryptographic Algorithm |
| Hosting          | Localhost (Dev phase)   |

---

## 📁 Folder Structure

```bash
secure-cloud-storage/
│
├── backend/
│ ├── server.js
│ ├── routes/
│ ├── controllers/
│ ├── models/
│ └── utils/
│ └── nlcaCrypto.js
│
├── frontend/
│ ├── index.html
│ ├── login.html
│ ├── register.html
│ └── dashboard.html
│
├── .env
├── README.md
└── package.json

```

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranav-rajput/CryptoVault.git
   cd CryptoVault

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install

3. **Setup environment variables**
   Create a .env file in the backend/ directory:

   ```bash
   
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_bucket_name
   JWT_SECRET=your_jwt_secret

4. Start the backend server
   ```bash
   
   node server.js
   
6. Open frontend in browser
   ```bash
   
   Open frontend/index.html in your browser or serve with a local HTTP server.

---

## Future Enhancements

-Two-Factor Authentication (2FA)

-Role-based access control (RBAC)

-Upload folders and support additional file types (PDF, ZIP, etc.)

-Full cloud deployment using AWS EC2 and HTTPS

-Build cross-platform mobile app using React Native

-Add analytics dashboard, activity logs, and email alerts

-Integrate payment gateway for storage plans

---

## Key Learnings

-Full-stack development with secure authentication

-Server-side encryption/decryption logic with NLCA

-REST API integration with AWS S3

-Real-world application of cloud security principles

---

