http = require("http");

server_port = 8080

console.log('pid ' + process.pid);

var clients = {}
var queues = {
    'test' : ["{ 'status': 1 }", "{ 'status': 2 }"]
};

var server = http.createServer(function (req, res) {
    var commands = req.url.split('/');
    var queue = queues[commands[1]];
//    console.log(queues);
//    console.log(queue);
//    console.log(commands);
    
    if(req.method == 'GET' && queue) {
        console.log("Got GET from " + req.socket.remoteAddress);
        var queue_name = commands[1];
        var client_id = commands[2];

        var client = clients[client_id];

        res.writeHead('200', { "Content-Type": "text/javascript" });
        if(client) {
        
        } else {
            for(var i = 0; i < queue.length; i++) {
                res.write(queue[i] + "\n");
            }
            clients[client_id] = queue.length;
        }
        res.end();
    
    } else if (req.method == 'PUT') {
        console.log("Got PUT from " + req.socket.remoteAddress);
    
    } else {
        res.writeHead('404', { "Content-Type": "text/javascript" });
        res.end();
    }
   
//    console.log(clients);
});

server.listen(server_port, function () {
  console.log('Listening at http://127.0.0.1:'+server_port+'/');
});
