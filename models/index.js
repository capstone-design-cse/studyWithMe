const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const studyGroup = require('./studyGroup');
const studyMember = require('./studyMember');
const studySchedule = require('./studySchedule');
const studyRule = require('./studyRule');
const user = require('./user');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.StudyGroup = studyGroup;
db.StudyMember = studyMember;
db.StudySchedule = studySchedule;
db.StudyRule = studyRule;
db.User = user;

studyGroup.init(sequelize);
studyMember.init(sequelize);
studySchedule.init(sequelize);
studyRule.init(sequelize);
user.init(sequelize);

studyGroup.associate(db);
studyMember.associate(db);
studySchedule.associate(db);
studyRule.associate(db);
user.associate(db);

module.exports = db;