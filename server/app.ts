import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'graceful-fs';
import * as moment from 'moment';
import * as http from 'http';
import * as sio from 'socket.io';

import SocketIoService from './services/socket.io.service';
import fnSetRoutes from './routes';

const app = express();
const httpServer = http.createServer(app);
const io = sio.listen(httpServer, {
    // below are engine.IO options
    pingInterval: 1000,
    pingTimeout: 5000,
});

app.set('port', (process.env.PORT || 3000));
app.set('views', path.join(__dirname, '/assets/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/', express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

/*----- START: Logs File Configuration -----*/
const LOGS_FOLDER_PATH = '../../logs/';
const LOGS_DIR_PATH = path.join(__dirname, LOGS_FOLDER_PATH);
const CURRENT_DATE_FORMAT = 'YYYY_MM_DD';
if (!fs.existsSync(LOGS_DIR_PATH)) {
    fs.mkdirSync(LOGS_DIR_PATH);
}
const fnHookSTD = (std, callback, type): any => {
    std.write = (() => {
        return (string): any => {
            callback(string, type);
        };
    })();
};

const fnWriteLog = (s, type) => {
    const PP_CMD_LOGS_FILE_NAME = 'PP_LOGS_' + moment().utc().format(CURRENT_DATE_FORMAT) + '.txt';
    const access = fs.createWriteStream(LOGS_DIR_PATH + PP_CMD_LOGS_FILE_NAME, {flags: 'a+', encoding: 'utf8'});
    const dateFormat = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS');
    const msg = s.replace(/\[0m/gi, '').replace(//gi, '').replace(/\[3[0-9]m/gi, '');
    access.write(' [' + dateFormat + '] ' + '[' + type + '] ' + msg);
    access.end();
};

fnHookSTD(process.stdout, fnWriteLog, 'INFO');
fnHookSTD(process.stderr, fnWriteLog, 'ERROR');
app.get('/logs', function (req, res) {
    let DATE = moment().utc().format(CURRENT_DATE_FORMAT);
    if (req.query.date) {
        DATE = moment(req.query.date, CURRENT_DATE_FORMAT).format(CURRENT_DATE_FORMAT);
    }
    if (DATE === 'Invalid date') {
        res.status(500).send('Invalid date. Please try YYYY/MM/DD or YYYY-MM-DD');
    }
    const FILE_NAME = 'PP_LOGS_' + DATE + '.txt';
    if (fs.existsSync(LOGS_DIR_PATH + FILE_NAME)) {
        res.sendFile(LOGS_DIR_PATH + FILE_NAME);
    } else {
        res.status(500).send('Logs file not available for date ' + DATE + '.');
    }

});
/*----- END: Logs File Configuration -----*/

// Connect socket io
const socketIoService = new SocketIoService();
socketIoService.fnConnect(io);

// Set API routing
fnSetRoutes(app);

httpServer.listen(app.get('port'), () => {
    const msgStr = 'Angular Full Stack listening on port ' + app.get('port');
    console.log(msgStr);
});


/*----- START: Node Process events for get exceptions -----*/
process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'UNHANDLED REJECTION AT PROMISE', p);
    })
    .on('rejectionHandled', (p) => {
        console.error('REJECTION UNHANDLED', p);
    })
    .on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION : ', err);
    })
    .on('warning', (warning) => {
        console.error('WARNING : ', warning);
    });
/*----- END: Node Process events for get exceptions -----*/

export {app};
