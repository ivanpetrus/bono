/**
 * Created by ivanpetrus on 9/13/16.
 */
var mongoose = require("mongoose");
var url = 'mongodb://guest:guest@ds021026.mlab.com:21026/bono';

mongoose.Promise = global.Promise;

//connect to mongodb
mongoose.connect(url, function (err) {
    if (err != null) {
        console.error(err);
    }
    else {
        console.log("mongoose connected to: " + url);
    }
});

//CLIENT
var client_schema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    plan: {
        type: String,
        default: "free" //this field will be used for pricing plans like free, normal, premium etc...
    },
    reminders: {
        type: Array,
        default: []
    },
    mdate: {
        type: Date,
        default: Date.now()
    }
});

//TEAM will be multi- tenant
var reminder_schema = new mongoose.Schema({
    channel: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "none" // could be: [confirmed],[rejected],[none]
    },
    type: {
        type: String,
        default: "salutation" // here will be at list [mute], [salutation], [reminder]
    },
    time: {
        type: Number,
        default: 1000
    },
    mdate: {
        type: Date,
        default: Date.now()
    }
});

var team_schema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    token: String,
    user: String,
    url: String
})

//export functions
module.exports = {

    add_team: function (team, callback) {
        var tm = mongoose.model("team", team_schema);
        tm.findOne({id: team.id}, function (err, obj) {
            if (err != null) {
                console.error(err);
            }
            else if (obj != null) {
                obj.update({
                    token: team.token,
                    user: team.user,
                    url: team.url
                }, function (err, obj) {
                    if (err != null) {
                        console.error(err);
                    }
                    else if (callback != null) {
                        callback(obj);
                    }
                });
            }
            else {
                var t = new tm({
                    id: team.id,
                    token: team.token,
                    user: team.user,
                    url: team.url
                });
                t.save({new: true}, function (err, obj) {
                    if (err != null) {
                        console.error(err);
                    }
                    else if (callback != null) {
                        callback(obj);
                    }
                });
            }
        });
    },
    add_client: function (client, callback) {
        var cm = mongoose.model("client", client_schema);
        cm.findOne({email: client.email}, function (err, obj) {
            if (err != null) {
                console.error(err);
            }
            else if (obj != null) {
                obj.update({
                    reminders: client.reminders
                }, function (err, obj) {
                    if (err != null) {
                        console.error(err);
                    }
                    else if (callback != null) {
                        callback(obj);
                    }
                })
            } else {
                var c = new cm({
                    email: client.email,
                    reminders: client.reminders
                });
                c.save({new: true}, function (err, obj) {
                    if (err != null) {
                        console.error(err);
                    }
                    else if (callback != null) {
                        callback(obj);
                    }
                })
            }
        });
    },
    add_reminder_to_client_list: function (email, reminder_name, callback) {
        console.log("performing client reminder updation for user " + email);
        var cm = mongoose.model("client", client_schema);
        cm.findOne({email: email}, function (err, obj) {
            if (err!=null){console.error(err);}
            else if (obj!=null){
                if (obj.reminders.indexOf(reminder_name) ==-1){
                    obj.reminders.push(reminder_name);
                    obj.mdate = Date.now();
                    obj.save();
                }
            }
            if (callback!= null){
                callback(err,obj);
            }
        });
    },
    add_reminder: function (reminder, callback) {
        var rm = mongoose.model("reminder__" + reminder.team, reminder_schema);

        rm.findOne({channel: reminder.channel}, function (err, obj) {
            if (err != null) {
                console.error(err);
            }
            else if (obj != null) {
                obj.update({
                    status: reminder.status,
                    name: reminder.name,
                    time: reminder.time,
                    type: reminder.type,
                    mdate: Date.now()
                }, function (err, obj) {
                    if (err != null) {
                        console.error(err);
                    }
                    else if (callback != null) {
                        callback(obj);
                    }
                });
            } else {
                var r = new rm({
                    channel: reminder.channel,
                    status: reminder.status,
                    name: reminder.name,
                    time: reminder.time,
                    type: reminder.type,
                    mdate: Date.now()
                });
                r.save({new: true}, function (err, obj) {
                    if (err != null) {
                        console.error(err);
                    }
                    else if (callback != null) {
                        callback(obj);
                    }
                })
            }
        });
    },
    get_all_teams: function (callback) {
        var tm = mongoose.model("team", team_schema);
        tm.find({}, function (err, list) {
            if (err != null) {
                console.error(err);
            }
            if (callback != null) {
                callback(err, list);
            }
        })
    },
    get_team: function (team_id, callback) {
        var tm = mongoose.model("team", team_schema);
        tm.findOne({id:team_id}, function (err, obj) {
            if (err != null) {
                console.error(err);
            }
            if (callback != null) {
                callback(err, obj);
            }
        })
    },
    get_reminders: function (team_id,options, callback) {
        var rm = mongoose.model("reminder__" + team_id, reminder_schema);
        rm.find(options,function (err, array) {
            if (err !=null){console.error(err);}
            if (callback!=null){callback(err,array);}
        })
    }

};
