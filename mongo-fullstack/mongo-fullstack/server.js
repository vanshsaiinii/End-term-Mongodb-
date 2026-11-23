const express = require('express');
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const app = express();

app.use(express.json());
app.use(express.static('public'));

let students, employees;

const sampleStudents = [
  { rollNo: 101, name: 'Arun', dept: 'CSE', marks: 78, city: 'Chennai' },
  { rollNo: 102, name: 'Bharath', dept: 'ECE', marks: 85, city: 'Madurai' },
  { rollNo: 103, name: 'Karthik', dept: 'CSE', marks: 62, city: 'Chennai' },
  { rollNo: 104, name: 'Divya', dept: 'MECH', marks: 70, city: 'Coimbatore' },
  { rollNo: 105, name: 'Suresh', dept: 'CSE', marks: 91, city: 'Trichy' }
];

const sampleEmployees = [
  { empId: 1, name: 'Anita', dept: 'HR', salary: 42000, city: 'Chennai' },
  { empId: 2, name: 'Bala', dept: 'IT', salary: 65000, city: 'Bengaluru' },
  { empId: 3, name: 'Charan', dept: 'IT', salary: 58000, city: 'Chennai' },
  { empId: 4, name: 'Deepa', dept: 'Finance', salary: 50000, city: 'Mumbai' },
  { empId: 5, name: 'Elan', dept: 'IT', salary: 72000, city: 'Chennai' },
  { empId: 6, name: 'Farah', dept: 'HR', salary: 45000, city: 'Delhi' },
  { empId: 7, name: 'Gopal', dept: 'Finance', salary: 61000, city: 'Chennai' },
  { empId: 8, name: 'Hema', dept: 'Sales', salary: 38000, city: 'Hyderabad' }
];

const run = fn => (req, res) => fn(req, res).catch(e => res.status(500).json({ error: e.message }));

app.post('/api/students/reset', run(async (req, res) => {
  await students.deleteMany({});
  const first = await students.insertOne({ ...sampleStudents[0] });
  const rest = await students.insertMany(sampleStudents.slice(1).map(s => ({ ...s })));
  res.json({ first, rest });
}));

app.get('/api/students', run(async (req, res) => {
  const filter = req.query.dept ? { dept: req.query.dept } : {};
  res.json(await students.find(filter).sort({ rollNo: 1 }).toArray());
}));

app.get('/api/students/count', run(async (req, res) => {
  res.json({ count: await students.countDocuments() });
}));

app.post('/api/students', run(async (req, res) => {
  const { rollNo, name, dept, marks, city } = req.body;
  res.json(await students.insertOne({ rollNo: Number(rollNo), name, dept, marks: Number(marks), city }));
}));

app.put('/api/students/semester', run(async (req, res) => {
  const { dept, semester } = req.body;
  res.json(await students.updateMany({ dept }, { $set: { semester: Number(semester) } }));
}));

app.put('/api/students/:rollNo', run(async (req, res) => {
  res.json(await students.updateOne(
    { rollNo: Number(req.params.rollNo) },
    { $set: { marks: Number(req.body.marks) } }
  ));
}));

app.delete('/api/students/:rollNo', run(async (req, res) => {
  res.json(await students.deleteOne({ rollNo: Number(req.params.rollNo) }));
}));

const empQueries = {
  gt: () => employees.find({ salary: { $gt: 60000 } }).toArray(),
  range: () => employees.find({ salary: { $gte: 45000, $lte: 60000 } }).toArray(),
  in: () => employees.find({ dept: { $in: ['IT', 'Finance'] } }).toArray(),
  and: () => employees.find({ $and: [{ city: 'Chennai' }, { salary: { $gt: 50000 } }] }).toArray(),
  or: () => employees.find({ $or: [{ dept: 'HR' }, { salary: { $gt: 70000 } }] }).toArray(),
  nin: () => employees.find({ city: { $nin: ['Chennai', 'Bengaluru'] } }).toArray(),
  regex: () => employees.find({ name: { $regex: /^[ABC]/ } }).toArray(),
  page: () => employees.find({}, { projection: { _id: 0, name: 1, salary: 1 } })
    .sort({ salary: -1 }).skip(2).limit(3).toArray()
};

app.post('/api/employees/reset', run(async (req, res) => {
  await employees.deleteMany({});
  res.json(await employees.insertMany(sampleEmployees.map(e => ({ ...e }))));
}));

app.get('/api/employees', run(async (req, res) => {
  res.json(await employees.find().sort({ empId: 1 }).toArray());
}));

app.get('/api/employees/query/:type', run(async (req, res) => {
  const q = empQueries[req.params.type];
  if (!q) return res.status(404).json({ error: 'Unknown query' });
  res.json(await q());
}));

client.connect().then(() => {
  students = client.db('college').collection('students');
  employees = client.db('hr').collection('employees');
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Running on http://localhost:' + port));
}).catch(e => {
  console.error('MongoDB connection failed:', e.message);
  process.exit(1);
});
