require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// passport-local
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

var current_user = '';
var current_user_email = '';
var usernm = "";

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://esqin-admin:Esqin2002@cluster0.ak7cq.mongodb.net/usersDB');
// mongoose.connect('mongodb://localhost:27017/usersDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    contactList: Array,
    blokcedContacts: Array,
    groups: Array
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    })
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "https://ddm-chat.herokuapp.com/auth/google/chatting_page",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        current_user = profile.name.givenName;
        current_user_email = profile.name.givenName;
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
        });
    }
));
app.get('/', function (req, res) {
    res.render('home');
});

app.get('/auth/google', 
    passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/chatting_page', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/chatting_page');
  });

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.get('/submit', function (req, res) {
    res.render('submit');
});

app.get('/chatting_page', function (req, res) {
    // console.log(req.body);
    var usrnme="";
    for (var i=0;i<current_user.length;i++){
        if (current_user[i]=="@"){
            current_user=usrnme;
            break;
        }
        usrnme+=current_user[i];
    }
    if (req.isAuthenticated()) {
        var t = User.find({'username': current_user_email}, function(err,users){
            if (!err) {
                res.render('index.ejs', {username: current_user});
            }
        })
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', function (req, res) {
    res.logout();
    current_user = "";
    res.redirect("/");
})

var userlist = [];
var users = [];
var private_chat=false;
var msglist = [];
var users_with_contacts = [];
io.on('connection', function(socket) {
    
    socket.on('username', function(username) {
        var usrnme="";
        var cur_em="";
        cur_em += current_user;
        userlist[current_user_email] = socket.id;
        for (var i=0;i<current_user.length;i++){
            if (current_user[i]=="@"){
                current_user=usrnme;
                break;
            }
            usrnme+=current_user[i];
        }
        socket.username = current_user;
        usernm = current_user;
        io.emit('is_online', socket.username,current_user_email);
        User.findOne({'username':current_user_email}, (err,user)=>{
            if (!err) {
                if (user) {
                    users = [...user.contactList];
                    io.to(userlist[current_user_email]).emit('update_userlist',users);
                }
            }
        })
    });
    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
    });
    socket.on('private_chat', (receiver,sender)=>{
        msglist[sender] = receiver;
        // console.log(receiver,sender)
        private_chat=true;
    });
    socket.on('chat_message', function(message,cur_usr) {
        if (!message==''){
            if (private_chat && userlist[msglist[cur_usr]]){
                io.to(userlist[cur_usr]).emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message,socket.username);
                io.to(userlist[msglist[cur_usr]]).emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message,socket.username);
            }
            else if (!private_chat || !userlist[msglist[cur_usr]]){
                io.to(userlist[cur_usr]).emit('chat_message', '<strong style="color:purple">Select a friend to send a message!</strong>',socket.username);
            }
        }
    });
    socket.on('add_contact', function(contact,cur_email){
        var exists = false;
        var alreadyhavethatcontact=false;
        User.findOne({'username':contact}, (err,user)=>{
            if (!err){
                if (user){
                    exists=true;
                }
            }
        });
        User.findOne({'username':cur_email}, (err,user)=>{
            if (!err) {
                if (user) {
                    
                    if (exists){
                        user.contactList = [...user.contactList];
                        user.contactList.forEach(element => {
                            if (element.email==contact){
                                alreadyhavethatcontact=true;
                            
                            }
                        });
                        if (!alreadyhavethatcontact){
                            user.contactList = [...user.contactList, {"email": contact}];
                            user.save();
                            // users_with_contacts[cur_email].push(contact);
                            users = user.contactList;
                            // users.push(socket.username);
                            io.to(userlist[cur_email]).emit('update_userlist',users);
                        }
                        else{
                            io.to(userlist[cur_email]).emit('chat_message', '<strong style="color:lightblue">Already have that contact!</strong>',socket.username);
                        }
                    }
                    else{
                        io.to(userlist[cur_email]).emit('chat_message', '<strong style="color:orange">Such user doesnt exist!</strong>',socket.username);
                    }
                    // console.log(user.contactList,userlist);
                }
            }
        });
        User.findOne({'username':contact}, (err,user)=>{
            if (!err) {
                if (user) {
                    if (exists && !alreadyhavethatcontact){
                        user.contactList = [...user.contactList, {"email": cur_email}];
                        user.save();
                        // users_with_contacts[contact].push(cur_email);
                        users = user.contactList;
                        // users.push(socket.username);
                        io.to(userlist[contact]).emit('update_userlist',users);
                    }
                    // console.log(user.contactList,userlist);
                }
            }
        });
    });
});

app.post('/register', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.register({username: username}, password, function (err, user) {
        if (err) { 
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, function () {
                current_user = username;
                current_user_email = username
                res.redirect('/chatting_page');
            })
        }
    })
});

app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    const user = new User({
        username: username,
        password: password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            current_user = username;
            current_user_email = username;            
            passport.authenticate('local')(req, res, function () {
                
                res.redirect("/chatting_page");
                
            });
        }
    })
});

// app.post('/chatting_page', function (req, res) {
//     // var tagname = req.body.tag;
//     var email = req.body.em;
//     console.log(tagname, email);
// })

var port = process.env.PORT || 3000;
http.listen(port, function () {
    console.log('The server has started successfully!');
});
