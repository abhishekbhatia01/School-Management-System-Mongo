const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const JWT_SECRET = 'secretkeyyyy';

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('DB connection error:', err));



const User = require('./models/account');
const Class = require('./models/class');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Circular = require('./models/Circular');
const Attendance = require('./models/Attendance');
const Task = require('./models/Task');




const authenticateTeacher = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'teacher') return res.redirect('/login?error=access');
    
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return res.redirect('/login?error=invalid');
    
    req.teacher = teacher;
    next();
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
};



const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'student') return res.redirect('/login?error=access');
    
    const student = await Student.findOne({ userId: decoded.userId }).populate('classId');
    if (!student) return res.redirect('/login?error=invalid-account');
    
    req.student = student;
    next();
  } catch (error) {
    console.error('Student authentication error:', error);
    res.redirect('/login');
  }
};



// Landing
app.get('/', (req, res) => res.render('landing/index'));
app.get('/guest', (req, res)=> {
  res.render('landing/guest');
})

app.get('/login', (req, res) => {
    res.render("landing/login", { message: null });
});

app.get('/signup', (req, res) => {
    res.render("landing/signup", { message: null });
})

app.post('/signup', async (req, res) => {
    try {
        const { username, name, email, password, role } = req.body;

        const userE = await User.findOne({ $or: [{ email }, { username }] });
        if (userE) {
            return res.render('landing/signup', { 
                message: 'Username or email already exists' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        res.redirect('/login');
    } catch (error) {
        console.error('Signup error:', error);
        res.render('landing/signup', { 
            message: 'An error occurred during signup. Please try again.' 
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('landing/login', { message: 'Invalid username or password' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.render('landing/login', { message: 'Invalid username or password' });
        }
        
        if (user.role === 'student') {
            const studentRecord = await Student.findOne({ userId: user._id });
            if (!studentRecord) {
                return res.render('landing/login', { 
                    message: 'No student record found for this account.' 
                });
            }

            req.session.studentId = studentRecord._id;
            console.log(`Student session set: ${studentRecord._id}`);
        } else if (user.role === 'teacher') {
            const teacherRecord = await Teacher.findOne({ userId: user._id });
            if (!teacherRecord) {
                return res.render('landing/login', { 
                    message: 'No teacher record found for this account.' 
                });
            }
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
    
        switch(user.role) {
            case 'admin': return res.redirect('/admin');
            case 'teacher': return res.redirect('/teacherdash');
            case 'student': return res.redirect('/student/dashboard');
            default: return res.redirect('/');
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.render('landing/login', { 
            message: 'Login failed. Please try again.' 
        });
    }
});





// Admin Dashboard
app.get('/admin', async (req, res) => {
    try {
        const studentCount = await Student.countDocuments();
        const teacherCount = await Teacher.countDocuments();
        const classCount = await Class.countDocuments();

        const recentCirculars = await Circular.find()
            .sort({ issuedDate: -1 })
            .limit(2);

        res.render('admin/dashboard', {
            studentCount,
            teacherCount,
            classCount,
            recentCirculars 
        });
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).send('Server Error');
    }
});

app.get('/admin-out', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/student', async (req, res) => {
    try {
        const classes = await Class.find();
        const studentCount = await Student.countDocuments();
        res.render("admin/student", { 
            classes,
            studentCount
        });
    } catch (err) {
        console.error('Error loading student page:', err);
        res.render("admin/student", { 
            classes: [],
            studentCount: 0
        });
    }
});

app.get('/teacher', (req, res) => {
    res.render("admin/teacher")
});

app.get('/class',(req, res)=>{
    res.render("admin/class")
});


app.get('/addteacher', (req, res) => {
    res.render("admin/addteacher");
});

app.get('/showteacher', async (req, res) => {
    try {
        const teachers = await Teacher.find();
        res.render('admin/showteacher', { teachers });
    } catch (err) {
        console.error('Error retrieving teachers:', err);
        res.status(500).send('Error retrieving teachers');
    }
});

app.post('/teacher', async (req, res) => {
    try {
        const { fname, lname, age, mobno, jdate, qualification, subject } = req.body;
        
        const newTeacher = new Teacher({
            fname,
            lname,
            age,
            mobno,
            jdate,
            qualification,
            subject
        });
        
        const savedTeacher = await newTeacher.save();
        
        const defaultPassword = 'Teacher@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const username = (fname.charAt(0) + lname + mobno.slice(-4)).toLowerCase();
        
        const newUser = new User({
            username,
            password: hashedPassword,
            email: `${username}@school.com`,
            role: 'teacher',
            name: `${fname} ${lname}`, 
            passwordChanged: false
        });
        
        const savedUser = await newUser.save();
        
        savedTeacher.userId = savedUser._id;
        await savedTeacher.save();
        
        res.redirect('/showteacher');
    } catch (err) {
        console.error('Error adding teacher:', err);
        res.status(500).send('Error adding teacher');
    }
});

app.post('/deleteTeacher/:id', async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id);
        res.redirect('/showteacher');
    } catch (err) {
        console.error('Error deleting teacher:', err);
        res.status(500).send('Error deleting teacher');
    }
});


app.get('/editTeacher/:id', async (req, res) => {
    try {
  
        const teacher = await Teacher.findById(req.params.id).lean();
        if (!teacher) {
            return res.status(404).send('Teacher not found');
        }
        
        res.render('admin/editTeacher', { 
            teacher,
            error: null 
        });
    } catch (err) {
        console.error('Error loading edit teacher form:', err);
        res.status(500).send('Error loading edit teacher form');
    }
});

app.post('/editTeacher/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { 
            fname, lname, email, mobile, gender, age, address,
            qualification, experience, subject, jdate, salary, bio
        } = req.body;
        
        const existingTeacher = await Teacher.findOne({ 
            mobile, 
            _id: { $ne: teacherId } 
        });
        
        if (existingTeacher) {
            const teacher = await Teacher.findById(teacherId).lean();
            return res.render('admin/editTeacher', {
                teacher,
                error: 'This mobile number is already registered with another teacher.'
            });
        }
        
        await Teacher.findByIdAndUpdate(teacherId, {
            fname,
            lname,
            email,
            mobile,
            gender,
            age,
            address,
            qualification, 
            experience,
            subject,
            jdate,
            salary,
            bio
        });
        
        res.redirect('/showteacher?message=Teacher updated successfully');
    } catch (err) {
        console.error('Error updating teacher:', err);
        res.status(500).send('Error updating teacher');
    }
});

