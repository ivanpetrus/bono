var Request = require('request')
var ds = require('../data/ds');

/* GET home page. */

module.exports = function(app) {
  //var slack = require('../app/controllers/bono')
  var slacko = require('../app/controllers/bonoo')
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

  app.post('reminder',function (req, resp) {

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
    },null);

    slacko.connect({
      id:team.id,
      token:team.bot.token,
      user: team.createdBy,
      url: team.url
    });
  }


  // START existing bots

  var start_existing_bots = function () {
    ds.get_all_teams(function (list) {
      for(var t in list){
        var team = list[t];
        slacko.connect({
          id:team.id,
          token:team.token,
          user:team.user,
          url: team.url
        });
      }
    })
  }

  start_existing_bots();

}

