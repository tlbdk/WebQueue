var http = require("http");
var fs = require("fs");
var url = require('url'),

server_port = 8080

console.log('pid ' + process.pid);

var clients = {}
var queues = {
    'test' : [{ 'status': 1 }, { 'status': 2 }]
};
var waiting = {
    'test' : []
};

var server = http.createServer(function (req, res) {    
   
    // Handle all queue work
    if(req.url.match(/^queue/)) {
        var commands = req.url.split('/');
        var queue_name = commands[2];
        var client_id = commands[3];
        
        if(!queues[queue_name]) {
            res.writeHead(404, { "Content-Type": "text/javascript" });
            res.end();

        } else if(req.method == 'GET') {
            console.log("Got GET from " + req.socket.remoteAddress);
            res.writeHead(200, { "Content-Type": "text/javascript" });

            var last_i = clients[client_id];
            if(!last_i) {
                last_i = 0;
            }

            if(last_i < queues[queue_name].length) {
                res.write(JSON.stringify(queues[queue_name].splice(last_i)));
                res.end();
                clients[client_id] = queues[queue_name].length;
            } else {
                waiting[queue_name].push([client_id, res]);
            }
        
        } else if (req.method == 'POST') {
            req.setEncoding('utf8');
            req.body = '';
            console.log("Got POST from " + req.socket.remoteAddress);
            req.addListener('data', function(chunk) {
                this.body += chunk;
            });
            req.addListener('end', function() {
                console.log("got body: '" + this.body + "'");
                try {
                    items = JSON.parse(this.body);
                    console.log("Before:");
                    console.log(queues[queue_name]);
                    queues[queue_name] = queues[queue_name].concat(items);
                    // BUG HERE
                    console.log("After:");
                    console.log(queues[queue_name]);
                    while(client = waiting[queue_name].shift()) {
                        var client_id = client[0]; 
                        var client_res = client[1]; 
                        var last_i = clients[client_id];
                        if(last_i < queues[queue_name].length) {
                            client_res.write(JSON.stringify(queues[queue_name].splice(last_i)));
                            client_res.end();
                            clients[client_id] = queues[queue_name].length;
                        }
                    }
                    res.writeHead('200', { "Content-Type": "text/javascript" });
                    res.end("{status:'ok'}\n");          

                } catch(ex) {
                    console.log(ex);
                    console.log(ex.message);
                    res.writeHead('400', { "Content-Type": "text/javascript" });
                    res.end("{status:'not ok'}\n");          
                }
            });
        
        } else {
            res.writeHead('404', { "Content-Type": "text/javascript" });
            res.end();
        }

    // Handle serving static pages
    } else {
        // TODO Do propper validation of path so you can't do ../../
        var filepath;
        var mimetype;

        if(req.url == '/') {
            filepath = process.cwd() + "/index.html";
        } else {
            filepath = process.cwd() + req.url;
        }
       
        if(filepath.match(/\.css$/)) {
            mimetype = "text/css";
        } else if(filepath.match(/\.css$/)) {
            mimetype = "text/javascript";
        } else if(filepath.match(/\.html$/)) {
            mimetype = "text/html";
        } else {
            mimetype = "text/plain";
        }

        fs.stat(filepath, function(err, stats) {
            if(err) {
                console.log("Err " + req.url + " : " + filepath + " : " + mimetype);
                res.writeHead(404, { "Content-Type": "text/html" });
                res.end();
            } else {
                console.log("Get " + req.url + " : " + filepath + " : " + mimetype);
                fs.open(filepath, 'r', 0666, function(err, fd) {
                    res.writeHead(200, {'Content-Type': mimetype, 'Content-Length': stats.size});
                    fs.sendfile(req.socket.fd, fd, 0, stats.size, function() {
                        console.log("Sent: " + req.url + " : " + " : " + stats.size);
                        res.end();
                    }); 
                });
            }
        });
    }
});

server.listen(server_port, function () {
  console.log('Listening at http://127.0.0.1:'+server_port+'/');
});