app.get('/addClass', (req, res) => {
    res.render("admin/addClasses");
}); 

app.post('/class', async (req, res) => {
    try {
        const { name, section } = req.body;
        const classId = `${name}-${section}`.toUpperCase();
        
        const newClass = new Class({ 
            classId,
            name: parseInt(name),
            section: section.toUpperCase()
        });
        
        await newClass.save();
        res.redirect('/showClass');
    } catch (err) {
        console.error('Error adding class:', err);
        res.status(500).send('Error adding class');
    }
});

app.get('/showClass', async (req, res) => {
    try {
        const classes = await Class.find().populate('teacher');
        res.render('admin/showClass', { classes });
    } catch (err) {
        console.error('Error retrieving classes:', err);
        res.status(500).send('Error retrieving classes');
    }
});

app.get('/classDel/:id', async (req, res) => {
    try {
        await Class.findByIdAndDelete(req.params.id);
        res.redirect('/showClass');
    } catch (err) {
        res.status(500).send('Error deleting class');
    }
});

app.get('/assignTeacher/:classId', async (req, res) => {
    try {
        const classId = req.params.classId;
        const classObj = await Class.findById(classId).populate('teacher');
        
        if (!classObj) {
            return res.status(404).send('Class not found');
        }
 
        const teachers = await Teacher.find();
        
        res.render('admin/assignTeacher', {
            classObj,
            teachers,
            error: null,
            success: false
        });
    } catch (err) {
        console.error('Error loading assign teacher form:', err);
        res.status(500).send('Error loading assign teacher form');
    }
});

app.post('/assignTeacher/:classId', async (req, res) => {
    try {
        const { teacherId } = req.body;
        const classId = req.params.classId;
        
        if (!teacherId || teacherId === '') {
            await Class.findByIdAndUpdate(classId, { $unset: { teacher: 1 } });
        } else {
            await Class.findByIdAndUpdate(classId, { teacher: teacherId });
        }
        
        const classObj = await Class.findById(classId).populate('teacher');
        const teachers = await Teacher.find();
        
        res.render('admin/assignTeacher', {
            classObj,
            teachers,
            error: null,
            success: true
        });
    } catch (err) {
        console.error('Error assigning teacher:', err);
        res.status(500).send('Error assigning teacher');
    }
});

