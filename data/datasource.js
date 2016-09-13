/**
 * Created by ivanpetrus on 9/5/16.
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
var client = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,

    },
    plan: {
        type: String,
        default: "free" //this field will be used for pricing plans like free, normal, premium etc...
    },
    msgtype: {
        type: String,
        default: "salutation" // here will be at list [mute], [salutation], [reminder]
    },
    teams: {
        type: Array,
        default: []
    }
});

//TEAM will be multi- tenant
var team = new mongoose.Schema({
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
    mDate: {
        type: Date,
        default: Date.now()
    }
});

var team_config = new mongoose.Schema({
    id: String,
    bot: {
        token: String,
        user_id: String,
        createdBy: String
    },
    createdBy: String,
    url: String,
    name: String
});

var team = new mongoose.Schema({
    id: {
        type: String,
        required:true,
        unique:true
    },
    token: String,
    user: String,
    url: String
})

//export functions
module.exports = {

    GetClientModel: function () {
        return mongoose.model("client", client);
    },

    GetTeamModel: function (name) {
        return mongoose.model("team__" + name, team);
    },

    GetClientModelByEmil: function (email, callback) {
        var cl = mongoose.model("client", client);
        //find particular client by email
        cl.findOne({email: email}, callback);
    },

    GetClientTeamModels: function (email, callback) {
        console.log("getting data for user: " + email);
        var cl = mongoose.model("client", client);
        //find particular client by email
        cl.findOne({email: email}, function (err, obj) {
            if (callback !== null) {
                var tenants = new Array();
                if (obj !== null) {
                    var tns = obj.teams;
                    //loop tenants from client tenants list
                    for (var i in tns) {
                        // for some reason index could be _path. I anyone could explain it ot me would be good.
                        // I will appreciated it.
                        if (i == "_path") {
                            continue;
                        }
                        var tnsobj = tns[i];
                        //for some reason element could be object. added check on string funct...
                        if (typeof tnsobj == "string" || tnsobj instanceof String) {
                            tenants.push(mongoose.model("team__" + tnsobj, team));
                        }
                    }
                }
                callback(err, tenants);
            }
        })
    },

    AddTeamToCLient: function (email, team) {
        var cl = mongoose.model("client", client);
        cl.findOne({email: email}, function (err, obj) {
            if (err != null) {
                console.error(err);
            }
            else if (obj != null) {
                if (obj.teams.indexOf(team) == -1) {
                    obj.teams.push(team);
                    obj.save(function (err, o) {
                        if (err != null) {
                            console.error(err);
                        }
                    });
                }
            }
            else {
                var client = new cl({
                    email: email,
                    teams: [team],
                });
                client.save();
            }
        });
    },

    AddTeamConfig: function (t_config) {
        var t_c = mongoose.model("team_config", team_config);
        t_c.findOne({id: t_config.id}, function (err, obj) {
            if (err != null) {
                console.error(err);
            }
            else if (obj != null) {

            } else {
                var ntc = new t_c({
                    id: t_config.id,
                    bot: {
                        token: t_config.token,
                        user_id: t_config.user_id,
                        createdBy: t_config.createdBy
                    },
                    createdBy: t_config.createdBy,
                    url: t_config.url,
                    name: t_config.name
                });
                ntc.save(function (err) {
                    if (err != null) {
                        console.error(err);
                    }
                })
            }
        })
    },
    GetTeamConfigs: function (callback) {
        var t_c = mongoose.model("team_config", team_config);
        t_c.find({}, function (err, arr) {
            if (err != null) {
                console.error(err);
            }
            else if (callback != null)
                callback(arr);
        });
    }
};
