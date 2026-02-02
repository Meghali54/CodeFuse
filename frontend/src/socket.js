import { io } from 'socket.io-client';

// making a socket card kindaa things so that we could use our sockets information kindaa things anywhere if we need 
// we have this initSocket function defined here


export const initSocket =  () => {
  const options = {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ["websocket"],
  };
  console.log("Socket URL:", import.meta.env.VITE_BACKEND_URL);

  return io(import.meta.env.VITE_BACKEND_URL, options);
};