app.get('/addStudent', async (req, res) => {
    try {
        const classes = await Class.find();
        res.render('admin/addStudent', { 
            classes,
            error: null 
        });
    } catch (err) {
        console.error('Error loading add student form:', err);
        res.status(500).send('Error loading add student form');
    }
});

app.post('/addStudent', async (req, res) => {
    try {
        const { fname, lname, age, gender, fathername, mobno, email, address, rollNumber, batch, classId } = req.body;
        
        const existingStudent = await Student.findOne({ mobno });
        if (existingStudent) {
            const classes = await Class.find();
            return res.render('admin/addStudent', { 
                classes,
                error: 'A student with this mobile number already exists.' 
            });
        }

        if (!fname || !lname || !age || !fathername || !mobno || !batch || !classId) {
            const classes = await Class.find();
            return res.render('admin/addStudent', {
                classes,
                error: 'Please fill all required fields.'
            });
        }

        const newStudent = new Student({
            fname,
            lname,
            age,
            gender,
            fathername,
            mobno,
            email,
            address,
            rollNumber: rollNumber || undefined, 
            batch,
            classId
        });

        const savedStudent = await newStudent.save();
        
        const username = rollNumber || 
            (fname.charAt(0) + lname + mobno.slice(-4)).toLowerCase();
        
        const defaultPassword = 'Student@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Create user account
        const newUser = new User({
            username,
            password: hashedPassword,
            email: email || `${username}@school.com`,
            role: 'student',
            name: `${fname} ${lname}`,
            passwordChanged: false
        });
        
        const savedUser = await newUser.save();
        
        savedStudent.userId = savedUser._id;
        await savedStudent.save();

        res.redirect(`/showStudents?message=Student added successfully! Username: ${username}, Default Password: ${defaultPassword}`);
    } catch (err) {
        console.error('Error adding student:', err);
        const classes = await Class.find();
        res.render('admin/addStudent', { 
            classes,
            error: 'Failed to add student. Please check all fields and try again.' 
        });
    }
});

app.get('/showStudents', async (req, res) => {
    try {
        const students = await Student.find().populate('classId');
        res.render('admin/showStudents', { 
            students,
            classFilter: null,
            message: req.query.message || null  
        });
    } catch (err) {
        console.error('Error retrieving students:', err);
        res.status(500).send('Error retrieving students');
    }
});

app.get('/showClassStudents/:classId', async (req, res) => {
    try {
        const classId = req.params.classId;
        const classObj = await Class.findById(classId);
        
        if (!classObj) {
            return res.status(404).send('Class not found');
        }

        const students = await Student.find({ classId }).populate('classId');
        
        res.render('admin/showStudents', { 
            students,
            classFilter: classObj,
            message: req.query.message || null  
        });
    } catch (err) {
        console.error('Error retrieving class students:', err);
        res.status(500).send('Error retrieving class students');
    }
});

app.post('/deleteStudent/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.redirect('/showStudents');
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).send('Error deleting student');
    }
});

app.get('/editStudent/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).lean();
        if (!student) {
            return res.status(404).send('Student not found');
        }
        
        const classes = await Class.find().lean();
        
        res.render('admin/editStudent', { 
            student,
            classes,
            error: null 
        });
    } catch (err) {
        console.error('Error loading edit student form:', err);
        res.status(500).send('Error loading edit student form');
    }
});

app.post('/editStudent/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const { fname, lname, email, mobno, gender, age, address, classId, rollNumber, fathername, batch } = req.body;
        
        const existingStudent = await Student.findOne({ 
            mobno, 
            _id: { $ne: studentId } 
        });
        
        if (existingStudent) {
            const classes = await Class.find().lean();
            const student = await Student.findById(studentId).lean();
            return res.render('admin/editStudent', {
                student,
                classes,
                error: 'This mobile number is already registered with another student.'
            });
        }
        
        await Student.findByIdAndUpdate(studentId, {
            fname,
            lname,
            email,
            mobno,
            gender,
            age,
            address,
            classId,
            rollNumber,
            fathername,
            batch
        });
        
        res.redirect('/showStudents?message=Student updated successfully');
    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).send('Error updating student');
    }
});


app.get('/addCircular', (req, res) => {
    res.render('admin/addCircular', { error: null });
});

