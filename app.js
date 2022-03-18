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
const alert = require('alert');
// passport-local
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const nodemailer = require('nodemailer');
const { randomInt } = require('crypto');
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
    status: Boolean,
    googleId: String,
    contactList: Array,
    blokcedContacts: Array,
    groups: Array
});

const MessageSchema = new mongoose.Schema({
    sender: String,
    sender_username: String,
    receiver: String,
    messages: Array,
    sentHour: String,
    sentMinute: String,
    sentMonth: String,
    sentDate: String
});

const GroupSchema = new mongoose.Schema({
    groupName: String,
    groupAdmin: String,
    groupMembers: Array,
    groupMessages: Array
});

const OnlineSchema = new mongoose.Schema({
    userName:String,
    socketId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);
const Messages = new mongoose.model('Messages', MessageSchema);
const Groups = new mongoose.model('Groups',GroupSchema);
const Onlineusers = new mongoose.model('Onlineusers', OnlineSchema);

// User.collection.drop();
// Messages.collection.drop();
// Groups.collection.drop()
// Onlineusers.collection.drop();

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
    res.render('register',{err_message:""});
});

app.get('/login', function (req, res) {
    res.render('login',{err_message:""});
});

app.get('/about', function(req,res){
    res.render('about');
});

app.get('/submit', function (req, res) {
    res.render('submit');
});

app.get('/chatting_page', function (req, res) {
    var usrnme="";
    for (var i=0;i<current_user.length;i++){
        if (current_user[i]=="@"){
            current_user=usrnme;
            break;
        }
        usrnme+=current_user[i];
    }
    res.render('index.ejs', {username: current_user});
});
var userlist = [];
app.get('/logout', function (req, res) {
    req.logout();
    userlist[current_user_email]=false;
        User.findOne({'username':current_user_email},(err,user)=>{
            if (!err){
                if (user){
                    user.status = false;
                    user.save();
                }
            }
        });
        Onlineusers.deleteOne({ 'userName': current_user_email }, function (err) {
            if (err) return handleError(err);
          });
    current_user = "";
    current_user_email = "";
    res.redirect("/login");
})
app.get('/verify',function(req,res){
    res.render('verify');
})
app.get('/verification/:username/:password', function(req,res){
    User.register({username: req.params.username }, req.params.password, function (err, user) {
        if (err) throw err;
    });
    res.send('<script>window.location.href="http://ddm-chat.herokuapp.com/login";</script>');
});

