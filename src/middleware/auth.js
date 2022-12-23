const jwt = require("jsonwebtoken")

const Authentication = function (req, res, next) {
    try {
        let token = req.headers["authorization"]
        //let token = req.headers.authorization

        if (!token) { return res.status(400).send({ status: false, message: "token must be present" }) }
       // console.log(token)
        token=token.split(" ")
       // console.log(token)
        jwt.verify(token[1], "Project", function (err, decodedToken) {
            if (err) {
                return res.status(400).send({ status: false, message: 'Invalid token' })
            }
            req.decodedToken = decodedToken
            //console.log(decodedToken)
            next()
        })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

const Authorization = function (req, res, next) {
    try {
        const tokenUserId = req.decodedToken.userId
        //console.log(tokenUserId)
        const userId = req.params.userId
        if (tokenUserId != userId) {
            return res.status(403).send({ status: false, message: 'You are not authorized' })
        }
        next()
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { Authentication, Authorization }