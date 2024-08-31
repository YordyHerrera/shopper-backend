import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import measureRoutes from "./routes/measureRoutes";

dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use("/measures", measureRoutes);

export default app;
