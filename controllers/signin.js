// const {getAuthTokenId, createSessions} = require('../services/sessions');

const handleSignin = (db, bcrypt, req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        return Promise.reject('missing email or password');
    }

    return db.select('email', 'hash').from('login')
        .where({email: email, })
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);

            if(isValid) {
                return db.select('*').from('users').where('email', email)
                    .then(user => user[0].id)
                    .catch(err => Promise.reject('unable to get user'));
            } else return Promise.reject('wrong credentials');
        })
        .catch(err => Promise.reject('wrong email or password'))
}



const signinAuthentication = (db, bcrypt, redisClient) => (req, res) => {
    console.log('signing in', req.body);
    // const {authorization} = req.headers;
    // return authorization ? getAuthTokenId(req, res, redisClient) : 
    //     handleSignin(db, bcrypt, req, res).then(data => {
    //         return data.id && data.email ? createSessions(data, redisClient) : Promise.reject(data);
    //     }).catch(err => res.status(400).json(err))
    //         .then(session => res.json(session))
    //         .catch(err => res.status(400).json(err))

    handleSignin(db, bcrypt, req, res)
        .then(id => res.json(id))
        .catch(err => res.status(400).json(err))
}

module.exports = {
    signinAuthentication,
}