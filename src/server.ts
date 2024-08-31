import express from 'express';
import bodyParser from 'body-parser';
import { uploadMeasure, confirmMeasure, listMeasures } from './controllers/measureController';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/upload', uploadMeasure);
app.patch('/confirm', confirmMeasure);
app.get('/:customer_code/list', listMeasures);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
