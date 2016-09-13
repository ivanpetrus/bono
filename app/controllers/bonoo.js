/**
 * Created by ivanpetrus on 9/13/16.
 */
var _rtms ={};

var track_rtm = function(rtm,team_id){
    _rtms[team_id] = rtm;
}

exports.connect = function (team) {
    var RtmClient = require('@slack/client').RtmClient;
    var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
    var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
    var MemoryDataStore = require('@slack/client').MemoryDataStore;
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
        });

        rtm.on(RTM_EVENTS.BOT_ADDED,function () {
            var user = rtm.dataStore.getUserById(team.user);
            var channel = rtm.dataStore.getDMByName(user.name);
            rtm.sendMessage("Hello "+ user.name +"! I am bono, and I will help you to manage team", channel.id, null);
            ds.add_client({
                email: user.profile.email,
                reminders: []
            },function (obj) {

            })
        })
    }
}

