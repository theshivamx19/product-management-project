const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    fname: {
        type: String,
        require: true
    },
    lname: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    profileImage: {
        type: String,
        require: true
    }, // s3 link
    phone: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    }, // encrypted password
    address: {
        shipping: {
            street: {
                type: String,
                require: true
            },
            city: {
                type: String,
                require: true
            },
            pincode: {
                type: Number,
                require: true
            }
        },
        billing: {
            street: {
                type: String,
                require: true
            },
            city: {
                type: String,
                require: true
            },
            pincode: {
                type: Number,
                require: true
            }
        }
    }


}, { timestamps: true })

module.exports = mongoose.model("user", userSchema)