var users = [];
var groups = [];
var msglist = [];
var grpmsglist = [];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
io.on('connection', function(socket) {
    
    socket.on('username', function(username) {
        var usrnme="";
        // console.log(current_user_email);
        Onlineusers.findOne({"userName":current_user_email},async function(err,onlineusers){
            if (!err){
                if (onlineusers){
                    onlineusers.socketId = socket.id;
                    userlist[onlineusers.userName] = onlineusers.socketId;
                    // console.log(userlist);
                    onlineusers.save();
                }
                else{
                
                    await Onlineusers.create({"userName":current_user_email,"socketId":socket.id});
                    Onlineusers.find({},function(err1,docs){
                        if (!err1){
                            docs.forEach(element => {
                                userlist[element.userName]=element.socketId;
                            });
                        }
                    });
                }
            }
        });
        
        for (var i=0;i<current_user.length;i++){
            if (current_user[i]=="@"){
                current_user=usrnme;
                break;
            }
            usrnme+=current_user[i];
        }
        socket.username = current_user;
        socket.email = current_user_email;
        socket.fff = false;
        socket.exists = false;
        socket.alreadyhavethatcontact = false;
        usernm = current_user;
        io.emit('is_online', socket.username,current_user_email);

        User.findOne({'username':this.email},(err,user)=>{
            if (!err){
                if (user){
                    user.status = true;
                    user.save();
                }
            }
        });

        User.findOne({'username':current_user_email}, (err,user)=>{
            if (!err) {
                if (user) {
                    users = [...user.contactList];
                    groups = [...user.groups];
                    io.to(userlist[current_user_email]).emit('update_userlist',users);
                    io.to(userlist[current_user_email]).emit('update_groups',groups);
                }
            }
        });
    });
    socket.on('disconnect', function(username) {
        userlist[current_user_email]=false;
        User.findOne({'username':current_user_email},(err,user)=>{
            if (!err){
                if (user){
                    user.status = false;
                    user.save();
                }
            }
        });
        Onlineusers.deleteOne({ 'userName': current_user_email }, function (err) {
            if (err) return handleError(err);
          });
        io.emit('is_online', '');
    });

    socket.on('group_chat', function(groupname,sender){
        io.to(userlist[sender]).emit('empty_msg_list');
        Groups.findOne({'groupName':groupname}, function(err,group){
            if (!err){
                if(group){
                    group.groupMessages = [...group.groupMessages];
                    group.groupMessages.forEach(messg => {
                        var usrnme="";
                            for (var i=0;i<messg.sender.length;i++){
                                if (messg.sender[i]=="@"){
                                    break;
                                }
                                usrnme+=messg.sender[i];
                            }
                        io.to(userlist[sender]).emit('get_offline_messages','<strong>' + usrnme + '</strong>: '+ messg.message,messg.sentDate,messg.sentHour,messg.sentMinute,months[Number(messg.sentMonth)]);
                    });
                    io.to(userlist[sender]).emit('show_offline_messages');
                }
            }
        });
        msglist[sender]="";
        grpmsglist[sender] = groupname;
    });

    socket.on('private_chat', (receiver,sender,sender_username)=>{
        io.to(userlist[sender]).emit('empty_msg_list');
        Messages.find({'sender':{$in: [receiver,sender]}},(err,obj)=>{
            if(!err){
                if (obj && userlist[sender]){
                    obj.forEach(msg => {
                        msg.messages = [...msg.messages];
                        msg.messages.forEach(messg => {
                            if ((sender==messg.receiver && receiver==messg.sender) || (sender==messg.sender && receiver==messg.receiver)){
                                

                                io.to(userlist[sender]).emit('get_offline_messages','<strong>' + msg.sender_username + '</strong>: '+ messg.message,messg.sentDate,messg.sentHour,messg.sentMinute,months[Number(messg.sentMonth)]);
                                
                            }
                        });
                        
                    });
                    io.to(userlist[sender]).emit('show_offline_messages');
                }
            }
        });

        
        Messages.create({ sender:sender,sender_username:sender_username,receiver:receiver }, function (err, sender,sender_username,receiver) {
            if (err) return handleError(err);
          });
        grpmsglist[sender]="";
        msglist[sender] = receiver;
    });
    socket.on('chat_message', function(message,cur_usr,private_chat,group_chat) {
        if (!message==''){
            var t_ = new Date();
            if (private_chat && userlist[msglist[cur_usr]] && !group_chat){
                Messages.findOne({'sender':cur_usr},(err,msg)=>{
                    if (!err){
                        if (msg){
                            msg.sender = cur_usr;
                            msg.sender_username = socket.username;
                            msg.receiver = msglist[cur_usr];
                            msg.sentHour = (Number(t_.getHours())+4).toString();
                            msg.sentMinute = t_.getMinutes();
                            msg.sentMonth = t_.getMonth();
                            msg.sentDate = Date.now();
                            msg.messages = [...msg.messages,{"message": message,"sender":cur_usr,"receiver":msglist[cur_usr],"sentDate":msg.sentDate,"sentHour":msg.sentHour,"sentMinute":msg.sentMinute,"sentMonth":msg.sentMonth}];
                            msg.save();
                        }
                    }
                });
                io.to(userlist[cur_usr]).emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message,socket.username,t_.getMinutes(),(Number(t_.getHours())+4).toString(),months[Number(t_.getMonth())]);
                if (msglist[msglist[cur_usr]]==cur_usr){
                    io.to(userlist[msglist[cur_usr]]).emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message,socket.username,t_.getMinutes(),(Number(t_.getHours())+4).toString(),months[Number(t_.getMonth())]);
                }
            }
            else if (!private_chat && !group_chat){
                io.to(userlist[cur_usr]).emit('chat_message', '<strong style="color:purple">Select a friend or a group to send a message!</strong>',socket.username);
            }
            else if (private_chat && !userlist[msglist[cur_usr]]){
                Messages.findOne({'sender':cur_usr},(err,msg)=>{
                    if (!err){
                        if (msg){
                            msg.sender = cur_usr;
                            msg.sender_username = socket.username;
                            msg.receiver = msglist[cur_usr];
                            msg.sentMinute = t_.getMinutes();
                            msg.sentHour = (Number(t_.getHours())+4).toString();
                            msg.sentMonth = t_.getMonth();
                            msg.sentDate = Date.now();
                            msg.messages = [...msg.messages,{"message": message,"sender":cur_usr,"receiver":msglist[cur_usr],"sentDate":msg.sentDate,"sentHour":msg.sentHour,"sentMinute":msg.sentMinute,"sentMonth":msg.sentMonth}];
                            msg.save();
                        }
                    }
                });
                io.to(userlist[cur_usr]).emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message,socket.username,t_.getMinutes(),(Number(t_.getHours())+4).toString(),months[Number(t_.getMonth())]);
            }
            else if (group_chat && !private_chat){
                Groups.findOne({'groupName':grpmsglist[cur_usr]}, function(err,group){
                    if (!err){
                        if (group){
                            
                            group.groupMessages = [...group.groupMessages, {"sender":cur_usr,"message":message,"sentDate":Date.now().toString(),"sentHour":(Number(t_.getHours())+4).toString(),"sentMinute":t_.getMinutes(),"sentMonth":t_.getMonth()}];
                            group.groupMembers.forEach(element => {
                                
                                if (grpmsglist[element.email]===grpmsglist[cur_usr]){
                                    io.to(userlist[element.email]).emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message,socket.username,t_.getMinutes(),(Number(t_.getHours())+4).toString(),months[Number(t_.getMonth())]);
                                }
                            });
                            io.to(userlist[group.groupAdmin]).emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message,socket.username,t_.getMinutes(),(Number(t_.getHours())+4).toString(),months[Number(t_.getMonth())]);
                            group.save();
                        }
                    }
                });

                
            }
        }
    });

    socket.on('addpersontogroup', function(groupname,addeduser,adder){
        User.findOne({'username':addeduser}, function(err,user){
            if (!err){
                if (!user){
                    socket.fff=true;
                    io.to(userlist[adder]).emit('chat_message', '<strong style="color:purple">That user doesnt exist!</strong>',socket.username)
                }
            }
        });
        if (!socket.fff){
            Groups.findOne({'groupName':groupname}, function(err,group){
                if (!err){
                    if (group){
                        
                        group.groupMembers = [...group.groupMembers]
                        group.groupMembers.forEach(element => {
                            if (element.email===addeduser){
                                socket.fff=true;
                                
                            }
                            
                        });
                        if (!socket.fff){
                            io.to(userlist[adder]).emit('chat_message', '<strong style="color:green">User was successfully added to the group!</strong>',socket.username)
                            group.groupMembers = [...group.groupMembers, {'email':addeduser}];  
                        }
                        else if (addeduser===adder){
                            io.to(userlist[adder]).emit('chat_message', '<strong style="color:purple">Cant add yourself into a group!</strong>',socket.username);
                        }
                        else if (socket.fff){
                            io.to(userlist[adder]).emit('chat_message', '<strong style="color:purple">That user is already in this group!</strong>',socket.username);
                        }
                        group.save();  
                    }
                }
            });
        }
        if (!socket.fff){
        User.findOne({'username':addeduser}, function(err,user){
            if (!err){
                if (user){
                    xxx=false;
                    user.groups = [...user.groups];
                    user.groups.forEach(element => {
                        if (element.groupname===groupname){
                            xxx=true;
                        }
                    });
                    if (xxx===false){
                        
                        user.groups = [...user.groups, {'groupname':groupname}];
                    }
                    groups = user.groups;
                    user.save();
                    io.to([userlist[addeduser]]).emit('update_groups', groups);
                }
            }
        });
    }
    socket.fff=false;
    });


    socket.on('add_group', function(groupname,cur_email){
        Groups.create({"groupName":groupname,"groupAdmin":cur_email}, function(err,groupName,groupAdmin){
            if (err) throw err;
        });
        User.findOne({'username':cur_email}, function(err,user){
            if (!err){
                if (user){
                    xxx=false;
                    user.groups = [...user.groups];
                    user.groups.forEach(element => {
                        if (element.groupname===groupname){
                            xxx=true;
                        }
                    });
                    if (xxx===true){
                        user.groups = [...user.groups, {'groupname':groupname+`${randomInt(9)}`}];
                    }
                    else{
                        user.groups = [...user.groups, {'groupname':groupname}];
                    }
                    groups = user.groups;
                    user.save();
                    
                    io.to([userlist[cur_email]]).emit('update_groups', groups);
                }
            }
        });
        
        
    });
    socket.on('add_contact', function(contact,cur_email){
        User.findOne({'username':contact}, (err,user)=>{
            if (!err){
                if (user){
                    
                    socket.exists=true;
                }
            }
        });
        User.findOne({'username':cur_email}, (err,user)=>{
            if (!err) {
                if (user) {
                    
                    if (socket.exists){
                        user.contactList = [...user.contactList];
                        user.contactList.forEach(element => {
                            if (element.email==contact){
                                socket.alreadyhavethatcontact=true;
                            }
                        });
                        if (!socket.alreadyhavethatcontact){
                            user.contactList = [...user.contactList, {"email": contact}];
                            user.save();
                            users = user.contactList;
                            io.to(userlist[cur_email]).emit('update_userlist',users);
                        }
                        else{
                            io.to(userlist[cur_email]).emit('chat_message', '<strong style="color:lightblue">Already have that contact!</strong>',socket.username);
                        }
                    }
                    else{
                        io.to(userlist[cur_email]).emit('chat_message', '<strong style="color:orange">Such user doesnt exist!</strong>',socket.username);
                    }
                }
            }
        });
        User.findOne({'username':contact}, (err,user)=>{
            if (!err) {
                if (user) {
                    if (socket.exists && !socket.alreadyhavethatcontact){
                        user.contactList = [...user.contactList, {"email": cur_email}];
                        user.save();
                        users = user.contactList;
                        io.to(userlist[contact]).emit('update_userlist',users);
                    }
                }
            }
        });
        socket.exists= false;
        socket.alreadyhavethatcontact = false;
    });
});