app.post('/addCircular', async (req, res) => {
    try {
        const { title, content, issuedBy, targetAudience } = req.body;
        
        if (!title || !content || !issuedBy) {
            return res.render('admin/addCircular', { 
                error: 'Please fill all required fields.' 
            });
        }
        
        const circular = new Circular({
            title,
            content,
            issuedBy,
            targetAudience: targetAudience || 'All'
        });
        
        await circular.save();
        res.redirect('/showCirculars');
    } catch (err) {
        console.error('Error adding circular:', err);
        res.render('admin/addCircular', { 
            error: 'An error occurred while adding the circular.' 
        });
    }
});

app.get('/showCirculars', async (req, res) => {
    try {
        const circulars = await Circular.find().sort({ issuedDate: -1 });
        res.render('admin/showCirculars', { circulars });
    } catch (err) {
        console.error('Error retrieving circulars:', err);
        res.status(500).send('Error retrieving circulars');
    }
});

app.get('/deleteCircular/:id', async (req, res) => {
    try {
        await Circular.findByIdAndDelete(req.params.id);
        res.redirect('/showCirculars');
    } catch (err) {
        console.error('Error deleting circular:', err);
        res.status(500).send('Error deleting circular');
    }
});


// Teacher 
app.get('/teacherdash', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    
    const assignedClasses = await Class.find({ teacher: teacher._id }).lean();
    
    let studentCount = 0;
    if (assignedClasses.length > 0) {
      const classIds = assignedClasses.map(cls => cls._id);
      studentCount = await Student.countDocuments({ classId: { $in: classIds } });
    }
    
    const classCount = assignedClasses.length;
    
    const recentCirculars = await Circular.find({
      $or: [
        { targetAudience: 'All' },
        { targetAudience: 'Teachers' }
      ]
    })
    .sort({ issuedDate: -1 })
    .limit(2)
    .lean();
    
    res.render('teacher/teacherdash', {
      pageTitle: 'Teacher Dashboard',
      teacher,
      assignedClasses,
      studentCount,
      classCount,         
      recentCirculars 
      
    });
  } catch (error) {
    console.error('Error loading teacher dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

app.get('/teacher/classes', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    
    const assignedClasses = await Class.find({ teacher: teacher._id }).lean();
    
    for (let cls of assignedClasses) {
      cls.studentCount = await Student.countDocuments({ classId: cls._id });
    }
    
    res.render('teacher/classes', {
      pageTitle: 'My Classes',
      teacher,
      assignedClasses
    });
  } catch (error) {
    console.error('Error loading classes:', error);
    res.status(500).send('Error loading classes');
  }
});

app.get('/teacher/class/:classId/students', authenticateTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher = req.teacher;
    
    const classData = await Class.findOne({ 
      _id: classId,
      teacher: teacher._id
    });
    
    if (!classData) {
      return res.status(403).send('You do not have access to this class');
    }
    
    const students = await Student.find({ classId }).sort({ fname: 1, lname: 1 }).lean();
    
    res.render('teacher/class-students', {
      pageTitle: `Class ${classData.name}-${classData.section} Students`,
      teacher,
      classData,
      students
    });
  } catch (error) {
    console.error('Error loading class students:', error);
    res.status(500).send('Error loading students');
  }
});

app.get('/teacher/class/:classId/attendance', authenticateTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher = req.teacher;
    const date = req.query.date || new Date().toISOString().split('T')[0]; 
    const classData = await Class.findOne({ 
      _id: classId,
      teacher: teacher._id
    });
    
    if (!classData) {
      return res.status(403).send('You do not have access to this class');
    }
    
    const students = await Student.find({ classId }).sort({ fname: 1, lname: 1 }).lean();
    
    res.render('teacher/attendance', {
      pageTitle: `Attendance: Class ${classData.name}-${classData.section}`,
      teacher,
      classData,
      students,
      date,
      success: req.query.success === 'true'
    });
  } catch (error) {
    console.error('Error loading attendance page:', error);
    res.status(500).send('Error loading attendance');
  }
});

