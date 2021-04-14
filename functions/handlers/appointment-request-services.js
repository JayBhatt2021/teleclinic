const Joi = require('joi');
const {database, admin} = require('../util/admin');
const config = require("../util/config");

const appointmentSchema = Joi.object({
    patientName: Joi.string().required(),
    doctorName: Joi.string().required(),
    visitReason: Joi.string().required(),
    appointmentDate: Joi.string().required(),
    appointmentTime: Joi.string().required()
});

// Adds an appointment to the patientAppointments collection
// REQ: patientName, doctorName, visitReason, appointmentDate, appointmentTime
// RES returns on success: Status 200, 'Appointment added successfully.'
// RES returns on fail: Status 400, bad request
exports.addAppointment = (req, res) => {
    const validation = appointmentSchema.validate(req.body);
    if (validation.error) {
        let error = {message: validation.error.details[0].message};
        return res.status(400).send(error);
    }

    function sendResults(message) {
        res.status(200).send(message);
    }

    const patientName = req.body.patientName;
    const doctorName = req.body.doctorName;
    const visitReason = req.body.visitReason;
    const appointmentDate = req.body.appointmentDate;
    const appointmentTime = req.body.appointmentTime;

    database.collection("patientAppointments")
        .doc(patientName + doctorName + appointmentDate + appointmentTime)
        .set({
            patientName: patientName,
            doctorName: doctorName,
            visitReason: visitReason,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime
        })
        .then(function () {
            const message = {message: "Appointment added successfully."};
            sendResults(message);
        })
        .catch(err => {
            console.error(err);
        })
};

// Removes an appointment from the patientAppointments collection
// REQ: patientName, doctorName, visitReason, appointmentDate, appointmentTime
// RES returns on success: Status 200, 'Appointment removed successfully.'
// RES returns on fail: Status 400, bad request
exports.cancelAppointment = (req, res) => {
    const validation = appointmentSchema.validate(req.body);
    if (validation.error) {
        let error = {message: validation.error.details[0].message};
        return res.status(400).send(error);
    }

    function sendResults(message) {
        res.status(200).send(message);
    }

    const patientName = req.body.patientName;
    const doctorName = req.body.doctorName;
    const appointmentDate = req.body.appointmentDate;
    const appointmentTime = req.body.appointmentTime;

    database.collection("patientAppointments")
        .doc(patientName + doctorName + appointmentDate + appointmentTime)
        .delete()
        .then(function () {
            const message = {message: "Appointment removed successfully."};
            sendResults(message);
        })
        .catch(err => {
            console.error(err);
        })
};

// Obtains all of the appointments in the database
// REQ: None
// RES: All of the appointments in the patientAppointments collection
exports.obtainAppointments = (req, res) => {
    database.collection("patientAppointments")
        .onSnapshot((querySnapshot) => {
            const appointmentsArray = [];
            querySnapshot.forEach(function (doc) {
                appointmentsArray.push(doc.data());
            });
            res.status(200).send(appointmentsArray);
        });
};
