const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = {$employeeId: req.params.employeeId };

  db.all(sql, values,
    (error, timesheets) => {
      if (error) {
        next(error);
      } else {
        res.status(200).json({timesheets: timesheets});
      }
    });
});

timesheetsRouter.post('/', (req, res, next) => {
    const hours = req.body.timesheet.hours,
          rate = req.body.timesheet.rate,
          date = req.body.timesheet.date,
          employeeId = req.params.employeeId;

    if (!hours || !rate || !date || !employeeId) {
        return res.sendStatus(400);
    };

    const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) '+
                'VALUES ($hours, $rate, $date, $employeeId)';
    const values = {$hours: hours,
                    $rate: rate,
                    $date: date,
                    $employeeId: employeeId
                   };
    db.run(sql, values, function(error){
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (error, timesheet) => {
        res.status(201).json({timesheet: timesheet});
                }
              )
      }
    })
});

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: timesheetId};

  db.get(sql, values, (error, row) => {
    if(error){
      next(error);
    }
    else if(row){
      next();
    }
    else{
      res.status(404).send();
    }
  });
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        timesheetId = req.params.timesheetId;

    if (!hours || !rate || !date) {
        return res.sendStatus(400);
    };

    const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE Timesheet.id = $timesheetId`;
    const values = {$hours: hours,
                    $rate: rate,
                    $date: date,
                    $timesheetId: timesheetId
                   };

    db.run(sql, values, function(error){
     if (error) {
        next(error);
     } else {
       db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error, timesheet) => {
       res.status(200).json({timesheet: timesheet});
               })
     }
    })
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    db.run(`DELETE FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error) => {
       res.sendStatus(204);
    });
  });

module.exports = timesheetsRouter;
