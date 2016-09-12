/**
 * Created by ivanpetrus on 9/6/16.
 */

var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var MemoryDataStore = require('@slack/client').MemoryDataStore;

var db = require("./data/datasource");

var token = ['xoxb-','76437444262-','96LyicC5nT0VN6lIfnyWqgRo'];


if (!global.rtm){
    global.rtm = new RtmClient(token[0]+token[1]+token[2], {
        logLevel: 'error', // check this out for more on logger: https://github.com/winstonjs/winston
        debug:true,
        dataStore: new MemoryDataStore() // pass a new MemoryDataStore instance to cache information
    });
    global.rtm.start();

}
var rtm = global.rtm;
/*var rtm = new RtmClient(token, {
    logLevel: 'error', // check this out for more on logger: https://github.com/winstonjs/winston
    debug:true,
    dataStore: new MemoryDataStore() // pass a new MemoryDataStore instance to cache information
});*/




rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    console.log('RTM client Connected');
});
/*
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function handleRTMAuthenticated() {
    console.log('RTM client authenticated!');
});
*/

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    ParseMesageFromChanel(message);
});

function GetNameandTime(text) {
   var name = text.match(/@\w+/g)[0].replace('@','');
    var tms = text.split(':');
    var tms = tms[tms.length-1].match(/\d+/g);
    return {
        name: name,
        time: parseInt(tms[0].toString() + tms[1].toString())
    };

}
function ManageTimeeOffset(time, clientOffset) {
    var serverDate = new Date(Date.now());
    var clientdate = new Date(clientOffset);

    var soffset = serverDate.getTimezoneOffset();
    var coffset = clientdate.getTimezoneOffset();

    var offset = (soffset - coffset)/60;


}
function ParseSetCommand(message) {

    var get = GetNameandTime(message.text);
    var name = get.name;
    var time = get.time;
    var member = rtm.dataStore.getUserById(name);
    var user = rtm.dataStore.getUserById(message.user);

    if (member !== null && typeof member !== "undefined") {


        var mchannel = rtm.dataStore.getDMByName(member.name);
        ManageTimeeOffset(time,member.tz_offset);
        var Team = db.GetTeamModel(message.team);
        Team.findOneAndUpdate({channel: mchannel.id}, {time: time}, function (err, obj) {
            if (err !== null) {
                console.error(err);
                rtm.sendMessage("Oops!, something where wrong inside, I will notify my creators " +
                    "about it", message.channel, null);
            }
            else if (obj != null) {
                db.AddTeamToCLient(user.profile.email, message.team);
                rtm.sendMessage("Done! reminder for user  @" + member.name + " has been updated", message.channel, null);
            }
            else {
                var t = new Team({
                    channel: mchannel.id,
                    name: member.name,
                    time: time
                });
                t.save(function (err) {
                    if (err !== null) {
                        console.error(err);
                        rtm.sendMessage("Oops!, something where wrong inside, I will notify my creators " +
                            "about it", channel, null);
                    } else {
                        db.AddTeamToCLient(user.profile.email, message.team);
                        rtm.sendMessage("Done! reminder for user  @" + member.name + " has been added", message.channel, null);

                    }
                })
            }
        });
    }
    else {
        rtm.sendMessage("I am sorry but i could not " +
            "find user by this name: " + name + "\n probably entered " +
            "email is not corrected", message.channel, null);
    }
}
function ParseMesageFromChanel(message) {
    if (message == null) {
        return;
    }

    var user = rtm.dataStore.getUserById(message.user);
    if (user ==null){return;}
    if (user.is_bot || user.name === "slackbot") {
        return;
    }

    if (user.is_owner) {

        if (message.text.indexOf("//set=") !== -1) {
            ParseSetCommand(message);
        }
    }

}

module.exports = {

    SendSlutationToOwner: function (email) {
        var user = rtm.dataStore.getUserByEmail(email);
        var channel = rtm.dataStore.getDMByName(user.name);
        rtm.sendTyping(channel.id);

        if (user.is_bot || user.name == "slackbot") {
            return;
        }

        rtm.sendMessage("Hello " + user.name + "! I am @bono," +
            " and i wil help you to manage time reporting in your team members.", channel.id, null);
        rtm.sendTyping(channel.id);
        rtm.sendMessage(user.name + ", Could you please send me the" +
            " appropriate time for asking about reported hours to your team members?", channel.id, null);
        rtm.sendTyping(channel.id);
        rtm.sendMessage("Please use the following command //set= @user:hh,mm ", channel.id, null);

    },

    SendSalutationToUser: function (name, channel, callback) {
        rtm.sendMessage("Hello! " + name + "! My name is @bono, I will remind you every day about reporting " +
            "hours into your reporting system", channel, callback);
    },
    SendReminder: function(name,channel,callback){

        var msg =
           'Hello '+name +'! Could you please tell me if you already reported hours in your ' +
            'time reporting system. Please yse the following commands: //yes, //no, //later in : minutes';
       rtm.sendMessage(msg,channel,callback);
    },


}
/*app.listen(port, function () {
 console.log('bot listening on port ' + port);
 setInterval(function () {
 sendIM();
 },1000);

 });

 */