app.post('/register', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    
    if(password.length<8){
        res.render('register', {err_message:"Password cannot be less than 8 characters!"});
    }
    else{
        User.findOne({'username':username}, (err,user)=>{
            if (!err) {
                if (user) {
                    res.render('register', {err_message:"This user already exists!"});
                }
                if (!user){
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: 'ddmchatchattingapp@gmail.com',
                          pass: 'bhyvtrsyssvodveg'
                        }
                      });
                      let from = `DDMCHAT <m***@gmail.com>`
                    
                      var mailOptions = {
                        from: from,
                        to: username,
                        subject: 'EMAIL VERIFICATION',
                        html: `<h1>Conguratulations!</h1><br><h2>You successfully passed the authorization. Follow the link below to finish the authorization and enter the main page.<br> <a href="http://ddm-chat.herokuapp.com/verification/${username}/${password}">Chatting Page</a>`,
                      };
                      
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log('Email sent: ' + info.response);
                        }
                      });
                      res.render('verify');
                }
            }
        });
       
    }
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
            passport.authenticate('local',function (err,user) {
                if (!user){
                    res.render('login',{err_message:"Invalid Login credentials!"});
                }
                Onlineusers.findOne({"userName":current_user_email},function(err,onlineusers){
                    if (!err){
                        if (onlineusers){
                                res.render('login',{err_message:"This user is already logged in!"});
                        }
                        else{
                            res.redirect('/chatting_page');
                        }
                    }
                });
            })(req, res);
        }
    })
});


var port = process.env.PORT || 3000;
http.listen(port, function () {
    console.log('The server has started successfully!');
});
