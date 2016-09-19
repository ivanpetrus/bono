/**
 * Created by ivanpetrus on 9/13/16.
 */
var ds = require('../../data/ds');
global._rtms = {};
var _rtms = global._rtms;

console.log("process: " + process.pid)

var track_rtm = function (rtm, team_id) {
    _rtms[team_id] = rtm;
}

var handle_message = function (message) {

    if (message.text.toLowerCase().indexOf("yes")!=-1){
     ds.add_report(message.team,message.user.id,function (err, obj) {
         if (err){console.error(err);}
         else {

         }
     })
    }
}
exports.connect = function (team, callback) {
    // console.log("process: "+ process.pid)
    //  console.log("rtm: "+team.id+" is: " +(_rtms[team.id] !=null));
    if (!_rtms[team.id]) {
        var RtmClient = require('@slack/client').RtmClient;
        var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
        var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
        var MemoryDataStore = require('@slack/client').MemoryDataStore;

        console.log("new connection to slack for id :" + team.id);

        var rtm = new RtmClient(team.token, {
            logLevel: 'error', // check this out for more on logger: https://github.com/winstonjs/winston
            debug: true,
            dataStore: new MemoryDataStore() // pass a new MemoryDataStore instance to cache information
        });
        track_rtm(rtm, team.id);
        rtm.start();


        rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
            console.log('RTM client Connected');
            if (callback != null) {
                callback();
            }
        });

        rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
            //rtm.send(message);
            handle_message(message);

        });
        rtm.on(RTM_EVENTS);
        rtm.on(RTM_EVENTS.BOT_ADDED, function () {
            var user = rtm.dataStore.getUserById(team.user);
            var channel = rtm.dataStore.getDMByName(user.name);
            rtm.sendMessage("Hello " + user.name + "! I am bono, and I will help you to manage team", channel.id, null);
            ds.add_client({
                email: user.profile.email,
                reminders: []
            }, function (obj) {

            })

        })
    } else if (callback != null) {
        callback();
    }
}
exports.get_user_information = function (team_id, user_id) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        return rtm.dataStore.getUserById(user_id);
    }
}
exports.get_user_information_by_name = function (team_id, user_name) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        return rtm.dataStore.getUserByName(user_name);
    }
}
exports.get_channel = function (team_id, user_name) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        var user = rtm.dataStore.getUserByName(user_name);
        return rtm.dataStore.getDMByName(user.name);
    }
}

exports.send_reminder_sucess_message = function (team_id, client_name, user_name) {
    var rtm = _rtms[team_id];
    if (rtm) {
        var channel = exports.get_channel(team_id, client_name);
        rtm.sendMessage(client_name + "! I added reporting time for user " + user_name, channel.id);
    }
    else {
        console.error("could not find RTM for team: ", team_id);
    }
}
exports.send_error_message = function (team_id, user_name) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        var channel = exports.get_channel(team_id, user_name);// rtm.dataStore.getDMByName(user_name)

        rtm.sendMessage("Ooops something where wrong, I will send report to my creators", channel.id);
    }
}
exports.send_message = function (message, user_name, team_id) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        var channel = exports.get_channel(team_id, user_name);
        console.log("active channel: " + channel.id);
        rtm.sendMessage(user_name + ", " + message, channel.id);
    }
}
exports.send_reminder_message = function (message, team_id, channel_id) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        console.log("sending message to: " + channel_id);
        rtm.sendMessage(message, channel_id, function (err) {
            if (err) {
                console.error(err);
            }
            else {
                console.log("has been sent")
            }
        });
    }
}

