/**
 * Created by ivanpetrus on 9/7/16.
 */
var cluster = require('cluster');
var db = require("./data/datasource");
var rtm = require("./rtm");

var loopinterval  = 1000;


/*message = {
    type: "task", //could be shutdown etc...,
    data: client, // list of teams,
    from: "master"// could be worker

}*/
function workwithteam(tmodel) {
    var time = parseInt(new Date().getHours().toString()+new Date().getMinutes().toString());
    var gt = time - 2;
    var lt = time + 2;

    tmodel.find({time: {$gt:gt,$lt:lt},status:"none"},function (err, arr) {
     if (err !==null){console.error(err);}
     else if (arr.length !=0){
       for(var i in arr){
           var record = arr[i];
           if (record.type =="salutation"){
               rtm.SendSalutationToUser(record.name,record.channel,function (err) {
                   if (err !=null){console.error(err);}
                   else{
                       record.update({type:"reminder"},function (err) {
                           if (err!=null){console.error(err);}
                       });
                       record.save();
                   }
               })
           } else if (record.type !=="mute"){
               rtm.SendReminder(record.name,record.channel, function (err) {
                   if (err!=null){console.error(err);}
                   else{record.update();}
               })
           }
         }
     }
    })
}
function dowork() {
    var tasks = [];

    process.on('message', function (message) { tasks.push(message); });

    setInterval(function () {
        if (tasks.length == 0) { return; }

        var task = tasks.pop();
        if (task.type == "task") {
            if (task.action !== null && task.from == "master"){

                db.GetClientTeamModels(task.data.email, function(err, arr){
                    if (err!==null){ console.error(err); }
                    else if (arr.length > 0){
                        for(var i in arr){
                            workwithteam(arr[i]);
                        }
                    }
                 });
            }
        }

    }, loopinterval);
}

exports.run = function () {


    if (cluster.isMaster) {


        var clmodel = db.GetClientModel();
        var numWorkers = 3;//require('os').cpus().length;

        console.log('Master cluster setting up ' + numWorkers + ' workers...');

        var wids = [];
        var cwid = 0;
        for (var i = 0; i < numWorkers; i++) {
            cluster.fork();
        }
        for(var wid in cluster.workers) {
            wids.push(wid);
        }

       setInterval(function () {
            var worker = cluster.workers[wids[cwid]];
            clmodel.find({},function (err, arr) {
                if (err !== null){console.error(err);}
                else if (arr.length > 0){
                    for (var i in arr){
                        var record = arr[i];
                        if (record.msgtype =="salutation"){
                            rtm.SendSlutationToOwner(record.email);
                            record.update({msgtype:"none"},function (err) {
                                if (err!=null){console.error(err);}
                            });
                            record.save();
                        }
                        if (record.teams.length > 0) {
                            worker.send({
                                type: "task",
                                from: "master",
                                data: record
                            });
                        }
                    }
                }
            });
            cwid++;
            if (cwid >= wids.length){ cwid = 0; }

       }, 5000);


        cluster.on('online', function (worker) {
            console.log('Worker ' + worker.process.pid + ' is online');
        });

        cluster.on('exit', function (worker, code, signal) {
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            console.log('Starting a new worker');
            cluster.fork();
        });


    } else { dowork();}
}


