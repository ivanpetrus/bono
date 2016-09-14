/**
 * Created by ivanpetrus on 9/13/16.
 */
var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var MemoryDataStore = require('@slack/client').MemoryDataStore;

var _rtms = {};

var track_rtm = function (rtm, team_id) {
    _rtms[team_id] = rtm;
}

exports.connect = function (team) {

    var ds = require('../../data/ds');

    if (!_rtms[team.id]) {
        var rtm = new RtmClient(team.token, {
            logLevel: 'error', // check this out for more on logger: https://github.com/winstonjs/winston
            debug: true,
            dataStore: new MemoryDataStore() // pass a new MemoryDataStore instance to cache information
        });
        rtm.start();
        track_rtm(rtm, team.id);

        rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
            console.log('RTM client Connected');

        });

        rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
            rtm.send(message);
           // team_id: 'T252CCFH6', channel_id: 'D2AQBDTQT',
           // channel_name: 'directmessage',
           // user_id: 'U252CCFLG',
        });

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

exports.send_reminder_sucess_message = function (is_added, client_name, user_name, team_id) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        var channel = rtm.dataStore.getDMByName(user_name)
        if (is_added) {
            rtm.sendMessage(client_name + "! I added reporting time for user " + user_name, channel.id);
        }
        else {
            rtm.sendMessage(client_name + "! I updated reporting time for user " + user_name, channel.id);

        }
    }
    esle {console.error("could not find RTM for team: ",team_id);}
}

exports.send_error_message = function (team_id, user_name) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        var channel = rtm.dataStore.getDMByName(user_name)

        rtm.sendMessage("Ooops something where wrong, I will send report to my creators", channel.id);
    }
}

exports.send_message = function (mesage, user_name, team_id) {
    var rtm = _rtms[team_id];
    if (rtm != null) {
        var channel = rtm.dataStore.getDMByName(user_name)

        rtm.sendMessage(user_name+ ", "+ message, channel.id);
    }
}

