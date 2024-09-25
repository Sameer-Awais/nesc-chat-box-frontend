// global.ts

//dev

let root_address = "http://127.0.0.1:8000/"; // Ubuntu domain
// let root_address = "http://qmportal.nescom.gov/";
// let root_address='http://192.168.10.11:8001/';
// let root_address='http://130.1.1.34:8001/'; // Windows Domain

export const GlobalVariable = Object.freeze({
  // Rool URL
  ROOT_URL: root_address,
  Root_URL_Socket: "wss://192.168.11.225/sock/socket?&user_type=1&token=",
});
