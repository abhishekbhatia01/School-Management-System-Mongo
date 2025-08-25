📚 School Management System

A full-stack School Management System built with Node.js, Express, EJS, and MongoDB, designed to manage students, teachers, classes, attendance, circulars, and assignments. The system provides role-based dashboards for Admin, Teacher, and Student.

🚀 Features
👩‍💼 Admin

Manage Teachers, Students, and Classes (CRUD operations).

Publish Circulars/Notices.

Assign Classes to Teachers.

👨‍🏫 Teacher

View students of assigned classes.

Mark Attendance.

Assign Tasks/Assignments.

View Circulars from Admin.

👨‍🎓 Student

View Circulars/Notices.

View Attendance Record.

View Tasks/Assignments from Teachers.

🛠 Tech Stack

Backend: Node.js, Express

Frontend: EJS, TailwindCSS (if used)

Database: MongoDB (Mongoose ODM)

Authentication: JWT

📂 Project Structure
school-management-system/
│── models/          # Mongoose models (Student, Teacher, Class, etc.)
│── routes/          # Express routes (admin, teacher, student)
│── views/           # EJS templates (role-based dashboards & pages)
│── public/          # Static files (CSS, JS, images)
│── app.js           # Main Express app
│── package.json

⚙️ Installation & Setup

Clone the repository

git clone https://github.com/your-username/school-management-system.git
cd school-management-system


Install dependencies

npm install


Setup environment variables (create a .env file)

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000


Run the application

npm start




📌 Future Enhancements

Online Exam Module

Fee Management System

Chat/Messaging between Teachers & Students

File Uploads for Assignments

📜 License

This project is licensed under the MIT License.
