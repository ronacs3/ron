/** 
 * Đây là file Javascript xử lý server 
 * Nhận cái gói tin + topic MQTT => gửi lên MySQL
 * Nhận cái gói tin + bản tin từ socket.io http => esp qua MQTT
 * Lấy dữ liệu từ MySQL => client qua socket.io (bản tin + gói tin)
 */
var express = require('express')  // Module xử lí chung
var mysql = require('mysql')      // Module cho phép sử dụng cơ sở dữ liệu mySQL 
var mqtt = require('mqtt')        // Module cho phép sử dụng giao thức mqtt

const app = express();
const http = require('http');

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// app.use('/tên thư mục', express.static('public')   gửi toàn bộ file từ thư mục " " đến thư mục public
app.use(express.static("public"))   // thư mục public nơi client: img,css,javascript...
// app.set("views engine", "ejs")
app.set("views", "./views")

app.get('/', function (req, res) {
    // res.render('home.ejs')
    res.sendFile(__dirname + "/views/index.html");
})

// khai báo port  http://localhost:3000/
var port = 3000
server.listen(port, function () {
    console.log('Server listening on port ' + port)
})

//khai báo kết nối mysql
var con = mysql.createConnection({ 
    host: "localhost",
    user: "root",
    password: "",
    database: "dbsensor"
});

//khai báo mqtt
var settings = {
    port: 1883,
    host: '172.20.10.14',
    keepalive: 1000,
};

// Kết nối đến MQTT
const client = mqtt.connect(settings);

client.subscribe("esp32/dulieu");  // topic MQTT nhận dữ liêu gồm (nhiệt độ, độ ẩm , ánh sáng) từ ESP32
client.on('connect', function (topic, message) {
    console.log('Connected MQTT!');

});

// Kết nối MySQL
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected MySQL!");

    var temp_esp;
    var humi_esp;
    var lux_esp;
    var dulieu;
    //Gọi kết nối MQTT
    client.on('message', function (topic, message) {
        console.log("------------------------------------");

        if (topic === "esp32/dulieu") {
            dulieu = JSON.parse(message.toString());    // chuyển dữ liệu về dạng JSON {["nhietdo":value,"doam":value, "anhsang":value]}
            temp_esp = dulieu.nhietdo;
            humi_esp = dulieu.doam;
            lux_esp = dulieu.anhsang;
        }
        // Lấy dữ liệu thành công từ MQTT => chuyển lên MySQL
        if (temp_esp != null && humi_esp != null && lux_esp != null) {
            //insert dữ liệu vào trong SQL
            var sql = `insert into sensor (temp,humi,lux) values (${temp_esp},${humi_esp},${lux_esp})`;
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("Data MySQL: ");
                console.log(temp_esp, humi_esp, lux_esp);
            });
        }

        // Lấy dữ liệu từ MySQL => giao diện client (socket.io)
        subdulieu(con, io);
        ////
    });
});


/*
        Khối nhận data từ MySQL xử lý và gửi cho giao diện WEB
*/
// Khai báo trước các mảng dữ liệu đồ thị tránh mảng chỉ có 1 dữ liệu
var hum_graph = [];
var tempt_graph = [];
var light_graph = [];
var times_graph = [];
// Hàm có nhiệm vụ gửi dữ liệu xử lý từ SQL và gửi đi đến giao diện
function subdulieu(con, io) {

    // var newid;
    var n = new Date()
    // var month = n.getMonth() + 1
    var times = n.getHours() + ":" + n.getMinutes() + ":" + n.getSeconds();

    // Lấy dữ liệu mới nhất từ SQL (lấy từ id lớn nhất).
    var sqlupdate = "SELECT * FROM sensor ORDER BY ID DESC limit 1"
    // Kết nối đến MySQL
    con.query(sqlupdate, function (err, result, fields) {
        if (err) throw err;
        result.forEach(function (value) {  // thực hiện hàm khi đc kết nối thành công (có nhận đc dữ liệu)
            //Tách lấy từng data sensor chuẩn JSON
            // Đẩy dữ liệu (nhiệt độ....) từ MySQL vào mảng để vẽ đồ thị
            // Kiểm tra lấy tối đa 10 phần tử mỗi mảng
            tempt_graph.push(value.temp); kiemtramang(tempt_graph);
            hum_graph.push(value.humi); kiemtramang(hum_graph);
            light_graph.push(value.lux); kiemtramang(light_graph);
            times_graph.push(times); kiemtramang(times_graph);
            console.log("Data send client: ")
            console.log(value.temp + " " + value.humi + " " + value.lux);

            // Tạo socket( bảng tin("server-.....") , gói tin ) gửi đến tất cả client connect
            io.emit('server-update-data', { temp_sql: value.temp, humi_sql: value.humi, lux_sql: value.lux, times })
            console.log('Gửi dữ liệu hiển thị')
            io.emit("server-send-graph", { Ctemp: tempt_graph, Chum: hum_graph, Clight: light_graph, Ctime: times_graph });
            console.log('Gửi mảng đồ thị');

        })


    });

}

/* 
    hối nhận từ (client) socket(bản tin) => (server) => topic() MQTT (esp32)
*/
// Socket bản tin từ client => server => esp32
io.on('connection', function (socket) {
    console.log("connected")
    //Show trạng thái ( kết nối/ngắt kết nối ) server localhost:3000
    socket.on('disconnect', function () {
        console.log("disconnected")
    })
    // Tên topic phải trùng với topic đã khai báo ở ESP32
    // button : điều khiển led
    var topic1 = "button";
    //Khi có bản tin socket (....) gửi từ client => publish topic (...) tương ứng về ESP32
    // Ví dụ :Khi client socket("Điều khiển LED", "trạng thái đèn")
    // Phía ESP32 nhận publish("tên topic","trạng thái đèn")
    socket.on("button", function (data) {
        client.publish(topic1);
        if (data == "on") {
            console.log('LED ON')
            client.publish(topic1, 'on');
        }
        else {
            console.log('LED OFF')
            client.publish(topic1, 'off');
        }
    })
})

// hàm ktra chỉ lấy 10 giá trị mảng
function kiemtramang(mang) {
    if (mang.length == 11) {
        mang.shift();       // độ dài mảng >10 xóa phần tử đầu 
    }
}