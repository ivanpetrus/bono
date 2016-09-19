var Request = require('request');
var cluster = require('cluster');
var slacko = require('../app/controllers/bonoo');
var ds = require('../data/ds');
var SLACK_VER_TOKEN = "QC1xodgjZRUwlySDLnIxCm6F";
/* GET home page. */

module.exports = function (app) {
    //var slack = require('../app/controllers/bono')

    app.get('/', function (req, res, next) {
        res.render('index', {
            title: 'Express',
            body: '<a href="https://slack.com/oauth/authorize?scope=incoming-webhook,commands,bot&client_id=73080423584.76452695378"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>'
        });
    });

    app.get('/new', function (req, res) {
        console.log("================== START TEAM REGISTRATION ==================")
        //temporary authorization code
        var auth_code = req.query.code

        if (!auth_code) {
            //user refused auth
            res.redirect('/')
        }
        else {
            console.log("New user auth code " + auth_code)
            perform_auth(auth_code, res)
        }
    })

    app.post('/reminder', function (req, resp) {
        if (req.body != null) {
            var token = req.body.token;
            var command = req.body.command;
            if (token == SLACK_VER_TOKEN && command == "/reminder") {

                var text = req.body.text;
                var user_id = req.body.user_id;
                var team_id = req.body.team_id;

                var mname = text.match(/@\w+/g)[0].replace('@', '');
                var tstring = text.split('=')[1].match(/\d+/g);

                ds.get_team(team_id, function (obj) {
                    if (!obj){
                        console.log("I could not fnd the team for id:" + team_id);
                        return;
                    }
                    slacko.connect(obj, function () {
                        var user = slacko.get_user_information(team_id, user_id);
                        var tmember = slacko.get_user_information_by_name(team_id, mname);
                        if (user != null & tmember != null) {
                           var server_offset = new Date().getTimezoneOffset();
                            console.log("timezone offset: " + tmember.tz_offset);
                            console.log("server timezone offset:" + server_offset );
                            console.log("diff: " + tmember.tz_offset -server_offset)
                            slacko.send_message("I will work on it, also i wil let you know once it will be done", user.name, team_id);

                            try {
                                var channel = slacko.get_channel(team_id, tmember.name);
                                ds.add_reminder({
                                    team: team_id,
                                    channel: channel.id,
                                    name: tmember.name,
                                    status: "none",
                                    time: parseInt(tstring[0].toString() + tstring[1].toString())
                                }, function (obj) {

                                    if (obj != null) {
                                        ds.add_reminder_to_client_list(user.profile.email, team_id, function (err, obj) {
                                            if (err != null) {
                                                console.error(err);
                                                slacko.send_error_message(team_id, user.name);
                                            }
                                            else {
                                                console.log("sending sucess message to " + user.name + " in team: " + team_id);
                                                slacko.send_reminder_sucess_message(team_id, user.name, tmember.name);
                                            }
                                        });
                                    }
                                    else {
                                        console.error("reminder object is null")
                                    }
                                });
                            }
                            catch (err) {
                                console.error(err);
                                slacko.send_error_message(team_id, user_id.name);
                            }
                        }
                    });
                });
            }
            resp.sendStatus(200);
        }
    })

    app.post('/interactive', function (req, resp) {

    })

//CREATION ===================================================

    var perform_auth = function (auth_code, res) {
        //post code, app ID, and app secret, to get token
        var auth_adresse = 'https://slack.com/api/oauth.access?'
        auth_adresse += 'client_id=' + process.env.SLACK_ID
        auth_adresse += '&client_secret=' + process.env.SLACK_SECRET
        auth_adresse += '&code=' + auth_code
        auth_adresse += '&redirect_uri=' + process.env.SLACK_REDIRECT + "new"

        Request.get(auth_adresse, function (error, response, body) {
            if (error) {
                console.error(error)
                res.sendStatus(500)
            }

            else {
                var auth = JSON.parse(body)
                console.log("New user auth")
                console.log(auth)

                register_team(auth, res)
            }
        })
    }

    var register_team = function (auth, res) {
        //first, get authenticating user ID
        var url = 'https://slack.com/api/auth.test?'
        url += 'token=' + auth.access_token

        Request.get(url, function (error, response, body) {
            if (error) {
                console.error(error)
                res.sendStatus(500)
            }
            else {
                try {
                    var identity = JSON.parse(body)
                    console.log(identity)

                    var team = {
                        id: identity.team_id,
                        bot: {
                            token: auth.bot.bot_access_token,
                            user_id: auth.bot.bot_user_id,
                            createdBy: identity.user_id
                        },
                        createdBy: identity.user_id,
                        url: identity.url,
                        name: identity.team
                    }
                    start_bot(team)
                    res.send("Your bot has been installed")
                }
                catch (e) {
                    console.error(e)
                }
            }
        })
    }

    var start_bot = function (team) {
        console.log(team.name + " start bot")

        ds.add_team({
            id: team.id,
            token: team.bot.token,
            user: team.createdBy,
            url: team.url
        }, null);

        slacko.connect({
            id: team.id,
            token: team.bot.token,
            user: team.createdBy,
            url: team.url
        });
    }

}

