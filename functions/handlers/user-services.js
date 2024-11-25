const Joi = require('joi');
const {database} = require('../util/admin');
const firebase = require('firebase');

const strongPasswordRegex = new RegExp("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$");

const signUpSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(strongPasswordRegex, 'password').required(),
    userType: Joi.string().required()
});

const signInSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().regex(strongPasswordRegex, 'password').required(),
});

const fetchNotificationsSchema = Joi.object({
    userId: Joi.string().required()
});

const viewNotificationsSchema = Joi.object({
    userId: Joi.string().required(),
    notificationId: Joi.string().required()
});

// Search for the verification code
// REQ: None
// RES: The document name (aka the verification code)
exports.verifyCode = (req, res) => {
    function returnVerificationCode(documentName) {
        res.status(200).send(documentName);
    }

    database.collection("verificationCode").doc("code").get().then(doc => {
        let data = {
            verificationCode: doc.data().verificationCode,
        };
        returnVerificationCode(data);
    })
};

// Req requires: firstName, lastName, email, password, userType
// Res returns on success: Status 200, 'User added successfully.'
// Res returns on fail: Status 400, bad request | Status 500, why sign up failed message with firebase
exports.signUpUser = (req, res) => {
    const validation = signUpSchema.validate(req.body);

    if (validation.error) {
        let err = {message: validation.error.details[0].message};
        console.log(validation.error.details[0].message);
        return res.status(400).send(err);
    }

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const userType = req.body.userType;

    function sendRes(message) {
        res.status(200).send(message);
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch(err => {
            console.error(err);
            const message = {message: "Email exists."};
            return sendRes(message);
        }).then(function () {
        let user = firebase.auth().currentUser;
        database.collection('usersInfo').doc(user.uid).set({
            fullName: firstName + " " + lastName,
            email: email,
            userType: userType,
            uid: user.uid,
            isOnline: false
        }).catch(err => console.error(err)).then(function () {
            database.collection("users").doc(user.uid).set({
                userId: user.uid
            }).catch(err => console.error(err));
            user.sendEmailVerification().catch(err => {
                console.error(err);
            });
            return null;
        }).catch(err => console.error(err));
        return null;
    }).catch(err => console.error(err)).then(function () {
        const message = {message: "User added successfully."};
        sendRes(message);
    }).catch(err => {
        console.error(err);
    })
};


// Req requires: email and password
// Res returns on success: {uId: uId, tokenId: tokenId}
// Res returns on fail: Status 401, Not Verified
// Res returns on fail: Status 403, Bad Password
// Res returns on fail: Status 500, Server Error
exports.signInUser = (req, res) => {
    const validation = signInSchema.validate(req.body);
    if (validation.error) {
        return res.status(400).send(validation.error.details[0].message);
    }

    const email = req.body.email;
    const password = req.body.password;

    function sendRes(status, message) {
        res.status(status).send(message);
    }

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
        console.log("Sign in error: " + error.message);
        let errorMessage = error.message;
        let errorResponseMessage = {errorMessage: errorMessage};
        return res.status(403).send(errorResponseMessage);
    }).then(function () {
        let user = firebase.auth().currentUser;
        if (user) {
            if (user.emailVerified) {
                firebase.auth().currentUser.getIdToken(false).then(function (idToken) {
                    let uId = user.uid;
                    database.collection('usersInfo').doc(uId).update({
                        isOnline: true
                    }).catch(err => console.error(err))
                    let userInfo = {uId: uId, idToken: idToken};
                    sendRes(200, userInfo);
                })
            } else if (!user.emailVerified) {
                firebase.auth().signOut();
                sendRes(401, {message: "User is not verified by email."});
                user.sendEmailVerification().catch(function (error) {
                    console.log(error.message);
                });
            } else {
                firebase.auth().signOut();
                sendRes(500, {message: "Internal Server Error"});
            }
        }
    });
};

// Will make user offline
// REQ: None
// RES: 200 status and message that says "Success"
exports.signOutUser = (req, res) => {
    let user = req.user;
    let userId = user.uid;

    firebase.auth().signOut().then(function () {
        database.collection('usersInfo').doc(userId).update({
            isOnline: false
        }).then(() => {
            res.status(200).send({message: "Success"});
        }).catch(err => {
            console.error(err)
        });
    }).catch(err => {
        console.error(err)
    });
};

// Will get user information
// REQ: Authorization Header: tokenId, user must be signed in
// RES: userId, email, fullName, userType
// RES: Notifications: notificationId, message, viewedStatus
exports.getUser = (req, res) => {
    let user = req.user;
    let notifications = [];

    function sendResults(data) {
        res.status(200).send(data);
    }

    function addNotification(notificationData) {
        notifications.push(notificationData);
    }

    database.collection("users").doc(user.uid).collection("notifications").get()
        .then(snapshots => {
            snapshots.forEach(doc => {
                let notificationData = {
                    notificationId: doc.id,
                    message: doc.data().message,
                    viewedStatus: doc.data().viewedStatus
                };
                addNotification(notificationData);
            })
        }).then(() => {
            database.collection("usersInfo").doc(user.uid).get().then(doc => {
                let data = {
                    userId: user.uid,
                    email: doc.data().email,
                    fullName: doc.data().fullName,
                    userType: doc.data().userType,
                    notifications: notifications
                };
                sendResults(data);
            })
        })
};

// Will get notifications for the user
// REQ: userId
// RES: notificationId, message, viewedStatus
exports.fetchNotifications = (req, res) => {
    let notifications = [];
    const validation = fetchNotificationsSchema.validate(req.body);
    if (validation.error) {
        let err = {message: validation.error.details[0].message};
        console.log(validation.error.details[0].message);
        return res.status(400).send(err);
    }

    const userId = req.body.userId;

    function sendResults() {
        res.status(200).send(notifications);
    }

    function addNotification(notificationData) {
        notifications.push(notificationData);
    }

    database.collection("users").doc(userId).collection("notifications").get()
        .then(snapshots => {
            snapshots.forEach(doc => {
                let notificationData = {
                    notificationId: doc.id,
                    message: doc.data().message,
                    viewedStatus: doc.data().viewedStatus
                };
                addNotification(notificationData);
                if (notifications.length === snapshots.size) {
                    sendResults();
                }
            })
        })
};

// Will set status of notification as viewed
// REQ: userId, notificationId
// RES: Status 200, Success message
exports.viewNotification = (req, res) => {
    const validation = viewNotificationsSchema.validate(req.body);
    if (validation.error) {
        let err = {message: validation.error.details[0].message};
        console.log(validation.error.details[0].message);
        return res.status(400).send(err);
    }

    function sendRes() {
        res.status(200).send({message: "Success"});
    }

    const userId = req.body.userId;
    const notificationId = req.body.notificationId;

    let notificationRef = database.collection("users")
        .doc(userId).collection("notifications").doc(notificationId);
    notificationRef.update({viewedStatus: true}).then(() => sendRes())
};
