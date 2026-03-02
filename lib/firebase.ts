import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyC3IRrNigZGef4uWZdBVjIaoZO3E6YteOo",
    authDomain: "finalproject13590243.firebaseapp.com",
    databaseURL: "https://finalproject13590243.firebaseio.com",
    projectId: "finalproject13590243",
    storageBucket: "finalproject13590243.firebasestorage.app",
    messagingSenderId: "626815428170",
    appId: "1:626815428170:web:dcc97d698fc98777f468b3"
};

// Initialize Firebase (Singleton pattern to prevent re-initializing in Next.js development mode)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
