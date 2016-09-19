/**
 * Created by ivanpetrus on 9/15/16.
 */
var cluster = require('cluster');
var ds = require('../../data/ds');
var slacko = require('./bonoo');

var do_work = function () {
    var tasks = [];

    process.on('message', function (message) {
        tasks.push(message);
    });
    setInterval(function () {
        if (tasks.length == 0) {
            return;
        }
        var task = tasks.pop();
        if (task.type == "reminder") {
            var team = task.data;
            var ts = new Date();
            var time = 1234;//parseInt(ts.getHours().toString()+ts.getMinutes().toString());
            var gt = time - 2;
            var lt = time + 2;
            slacko.connect({
                id: team.id,
                token: team.token,
                user: team.user,
                url: team.url
            },function () {
                ds.get_reminders(team.id,{status:null, time:{$gt:gt,$lt:lt}}, function (err, array) {
                    if (array != null) {
                        for (c in array){
                            var item = array[c];
                            slacko.send_reminder_message("Hey "+ item.name +"! could you please report your hours " +
                                "into time reporting tools. after it just simply send me message yes or no",  team.id,item.name,item.channel);
                            item.status = "sent";
                            item.save();
                        }

                    }
                })
                ds.get_reminders(team.id,{time:{$gt:gt}}, function (err, array) {
                    if (array != null) {
                        for (c in array){
                            var item = array[c];
                            item.status = "none";
                            item.save();
                        }

                    }
                })
            });

        }
    }, 1000);
}

var do_master_work = function (worker) {
    ds.get_all_teams(function (err, array) {
        if (err == null && array != null) {
            for (var t in array) {
                var team = array[t];

                worker.send({
                    type: "reminder",
                    from: "master",
                    data: team
                })
            }
        }
    })
}

module.exports = {
    run: function () {

            if (cluster.isMaster) {
                var wids = [];
                var cwid = 0;

                var workers = 1//require('os').cpus().length;

                for (var i = 0; i < workers; i++) {
                    cluster.fork();
                }
                for (var wid in cluster.workers) {
                    wids.push(wid);
                }
                setInterval(function () {
                    var worker = cluster.workers[wids[cwid]];
                    if (worker) {
                        do_master_work(worker);
                    }
                    cwid++;
                    if (cwid >= wids.length) {
                        cwid = 0;
                    }
                }, 1000);
            }
            else {
                do_work();
            }
        }
}
