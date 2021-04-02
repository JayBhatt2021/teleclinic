const functions = require('firebase-functions');
const FBAuth = require('./util/fbAuth');
const express = require('express');
const cors = require('cors');
const router = express();

router.use(cors({origin: true}));

// Assignment of handlers to variables
const {verifyCode, signUpUser, signInUser, signOutUser, getUser} = require("./handlers/user-services");
const {userSearch} = require("./handlers/user-search");
const {obtainRealTimeUsers, addMessage, obtainRealTimeConversations} = require("./handlers/message-services");
const {
    addReport,
    uploadReportFile,
    updateReportFileLocation,
    obtainReports
} = require("./handlers/medical-reports-services");
const {
    addAppointmentRequest,
    addActualAppointment,
    obtainAppointmentRequests,
    obtainActualAppointments
} = require("./handlers/appointment-request-services");

// User Services Routes
router.post("/verify-code", verifyCode);
router.post("/sign-up", signUpUser);
router.post("/sign-in", signInUser);
router.post("/sign-out", FBAuth, signOutUser);
router.post("/get-user", FBAuth, getUser);

// User Search Route
router.post("/user-search", FBAuth, userSearch);

// Message Services Routes
router.post("/obtain-real-time-users", obtainRealTimeUsers);
router.post("/add-message", addMessage);
router.post("/obtain-real-time-conversations", obtainRealTimeConversations);

// Medical Reports Services Routes
router.post("/add-report", addReport);
router.post("/upload-report-file", FBAuth, uploadReportFile);
router.post("/update-report-file-location", updateReportFileLocation);
router.post("/obtain-reports", obtainReports);

// Appointment Request Services Routes
router.post("/add-appointment-request", addAppointmentRequest);
router.post("/add-actual-appointment", addActualAppointment);
router.post("/obtain-appointment-requests", obtainAppointmentRequests);
router.post("/obtain-actual-appointments", obtainActualAppointments);

exports.api = functions.https.onRequest(router);
