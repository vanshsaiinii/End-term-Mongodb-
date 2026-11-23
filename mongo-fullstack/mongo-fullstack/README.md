# MongoDB Practice App

Node.js + Express + MongoDB + plain HTML/CSS/JS.

Covers Scenario 1.1 (Student Records, database `college`) and Scenario 1.2 (Employee Directory, database `hr`).

## Setup

1. Install Node.js and start MongoDB on your machine.
2. In this folder run:

   npm install
   npm start

3. Open http://localhost:3000

To use a different MongoDB server, set `MONGO_URL` before starting, for example
`MONGO_URL=mongodb://127.0.0.1:27017 npm start`.

## Using the app

- Student records: load the sample data, add, filter, edit marks, delete, set the semester for a department.
- Employee directory: load the sample data, then click any query button to run it.

## API

Students
- POST /api/students/reset
- GET /api/students?dept=CSE
- GET /api/students/count
- POST /api/students
- PUT /api/students/:rollNo
- PUT /api/students/semester
- DELETE /api/students/:rollNo

Employees
- POST /api/employees/reset
- GET /api/employees
- GET /api/employees/query/:type  (gt, range, in, and, or, nin, regex, page)