app.post('/teacher/class/:classId/attendance', authenticateTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, attendance } = req.body;
    const teacher = req.teacher;
    
    const classExists = await Class.exists({ 
      _id: classId,
      teacher: teacher._id
    });
    
    if (!classExists) {
      return res.status(403).send('You do not have access to this class');
    }
    
    await Attendance.deleteMany({
      classId,
      date: new Date(date)
    });
    
    const attendanceRecords = [];
    
    for (let studentId in attendance) {
      attendanceRecords.push({
        studentId,
        classId,
        date: new Date(date),
        status: attendance[studentId],
        markedBy: teacher._id
      });
    }
    
    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
    }
    
    res.redirect(`/teacher/class/${classId}/attendance?success=true&date=${date}`);
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).send('Error saving attendance');
  }
});

app.get('/teacher/tasks', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    
    const tasks = await Task.find({ teacher: teacher._id })
      .populate('classId')
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedTasks = tasks.map(task => ({
      ...task,
      className: task.classId.name,
      section: task.classId.section
    }));
    
    res.render('teacher/tasks', {
      pageTitle: 'Task Management',
      teacher,
      tasks: formattedTasks
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
    res.status(500).send('Error loading tasks');
  }
});

app.get('/teacher/tasks/create', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    
    const classes = await Class.find({ teacher: teacher._id }).lean();
    
    res.render('teacher/create-task', {
      pageTitle: 'Create Task',
      teacher,
      classes,
      error: null
    });
  } catch (error) {
    console.error('Error loading task creation page:', error);
    res.status(500).send('Error loading task creation page');
  }
});

app.post('/teacher/tasks/create', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    const { title, description, classId, startDate, dueDate, maxMarks } = req.body;
    
    const classExists = await Class.exists({
      _id: classId,
      teacher: teacher._id
    });
    
    if (!classExists) {
      const classes = await Class.find({ teacher: teacher._id }).lean();
      return res.render('teacher/create-task', {
        pageTitle: 'Create Task',
        teacher,
        classes,
        error: 'You do not have access to this class'
      });
    }
    
    const newTask = new Task({
      title,
      description,
      classId,
      teacher: teacher._id,
      startDate,
      dueDate,
      maxMarks,
      status: new Date(startDate) <= new Date() ? 'active' : 'pending'
    });
    
    await newTask.save();
    
    res.redirect('/teacher/tasks');
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).send('Error creating task');
  }
});

app.get('/teacher/tasks/:taskId', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    const { taskId } = req.params;
    
    const task = await Task.findOne({
      _id: taskId,
      teacher: teacher._id
    }).populate('classId').lean();
    
    if (!task) {
      return res.status(404).send('Task not found');
    }
    
    const students = await Student.find({ classId: task.classId._id }).lean();
    
    res.render('teacher/task-detail', {
      pageTitle: task.title,
      teacher,
      task,
      students
    });
  } catch (error) {
    console.error('Error loading task details:', error);
    res.status(500).send('Error loading task details');
  }
});


app.post('/teacher/tasks/:taskId/delete', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    const { taskId } = req.params;
    
    const task = await Task.findOne({
      _id: taskId,
      teacher: teacher._id
    });
    
    if (!task) {
      return res.status(404).send('Task not found');
    }
    
    await Task.findByIdAndDelete(taskId);
    
    res.redirect('/teacher/tasks');
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Error deleting task');
  }
});

app.get('/teacher/profile', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    
    const teacherStats = {
      classCount: await Class.countDocuments({ teacher: teacher._id }),
      studentCount: await Student.countDocuments({ 
        classId: { $in: await Class.find({ teacher: teacher._id }).distinct('_id') } 
      }),
      attendanceCount: await Attendance.countDocuments({ 
        markedBy: teacher._id 
      }),
      taskCount: await Task.countDocuments({ teacher: teacher._id })
    };
    
    res.render('teacher/profile', {
      pageTitle: 'My Profile',
      teacher,
      teacherStats
    });
  } catch (error) {
    console.error('Error loading teacher profile:', error);
    res.status(500).send('Error loading teacher profile');
  }
});

app.post('/teacher/profile/update', authenticateTeacher, async (req, res) => {
  try {
    const teacher = req.teacher;
    const { fname, lname, email, phone, address, qualification } = req.body;
    
    if (email !== teacher.email) {
      const existingTeacher = await Teacher.findOne({ email, _id: { $ne: teacher._id } });
      if (existingTeacher) {
        return res.status(400).send('Email already in use');
      }
    }
    
    teacher.fname = fname;
    teacher.lname = lname;
    teacher.email = email;
    teacher.phone = phone;
    teacher.address = address;
    teacher.qualification = qualification;
    
    await teacher.save();
    
    res.redirect('/teacher/profile');
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).send('Error updating teacher profile');
  }
});

