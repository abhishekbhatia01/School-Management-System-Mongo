# 🎓 School Management System  

A **full-stack School Management System** built with **Node.js, Express, EJS, and MongoDB**.  
This project provides **role-based dashboards** for **Admin, Teacher, and Student** to simplify school operations.  

---

# 🚀 Features  

## 👩‍💼 Admin Panel  
- ✅ Manage **Teachers, Students, and Classes** (CRUD)  
- ✅ Publish **Circulars / Notices**  
- ✅ Assign **Classes to Teachers**  

## 👨‍🏫 Teacher Panel  
- ✅ View **Students of Assigned Classes**  
- ✅ Mark **Attendance**  
- ✅ Create & Share **Assignments**  
- ✅ View **Admin Circulars**  

## 👨‍🎓 Student Panel  
- ✅ View **Circulars & Notices**  
- ✅ Check **Attendance Record**  
- ✅ View **Assignments from Teachers**  

---

# 🛠 Tech Stack  
- **Backend:** Node.js, Express.js  
- **Frontend:** EJS (with TailwindCSS if used)  
- **Database:** MongoDB (Mongoose ODM)  
- **Authentication:** JWT  

---

school-management-system/
│── models/ # Mongoose Models (Student, Teacher, Class, etc.)
│── routes/ # Express Routes (Admin, Teacher, Student)
│── views/ # EJS Templates (Dashboards & Pages)
│── public/ # Static Assets (CSS, JS, Images)
│── app.js # Main Express App
│── package.json # Dependencies & Scripts

---


# ⚙️ Installation & Setup  

1️⃣ **Clone the Repository**  
git clone https://github.com/your-username/school-management-system.git
cd school-management-system
2️⃣ Install Dependencies


Copy
Edit
npm install
3️⃣ Create Environment File (.env)

env
Copy
Edit
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
4️⃣ Run the Server


Copy
Edit
npm start

---

]

##📌 Future Enhancements

📑 Online Exam Module

💰 Fee Management System

💬 Chat/Messaging between Teachers & Students

📂 File Uploads for Assignments
## 📂 Project Structure  

---

#📜 License

This project is licensed under the MIT License.
