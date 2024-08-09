import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');
const clientName = 'hospital_1';
const clientNumber = 5;

socket.on('connect', () => {
  console.log('connected to server');
  socket.emit('register', clientName);
});

socket.on('greeting', (message) => {
  console.log(message);
});

socket.on('calculate', (number) => {
  const result = clientNumber + number;
  console.log(`Received number ${number} to calculate, result is ${result}`);
  setTimeout(() => {
    socket.emit('calculateResult', { result, clientName });
  }, 8000);

});

socket.on('disconnect', () => {
  console.log('disconnected from server');
});