app.get('/teacher/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});
            

// Student 
app.get('/student/dashboard', authenticateStudent, async (req, res) => {
  try {
    const studentId = req.session.studentId;
    
    const student = await Student.findById(studentId).populate('classId').lean();
    
    if (!student) {
      req.session.destroy();
      return res.redirect('/login');
    }
    
    const studentWithClass = {
      ...student,
      classInfo: student.classId
    };
    
    const attendance = await Attendance.find({ studentId: student._id });
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    const tasks = await Task.find({ classId: student.classId._id }).lean();
    const pendingTasks = tasks.filter(task => task.status !== 'completed').slice(0, 5);
    
    const studentStats = {
      attendancePercentage,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      pendingTasks: tasks.filter(task => task.status !== 'completed').length
    };
    
    const recentCirculars = await Circular.find({
      $or: [
        { targetAudience: 'All' },
        { targetAudience: 'Students' }
      ]
    })
    .sort({ issuedDate: -1 })
    .limit(3)
    .lean();
    
    res.render('student/dashboard', {
      student: studentWithClass,
      studentStats,
      pendingTasks,
      recentCirculars  
    });
    
  } catch (error) {
    console.error('Error loading student dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

app.get('/student/attendance', authenticateStudent, async (req, res) => {
  try {
    const selectedMonth = req.query.month || 'all';
    
    const query = { studentId: req.student._id };
    
    if (selectedMonth !== 'all') {
      const month = parseInt(selectedMonth);
      const year = new Date().getFullYear();
      query.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0)       
      };
    }
    
    const attendanceRecords = await Attendance.find(query).sort({ date: -1 });
    
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    const attendanceData = {
      percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      presentDays: presentDays,
      totalDays: totalDays
    };
    
    res.render('student/attendance', {
      student: req.student,
      attendanceData,
      attendanceRecords,
      selectedMonth
    });
    
  } catch (error) {
    console.error('Error loading attendance data:', error);
    res.status(500).send('Could not load attendance data');
  }
});

app.get('/student/assignments', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    
    const tasks = await Task.find({ classId: student.classId._id })
      .sort({ dueDate: 1 }) 
      .lean();
    
    const today = new Date();
    tasks.forEach(task => {
      if (task.status !== 'completed' && new Date(task.dueDate) < today) {
        task.isOverdue = true;
      }
    });
    
    const studentWithClass = {
      ...student,
      classInfo: student.classId
    };
    
    res.render('student/assignments', {
      student: studentWithClass,
      tasks: tasks,
      status: 'all'
    });
    
  } catch (error) {
    console.error('Error loading assignments:', error);
    res.status(500).send('Could not load assignments data');
  }
});

app.post('/student/assignments/complete/:taskId', authenticateStudent, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const studentId = req.student._id;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).send('Task not found');
    }
    
    task.status = 'completed';
    await task.save();
    
    res.redirect('/student/assignments');
    
  } catch (error) {
    console.error('Error completing assignment:', error);
    res.status(500).send('Could not complete assignment');
  }
});

app.get('/student/profile', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    
    const attendance = await Attendance.find({ studentId: student._id });
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    const tasks = await Task.find({ classId: student.classId._id }).lean();
    
    const studentStats = {
      attendancePercentage,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      pendingTasks: tasks.filter(task => task.status !== 'completed').length
    };
    
    const studentObj = student.toObject ? student.toObject() : JSON.parse(JSON.stringify(student));
    
    const studentWithClass = {
      ...studentObj,
      classInfo: student.classId
    };
    
    res.render('student/profile', {
      student: studentWithClass,
      studentStats
    });
    
  } catch (error) {
    console.error('Error loading student profile:', error);
    res.status(500).send('Could not load profile data');
  }
});

app.get('/student/circulars', authenticateStudent, async (req, res) => {
  try {
    const circulars = await Circular.find({
      $or: [
        { targetAudience: 'All' },
        { targetAudience: 'Students' }
      ]
    }).sort({ issuedDate: -1 }).lean();
    
    res.render('student/circulars', {
      student: req.student,
      circulars
    });
  } catch (error) {
    console.error('Error loading circulars:', error);
    res.status(500).send('Error loading circulars');
  }
});

app.get('/student/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});



app.listen(3101, () => console.log('Server running on port 3101'));
