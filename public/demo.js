//khai báo địa chỉ socket
var socket = io('http://localhost:3000');
//khai báo biến
var nhietdo;
var doam;
var anhsang;
//lấy dữ liệu từ client về giao diện từ qua server-update-data
socket.on("server-update-data", function (data) {
    // lấy dữ liệu data=[ temp_sql: "nhiệt độ", ...., ....]
    nhietdo = data.temp_sql;
    doam = data.humi_sql;
    anhsang = data.lux_sql;
    document.getElementById("Temp").innerHTML = nhietdo + '℃';
    document.getElementById("Humi").innerHTML = doam + '%';
    document.getElementById("Lux").innerHTML = anhsang + 'LUX';
    doimau(); // hàm thực hiện đổi màu theo giá trị biến nhớ tạm phía trên
})
//nhận dữ liệu gửi vào đồ thị
socket.on("server-send-graph", function (data) {
    bieudo.data.datasets[0].data = data.Ctemp;
    bieudo.data.datasets[1].data = data.Chum;
    bieudo.data.datasets[2].data = data.Clight;
    bieudo.data.labels = data.Ctime;
    bieudo.update();

})
//đồ thị
var bieudo = new Chart("myChart", {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: 'Temp',
            data: [],
            borderColor: "red",
            fill: false
        }, {
            label: 'Humi',
            data: [],
            borderColor: "blue",
            fill: false
        }, {
            label: 'Lux',
            data: [],
            borderColor: "yellow",
            fill: false
        }]
    },
    options: {
        // legend: { display: false },
        title: {
            display: true,
            text: "ĐỒ THỊ"
        },
        animations: {
            tension: {
                duration: 1000,
                easing: 'linear',
                from: 1,
                to: 0,
                loop: true
            }
        }
    }
});

function doimau() {
    // Đổi màu khối nhiệt độ
    if (nhietdo >= 35) {
        document.getElementById('box1').style.backgroundColor = '#86E3CE';
    }
    else if (nhietdo >= 25 && nhietdo < 35) {
        document.getElementById('box1').style.backgroundColor = '#A7D676';
    }
    else if (nhietdo < 25) {
        document.getElementById('box1').style.backgroundColor = "#E69D45";
    }
    // Khối độ ẩm  
    if (doam >= 60) {
        document.getElementById('box2').style.backgroundColor = '#BCE6FF';
    }
    else if (doam > 30 && doam < 60) {
        document.getElementById('box2').style.backgroundColor = '#1CA7EC';
    }
    else if (doam <= 30) {
        document.getElementById('box2').style.backgroundColor = "#478BA2";
    }
    // Khối ánh sáng
    if (anhsang > 60) {
        document.getElementById('box3').style.backgroundColor = '#F8D90F';
    }
    else if (anhsang > 30 && anhsang < 60) {
        document.getElementById('box3').style.backgroundColor = '#D3DD18';
    }
    else if (anhsang < 30) {
        document.getElementById('box3').style.backgroundColor = "#363331";
    }
}
//On-Off Light
function on() {
    if (confirm("Bạn muốn bật đèn!") == true) {
        document.getElementById("myImage").src = "bat.jpg"
        socket.emit("button", "on")
    }
}

function off() {
    if (confirm("Bạn muốn tắt đèn!") == true) {
        document.getElementById("myImage").src = "tat.jpg"
        socket.emit("button", "off")
    }
}