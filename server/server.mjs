import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express(); // สร้าง express app
const httpServer = createServer(app); // สร้าง http server จาก express app
const io = new Server(httpServer); // io คือ instance ของ socket.io

let clientResults = {}; // เก็บผลลัพธ์จากไคลเอนต์แต่ละตัว
let timeoutHandle; // เก็บ handle ของ timeout เพื่อใช้ในการยกเลิกถ้าจำเป็น

app.get('/', (req, res) => {
    res.send('Hello World! I am a server');
});

// ส่งหมายเลข 10 ไปยังทุก client
app.get('/api/calculate', (req, res) => {
    const numberToSend = 10; // ตัวเลขที่ต้องการส่ง
    io.emit('calculate', numberToSend);

    // ตั้งเวลา 2 วินาทีเพื่อรอผลลัพธ์จากไคลเอนต์
    timeoutHandle = setTimeout(() => {
        const totalResult = Object.values(clientResults).reduce((sum, val) => sum + val, 0);
        console.log(`Total result from all clients (after timeout): ${totalResult}`);
        clientResults = {}; // Reset clientResults สำหรับการคำนวณครั้งต่อไป
    }, 2000);

    res.send(`Number ${numberToSend} sent to all clients`);
});

app.get('/api/print-line', (req, res) => {
    console.log('-------------------');
    res.send('print-line API called');
});

// ส่งหมายเลขที่กำหนดไปยังทุก client
app.get('/api/calculate/:number', (req, res) => {
    const numberToSend = parseInt(req.params.number); // ตัวเลขที่ต้องการส่ง
    io.emit('calculate', numberToSend);

    // ตั้งเวลา 2 วินาทีเพื่อรอผลลัพธ์จากไคลเอนต์
    timeoutHandle = setTimeout(() => {
        const totalResult = Object.values(clientResults).reduce((sum, val) => sum + val, 0);
        const clientCount = Object.keys(clientResults).length;
        console.log(`Total result from ${clientCount} clients (after timeout): ${totalResult}`);
        clientResults = {}; // Reset clientResults สำหรับการคำนวณครั้งต่อไป
    }, 2000);

    res.send(`Number ${numberToSend} sent to all clients`);
});

io.on('connection', (socket) => {
    console.log(`a user connected with id: ${socket.id}`);

    socket.on('register', (clientName) => {
        socket.clientName = clientName; // เก็บ clientName ไว้ใน socket object
        console.log(`Client registered: ${clientName}`);
        socket.emit('greeting', `Hello, ${clientName}! Welcome to the server.`);
    });

    socket.on('disconnect', () => {
        console.log(`user with id: ${socket.id} disconnected`);
        delete clientResults[socket.clientName]; // ลบผลลัพธ์ของไคลเอนต์ที่ตัดการเชื่อมต่อออก
    });

    socket.on('calculateResult', ({ result, clientName }) => {
        console.log(`Received result from ${clientName}: ${result}`);
        clientResults[clientName] = result; // เก็บผลลัพธ์ใน clientResults

        // ถ้าผลลัพธ์มาจากไคลเอนต์ทุกตัวก่อนหมดเวลา ให้คำนวณผลรวมและยกเลิก timeout
        if (Object.keys(clientResults).length === io.of('/').sockets.size) {
            clearTimeout(timeoutHandle); // ยกเลิก timeout
            const totalResult = Object.values(clientResults).reduce((sum, val) => sum + val, 0);
            console.log(`Total result from all clients: ${totalResult}`);
            clientResults = {}; // Reset clientResults สำหรับการคำนวณครั้งต่อไป
        }
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

