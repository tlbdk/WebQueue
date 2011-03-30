http = require("http");

server_port = 8080

console.log('pid ' + process.pid);

var waiting = [];
var clients = {}
var queues = {
    'test' : ["{ 'status': 1 }", "{ 'status': 2 }"]
};

var server = http.createServer(function (req, res) {
    var commands = req.url.split('/');
    var queue_name = commands[1];
    var client_id = commands[2];
    var queue = queues[queue_name];
   
    if(!queue) {
        res.writeHead('404', { "Content-Type": "text/javascript" });
        res.end();

    } else if(req.method == 'GET') {
        console.log("Got GET from " + req.socket.remoteAddress);
        res.writeHead('200', { "Content-Type": "text/javascript" });

        var last_i = clients[client_id];
        if(!last_i) {
            last_i = 0;
        }

        if(last_i < queue.length) {
            res.write("[" + queue.splice(last_i).join(",") + "]\n");
            res.end();
            clients[client_id] = queue.length;
        } else {
            waiting.push([client_id, res]);
        }
    
    } else if (req.method == 'POST') {
        console.log("Got POST from " + req.socket.remoteAddress);
        req.addListener('data', function(chunk) {
            console.log("added data:" + chunk);
            queue.push(chunk); //TODO add to body and to queue in end 
        });
        req.addListener('end', function() {
            while(client = waiting.shift()) {
                var client_id = client[0]; 
                var client_res = client[1]; 
                var last_i = clients[client_id];
                client_res.write("[" + queue.splice(last_i).join(",") + "]\n");
                client_res.end();
                clients[client_id]++;
            }
        });
        res.writeHead('200', { "Content-Type": "text/javascript" });
        res.end("{status:'ok'}\n");          
    
    } else {
        res.writeHead('404', { "Content-Type": "text/javascript" });
        res.end();
    }
});

server.listen(server_port, function () {
  console.log('Listening at http://127.0.0.1:'+server_port+'/');
});
