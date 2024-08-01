// auth-service.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [{ dateTime: Date, userAgent: String }]
});

let db;
let User;

const initialize = function () {
    return new Promise((resolve, reject) => {
        db = mongoose.createConnection(process.env.MONGODB_URI);
        db.on('error', (err) => {
            console.error('Connection error:', err);
            reject(err);
        });
        db.once('open', () => {
            User = db.model('User', userSchema);
            console.log('MongoDB connection established and user model initialized.');
            resolve();
        });
    });
};

const registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10, (err, hash) => {
                if (err) {
                    reject("Error hashing password");
                } else {
                    let newUser = new User({
                        userName: userData.userName,
                        password: hash,
                        email: userData.email,
                        loginHistory: [{
                            dateTime: Date,
                            userAgent: String,
                        }],
                    });
                    newUser.save()
                        .then(() => resolve("User registered successfully"))
                        .catch(err => {
                            if (err.code === 11000) {
                                reject("Username already taken");
                            } else {
                                reject("Error creating user: " + err);
                            }
                        });
                }
            });
        }
    });
};

const checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName })
            .then((users) => {
                if (users.length === 0) {
                    reject("Unable to find user: " + userData.userName);
                }

                bcrypt.compare(userData.password, users[0].password).then((result) => {
                    if (result === false) {
                        reject("Incorrect Password for user: " + userData.userName);
                    } else {
                        if (users[0].loginHistory.length === 8) {
                            users[0].loginHistory.pop();
                        }
                        users[0].loginHistory.unshift({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                        User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                            .then(() => {
                                resolve(users[0]);
                            })
                            .catch((err) => {
                                reject("There was an error verifying the user: " + err);
                            });
                    }
                });
            })
            .catch(() => {
                reject("Unable to find user: " + userData.userName);
            });
    });
};

module.exports = {
    initialize,
    registerUser,
    checkUser
};