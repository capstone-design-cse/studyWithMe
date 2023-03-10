const express = require('express');
const { ExpressPeerServer } = require('peer');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);	// 세션 관련
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const methodOverride = require('method-override');
const cors = require('cors');

dotenv.config();
const apiRouter = require('./routes/api');
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const userPageRouter = require('./routes/userPage');
const studyGroupRouter = require('./routes/studyGroup');
const studyGroupPageRouter = require('./routes/studyGroupPage');
const eventsRouter = require('./routes/events');

const { sequelize } = require('./models');
const passportConfig = require('./passport');



/* --- server --- */

const app = express();
passportConfig();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const peerServer = ExpressPeerServer(server, {
	debug: true,
});

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'html');
nunjucks.configure('views', {
	express: app,
	watch: true,
});
sequelize.sync({ force: false })
	.then(() => {
		console.log('데이터베이스 연결 성공');
	})
	.catch((err) => {
		console.error(err);
	});


app.use(cors({
	credentials: true,
	origin: true, //'http://localhost:3001',
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	cookie: {
		httpOnly: false,
		secure: false,
	},
}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/test-page', express.static(path.join(__dirname, 'test-page')));
app.use('/datetimepicker', express.static(path.join(__dirname, 'datetimepicker')));

app.use(passport.initialize());
app.use(passport.session());
app.use('/peerjs', peerServer);



/* --- router --- */

app.use('/', pageRouter);
app.use('/api', apiRouter);
app.use('/events', eventsRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/my', userPageRouter);
app.use('/group', studyGroupRouter);
app.use('/study-group', studyGroupPageRouter);



app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
	res.status(err.status || 500);
	res.render('error');
});




/* --- chat, video chat --- */

io.on('connection', (socket) => {

	//msg chat
	socket['nickname'] = 'Anonymous';
	socket.on('enter_chat_room', (chatRoomName, done) => {
		socket.join(chatRoomName);
		done();
	});
	socket.on('new_message', (msg, room, done) => {

		socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
		done(); //triggers function located at frontend
	});
	socket.on('nickname', (nickname) => (socket['nickname'] = nickname));
	socket.on('new_notice', (msg, room, done) => {

		socket.to(room).emit('new_notice', `NOTICE: ${msg}`);
		done();
	});

	let room, id, name
	//video chat
	socket.on('join-room', (roomId, userId, userName) => {
		room = roomId
    	id = userId
    	name = userName

		socket.join(roomId);
		socket.to(roomId).emit('new-user-connected', { id: id, name: name }) 

		//chat
		socket.on('new-message', (sender, message, roomId, done) => {
			socket.to(roomId).emit('new-message', sender, `${name}: ${message}`);
			done(); //triggers function located at frontend
		}); 

		socket.on('disconnect', () => {
			socket.to(roomId).emit('user-disconnected', id);
			socket.to(roomId).emit('update-video', { id: id, name: name });
		});
	});

});

server.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 대기중');
});